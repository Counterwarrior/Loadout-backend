// extractColours.js
// Usage: node extractColours.js
// Prints all unique colors used in the Skin collection

require('dotenv').config();
const mongoose = require('mongoose');

const skinSchema = new mongoose.Schema({
  name: String,
  weapon: String,
  side: String,
  colors: [String],
  price: Number,
  type: String,
  imageUrl: String,
});
const Skin = mongoose.model('Skin', skinSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const colors = await Skin.distinct('colors');
    console.log('Unique colors in Skin collection:');
    console.log(colors);
  } catch (err) {
    console.error('Error extracting colors:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
