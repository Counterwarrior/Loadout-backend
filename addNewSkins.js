require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

// Define your schema/model (same as seed.js)
const skinSchema = new mongoose.Schema({
  name: String,
  market_hash_name: String,
  weapon: String,
  side: String,
  colors: [String],
  currency: Number, // always 1 (USD)
  price: Number, // fetched price from Steam
  type: String,
  imageUrl: String,
});
const Skin = mongoose.model('Skin', skinSchema);

// Add new skins here
const newSkins = [

];

// Helper to fetch price from Steam Market API with fallback to median price from listing page
async function fetchSteamPrice(skin) {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(skin.market_hash_name)}`;
  try {
    const res = await axios.get(url);
    if (res.data && (res.data.lowest_price || res.data.median_price)) {
      // Use lowest_price if available, otherwise median_price
      const priceStr = res.data.lowest_price || res.data.median_price;
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      return price;
    }
  } catch (err) {
    console.log(`Error fetching price for ${skin.market_hash_name}:`, err.message);
  }
  return null;
}

async function addNewSkins() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  for (const skin of newSkins) {
    // Wait 5 seconds between API calls
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch price from Steam with fallback
    let fetchedPrice = await fetchSteamPrice(skin);
    if (fetchedPrice !== null) {
      skin.price = fetchedPrice;
      console.log(`Fetched price for ${skin.market_hash_name}: $${fetchedPrice}`);
    } else {
      console.log(`Could not fetch price for ${skin.market_hash_name}, keeping price as ${skin.price}`);
    }

    // Upsert skin: insert if new, update price if exists
    await Skin.updateOne(
      { market_hash_name: skin.market_hash_name },
      {
        $set: { price: skin.price },
        $setOnInsert: {
          name: skin.name,
          market_hash_name: skin.market_hash_name,
          weapon: skin.weapon,
          side: skin.side,
          colors: skin.colors,
          currency: skin.currency,
          type: skin.type,
          imageUrl: skin.imageUrl
        }
      },
      { upsert: true }
    );
    console.log(`Upserted skin: ${skin.market_hash_name}`);
  }

  console.log('All new skins processed!');
  mongoose.disconnect();
}

addNewSkins();

