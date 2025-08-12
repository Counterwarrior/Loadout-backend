
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio'); // npm install cheerio
require('dotenv').config();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const skinSchema = new mongoose.Schema({
  name: String,
  market_hash_name: String,
  weapon: String,
  side: String,
  colors: [String],
  currency: Number,
  type: String,
  imageUrl: String,
  price: Number,
});
const Skin = mongoose.model('Skin', skinSchema);


async function updatePrices() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const skins = await Skin.find({});
  for (const skin of skins) {
    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=${skin.currency}&market_hash_name=${encodeURIComponent(skin.market_hash_name)}`;
    try {
      const res = await axios.get(url);
      if (res.data && (res.data.lowest_price || res.data.median_price)) {
        // Use lowest_price if available, otherwise median_price
        const priceStr = res.data.lowest_price || res.data.median_price;
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        await Skin.updateOne({ _id: skin._id }, { price });
        console.log(`Updated ${skin.name}: $${price}`);
      } else {
        // Fallback: fetch market page and parse median price from price graph
        const listingUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.market_hash_name)}`;
        try {
          const htmlRes = await axios.get(listingUrl);
          const $ = cheerio.load(htmlRes.data);
          // Look for price history graph data
          const scriptTags = $('script');
          let foundMedian = false;
          scriptTags.each((i, el) => {
            const script = $(el).html();
            if (script && script.includes('var line1=')) {
              // Debug: print the script tag content length
              console.log(`[DEBUG] Found script with line1=, length: ${script.length}`);
              // Try to extract the price history array robustly
              let match = script.match(/var line1=(\[.*?\]);/s);
              if (!match) {
                // Try to extract with single quotes
                match = script.match(/var line1='(\[.*?\])';/s);
              }
              if (match && match[1]) {
                let priceHistoryRaw = match[1];
                // Try to fix single quotes to double quotes if needed
                if (priceHistoryRaw.includes("'")) {
                  priceHistoryRaw = priceHistoryRaw.replace(/'/g, '"');
                }
                try {
                  const priceHistory = JSON.parse(priceHistoryRaw);
                  // priceHistory is an array of [date, median, volume]
                  if (Array.isArray(priceHistory) && priceHistory.length > 0) {
                    // Use the most recent median price
                    let lastMedian = priceHistory[priceHistory.length - 1][1];
                    console.log(`[DEBUG] lastMedian value:`, lastMedian, 'type:', typeof lastMedian);
                    let price;
                    if (typeof lastMedian === 'string') {
                      price = parseFloat(lastMedian.replace(/[^0-9.]/g, ''));
                    } else if (typeof lastMedian === 'number') {
                      price = lastMedian;
                    } else {
                      price = NaN;
                    }
                    if (!isNaN(price)) {
                      Skin.updateOne({ _id: skin._id }, { price }).then(() => {
                        console.log(`(Fallback) Updated ${skin.name}: $${price}`);
                      });
                      foundMedian = true;
                    } else {
                      console.log(`[DEBUG] Could not parse price from lastMedian:`, lastMedian);
                    }
                  } else {
                    console.log(`[DEBUG] priceHistory array empty or invalid`);
                  }
                } catch (e) {
                  console.log(`[DEBUG] Error parsing priceHistory JSON:`, e.message);
                }
              } else {
                console.log(`[DEBUG] Could not match price history array in script`);
              }
            }
          });
          if (!foundMedian) {
            console.log(`No price found for ${skin.name} (even with fallback)`);
          }
        } catch (err2) {
          console.log(`Error fetching fallback price for ${skin.name}:`, err2.message);
        }
      }
    } catch (err) {
      console.log(`Error fetching price for ${skin.name}:`, err.message);
    }
    // Wait 2 seconds before next request
    await sleep(5000);
  }
  mongoose.disconnect();
}

updatePrices();
