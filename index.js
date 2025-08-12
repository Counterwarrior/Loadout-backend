

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const app = express();

// CORS must be first, before any routers or routes
app.use(cors());

// Middleware
app.use(bodyParser.json());

// Custom Loadout Builder API (separate logic)
const customLoadoutRouter = require('./customLoadout');
app.use(customLoadoutRouter);



// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Sample Skin Schema
const skinSchema = new mongoose.Schema({
  name: String,
  weapon: String,
  side: String, // 'ct', 't', or 'both'
  colors: [String],
  price: Number,
  type: String, // 'knife', 'gloves', etc.
  imageUrl: String,
});
const Skin = mongoose.models.Skin || mongoose.model('Skin', skinSchema);

// Utility function to filter out all StatTrak knives (with or without ™)
function isNormalKnife(skin) {
  return skin.type === 'knife' && !/StatTrak/i.test(skin.name);
}

// POST /api/generate-loadout

app.post('/api/generate-loadout', async (req, res) => {
  if (req.body.shuffle === true) {
    // --- SHUFFLE LOGIC: Isolated from normal logic ---
    const { side, budget, color, include } = req.body;
    let weaponSlots = [];
    if (side === 'both') {
      const hasKnife = include && include.includes('knife');
      const hasGloves = include && include.includes('gloves');
      if (hasKnife && hasGloves) {
        weaponSlots = [
          { type: 'gloves', percent: 10 },
          { type: 'knife', percent: 10 },
          { weapon: 'M4A4', percent: 6 },
          { weapon: 'M4A1', percent: 6 },
          { weapon: 'AWP', percent: 6 },
          { weapon: 'USP-S', percent: 6 },
          { weapon: 'Desert Eagle', percent: 6 },
          { weapon: 'Zeus', percent: 4 },
          { weapon: 'UMP-45', percent: 4 },
          { weapon: 'P90', percent: 4 },
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 2 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
          { weapon: 'AK-47', percent: 7 },
          { weapon: 'Galil', percent: 5 },
          { weapon: 'Glock-18', percent: 6 },
          { weapon: 'SG553', percent: 2 },
          { weapon: 'MAC-10', percent: 4 },
        ];
      } else if (hasKnife || hasGloves) {
        weaponSlots = [
          { type: hasKnife ? 'knife' : 'gloves', percent: 15 },
          { weapon: 'M4A4', percent: 6 },
          { weapon: 'M4A1', percent: 6 },
          { weapon: 'AWP', percent: 6 },
          { weapon: 'USP-S', percent: 6 },
          { weapon: 'Desert Eagle', percent: 7 },
          { weapon: 'Zeus', percent: 4 },
          { weapon: 'UMP-45', percent: 4 },
          { weapon: 'P90', percent: 4 },
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 2 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
          { weapon: 'AK-47', percent: 7 },
          { weapon: 'Galil', percent: 7 },
          { weapon: 'Glock-18', percent: 6 },
          { weapon: 'SG553', percent: 2 },
          { weapon: 'MAC-10', percent: 4 },
        ];
      } else {
        weaponSlots = [
          { weapon: 'M4A4', percent: 8 },
          { weapon: 'M4A1', percent: 10 },
          { weapon: 'AWP', percent: 8 },
          { weapon: 'USP-S', percent: 8 },
          { weapon: 'Desert Eagle', percent: 8 },
          { weapon: 'Zeus', percent: 4 },
          { weapon: 'UMP-45', percent: 4 },
          { weapon: 'P90', percent: 4 },
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 2 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
          { weapon: 'AK-47', percent: 10 },
          { weapon: 'Galil', percent: 8 },
          { weapon: 'Glock-18', percent: 8 },
          { weapon: 'SG553', percent: 2 },
          { weapon: 'MAC-10', percent: 4 },
        ];
      }
    } else if (side === 'ct') {
      weaponSlots = [
        { weapon: 'M4A4', percent: 12 },
        { weapon: 'M4A1', percent: 12 },
        { weapon: 'AWP', percent: 10 },
        { weapon: 'USP-S', percent: 10 },
        { weapon: 'Desert Eagle', percent: 10 },
        { weapon: 'Zeus', percent: 6 },
        { weapon: 'UMP-45', percent: 6 },
        { weapon: 'P90', percent: 6 },
        { weapon: 'Five-Seven', percent: 6 },
        { weapon: 'AUG', percent: 4 },
        { weapon: 'MP9', percent: 6 },
        { weapon: 'P250', percent: 6 },
      ];
      if (include && include.includes('knife')) weaponSlots.unshift({ type: 'knife', percent: 10 });
      if (include && include.includes('gloves')) weaponSlots.unshift({ type: 'gloves', percent: 10 });
    } else if (side === 't') {
      weaponSlots = [
        { weapon: 'AK-47', percent: 12 },
        { weapon: 'Galil', percent: 10 },
        { weapon: 'AWP', percent: 10 },
        { weapon: 'Glock-18', percent: 10 },
        { weapon: 'Desert Eagle', percent: 10 },
        { weapon: 'Zeus', percent: 6 },
        { weapon: 'UMP-45', percent: 6 },
        { weapon: 'P90', percent: 6 },
        { weapon: 'Tec-9', percent: 6 },
        { weapon: 'MAC-10', percent: 6 },
        { weapon: 'SG553', percent: 4 },
        { weapon: 'Five-Seven', percent: 4 },
      ];
      if (include && include.includes('knife')) weaponSlots.unshift({ type: 'knife', percent: 10 });
      if (include && include.includes('gloves')) weaponSlots.unshift({ type: 'gloves', percent: 10 });
    }

    // Slot budgets
    function getRandomPercent(base, idx) {
      if (idx < 5) {
        return base + (Math.random() * 8 - 4); // ±4%
      } else {
        return base + (Math.random() * 4 - 2); // ±2%
      }
    }
    let slotBudgets = weaponSlots.map((slot, idx) => ({
      ...slot,
      slotBudget: Math.floor((getRandomPercent(slot.percent, idx) / 100) * budget)
    }));

    // Build base query for this side
    let baseQuery = {
      $and: [
        { price: { $lte: budget } },
      ]
    };
    if (side === 'both') baseQuery.$and.push({ $or: [ { side: 'ct' }, { side: 't' }, { side: 'both' } ] });
    else if (side === 'ct') baseQuery.$and.push({ $or: [ { side: 'ct' }, { side: 'both' } ] });
    else if (side === 't') baseQuery.$and.push({ $or: [ { side: 't' }, { side: 'both' } ] });
    if (color) baseQuery.$and.push({ colors: { $in: [color] } });
    if (include && Array.isArray(include)) {
      let types = [];
      if (include.includes('knife')) types.push('knife');
      if (include.includes('gloves')) types.push('gloves');
      if (types.length > 0) baseQuery.$and.push({ type: { $in: types.concat(['rifle','pistol','sniper']) } });
      else baseQuery.$and.push({ type: { $nin: ['knife','gloves'] } });
    }

    // Wear order and weighted random
    const wearOrder = [
      'Factory New',
      'Minimal Wear',
      'Field-Tested',
      'Well-Worn',
      'Battle-Scarred'
    ];
    function weightedWearIndex(groups) {
      const weights = [0.3, 0.4, 0.3];
      let r = Math.random();
      let acc = 0;
      for (let i = 0; i < groups.length && i < 3; i++) {
        acc += weights[i];
        if (r < acc) return i;
      }
      return groups.length - 1;
    }

    let selected = [];
    let total = 0;
    let slotResults = [];
    for (let i = 0; i < slotBudgets.length; i++) {
      let slot = slotBudgets[i];
      let slotQuery = JSON.parse(JSON.stringify(baseQuery));
      if (slot.type) {
        slotQuery.$and.push({ type: slot.type });
      } else if (slot.weapon) {
        slotQuery.$and = slotQuery.$and.filter(q => !q.type);
        slotQuery.$and.push({ weapon: slot.weapon });
      }
      // Prevent overpriced skin, special cap for knife/gloves
      let priceCap;
      if (slot.type === 'knife' || slot.type === 'gloves') {
        // 50-60% of total budget for knife/gloves
        priceCap = Math.floor((0.5 + Math.random() * 0.1) * budget);
        slotQuery.$and.push({ price: { $lte: priceCap } });
      } else {
        // For other slots, price must be between 3% and a random 5–30% of budget, and never above slot's random budget or 30% of budget
        const minPercent = 0.03;
        const maxPercent = 0.3;
        const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);
        const minPrice = Math.floor(minPercent * budget);
        const maxPrice = Math.floor(randomPercent * budget);
        priceCap = Math.floor(0.3 * budget);
        slotQuery.$and.push({ price: { $gte: minPrice, $lte: Math.min(slot.slotBudget, maxPrice, priceCap) } });
      }
      let skin = null;
      if (slot.type === 'knife' || slot.type === 'gloves') {
        const count = await Skin.countDocuments(slotQuery);
        console.log(`[SHUFFLE DEBUG] Query for ${slot.type}:`, JSON.stringify(slotQuery));
        console.log(`[SHUFFLE DEBUG] Matching ${slot.type} count:`, count);
        let allItems = await Skin.find(slotQuery);
        if (slot.type === 'knife') allItems = allItems.filter(isNormalKnife);
        // Group by wear
        let groupedByWear = wearOrder.map(wear =>
          allItems.filter(skin => skin.name.includes(wear))
        ).filter(group => group.length > 0);
        let wearIdx = groupedByWear.length > 1 ? weightedWearIndex(groupedByWear) : 0;
        let wearGroup = groupedByWear[wearIdx] || [];
        let skinIdx = wearGroup.length > 0 ? Math.floor(Math.random() * wearGroup.length) : 0;
        skin = wearGroup[skinIdx];
      } else {
        let allSkins = await Skin.find(slotQuery);
        allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
        // Group by wear
        let groupedByWear = wearOrder.map(wear =>
          allSkins.filter(skin => skin.name.includes(wear))
        ).filter(group => group.length > 0);
        let wearIdx = groupedByWear.length > 1 ? weightedWearIndex(groupedByWear) : 0;
        let wearGroup = groupedByWear[wearIdx] || [];
        let skinIdx = wearGroup.length > 0 ? Math.floor(Math.random() * wearGroup.length) : 0;
        skin = wearGroup[skinIdx];
      }
      if (skin && total + skin.price <= budget) {
        selected.push(skin);
        total += skin.price;
        slotResults.push({ slot, skin, filled: true });
      } else {
        slotResults.push({ slot, skin: null, filled: false });
      }
    }
    res.json({
      loadout: selected,
      totalSpent: total,
      budget,
      count: selected.length,
      shuffle: true
    });
    return;
  }
  const { side, budget, color, include } = req.body;
  console.log('Loadout request:', { side, budget, color, include });
  try {
    // --- Custom BOTH CT & T loadout logic ---
    if (side === 'both') {
      const hasKnife = include && include.includes('knife');
      const hasGloves = include && include.includes('gloves');
      let weaponSlots = [];
      if (hasKnife && hasGloves) {
        weaponSlots = [
          { type: 'gloves', percent: 10 },
          { type: 'knife', percent: 10 },
          { weapon: 'M4A4', percent: 6 },
          { weapon: 'M4A1', percent: 6 },
          { weapon: 'AWP', percent: 6 },
          { weapon: 'USP-S', percent: 6 },
          { weapon: 'Desert Eagle', percent: 6 },
          { weapon: 'Zeus', percent: 4 },
          { weapon: 'UMP-45', percent: 4 },
          { weapon: 'P90', percent: 4 },
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 2 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
          { weapon: 'AK-47', percent: 7 },
          { weapon: 'Galil', percent: 5 },
          { weapon: 'Glock-18', percent: 6 },
          { weapon: 'SG553', percent: 2 },
          { weapon: 'MAC-10', percent: 4 },
        ];
      } else if (hasKnife || hasGloves) {
        weaponSlots = [
          { type: hasKnife ? 'knife' : 'gloves', percent: 15 },
          { weapon: 'M4A4', percent: 6 },
          { weapon: 'M4A1', percent: 6 },
          { weapon: 'AWP', percent: 6 },
          { weapon: 'USP-S', percent: 6 },
          { weapon: 'Desert Eagle', percent: 7 },
          { weapon: 'Zeus', percent: 4 },
          { weapon: 'UMP-45', percent: 4 },
          { weapon: 'P90', percent: 4 },
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 2 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
          { weapon: 'AK-47', percent: 7 },
          { weapon: 'Galil', percent: 7 },
          { weapon: 'Glock-18', percent: 6 },
          { weapon: 'SG553', percent: 2 },
          { weapon: 'MAC-10', percent: 4 },
        ];
      } else {
        weaponSlots = [
          { weapon: 'M4A4', percent: 8 },
          { weapon: 'M4A1', percent: 10 },
          { weapon: 'AWP', percent: 8 },
          { weapon: 'USP-S', percent: 8 },
          { weapon: 'Desert Eagle', percent: 8 },
          { weapon: 'Zeus', percent: 4 },
          { weapon: 'UMP-45', percent: 4 },
          { weapon: 'P90', percent: 4 },
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 2 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
          { weapon: 'AK-47', percent: 10 },
          { weapon: 'Galil', percent: 8 },
          { weapon: 'Glock-18', percent: 8 },
          { weapon: 'SG553', percent: 2 },
          { weapon: 'MAC-10', percent: 4 },
        ];
      }

      // Build a query that matches all CT, T, and both-side skins
      let bothQuery = {
        $and: [
          { price: { $lte: budget } },
          { $or: [ { side: 'ct' }, { side: 't' }, { side: 'both' } ] }
        ]
      };
      if (color) bothQuery.$and.push({ colors: { $in: [color] } });
      if (include && Array.isArray(include)) {
        let types = [];
        if (include.includes('knife')) types.push('knife');
        if (include.includes('gloves')) types.push('gloves');
        if (types.length > 0) bothQuery.$and.push({ type: { $in: types.concat(['rifle','pistol','sniper']) } });
        else bothQuery.$and.push({ type: { $nin: ['knife','gloves'] } });
      }

      function getRandomPercent(base, idx) {
        if (idx < 5) {
          return base + (Math.random() * 8 - 4); // ±4%
        } else {
          return base + (Math.random() * 4 - 2); // ±2%
        }
      }

      // --- Pass 1: Fill slots with best skin within slot budget ---

      // Log slotBudgets for debugging
      console.log('BOTH-side slotBudgets:', weaponSlots);
      let slotBudgets = weaponSlots.map((slot, idx) => ({
        ...slot,
        slotBudget: Math.floor((getRandomPercent(slot.percent, idx) / 100) * budget)
      }));

      let selected = [];
      let total = 0;
      let slotResults = [];

      for (let i = 0; i < slotBudgets.length; i++) {
        let slot = slotBudgets[i];
        let slotQuery = JSON.parse(JSON.stringify(bothQuery));
        if (slot.type) {
          slotQuery.$and.push({ type: slot.type });
        } else if (slot.weapon) {
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
        }
        slotQuery.$and.push({ price: { $lte: slot.slotBudget } });
        let skin = null;
        if (slot.type === 'knife') {
          let allKnives = await Skin.find(slotQuery);
          allKnives = allKnives.filter(isNormalKnife);
          const wearOrder = [
            'Factory New',
            'Minimal Wear',
            'Field-Tested',
            'Well-Worn',
            'Battle-Scarred'
          ];
          allKnives.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return a.price - b.price;
          });
          skin = allKnives.length > 0 ? allKnives[0] : null;
        } else {
          const wearOrder = [
            'Factory New',
            'Minimal Wear',
            'Field-Tested',
            'Well-Worn',
            'Battle-Scarred'
          ];
          let allSkins = await Skin.find(slotQuery);
          allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
          allSkins.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return a.price - b.price;
          });
          let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
          let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
          let pickedSkin = null;
          if (bestWearSkins.length > 0) {
            let idx = Math.floor(bestWearSkins.length * 0.7);
            if (idx >= bestWearSkins.length) idx = bestWearSkins.length - 1;
            pickedSkin = bestWearSkins[idx];
          }
          skin = pickedSkin;
        }
        if (skin && total + skin.price <= budget) {
          selected.push(skin);
          total += skin.price;
          slotResults.push({ slot, skin, filled: true });
        } else {
          if (!skin) {
            console.log(`BOTH-side Pass 1: No skin found for slot ${slot.type || slot.weapon} with slotBudget ${slot.slotBudget}`);
          }
          slotResults.push({ slot, skin: null, filled: false });
        }
      }

      // Log after Pass 1
      console.log('--- Pass 1 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });


      // --- Custom Pass 2: Fill non-knife/gloves slots with ±5% budget, ignore knife/gloves ---

      let remainingBudget = budget - total;
      // Only distribute remaining budget among these weapons if unfilled:
      const pass2Weapons = [
        'AK-47', 'M4A4', 'M4A1', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18', 'USP-S'
      ];
      // Find unfilled slots for these weapons
      let unfilledImportant = slotResults.filter(r =>
        !r.filled && r.slot.weapon && pass2Weapons.includes(r.slot.weapon)
      );
      // If none, skip pass 2
      if (unfilledImportant.length > 0) {
        // Distribute remaining budget equally, then apply ±50% margin
        let baseBudget = Math.floor(remainingBudget / unfilledImportant.length);
        for (let i = 0; i < unfilledImportant.length; i++) {
          let r = unfilledImportant[i];
          let slot = r.slot;
          // ±50% margin
          let slotBudget = Math.floor(baseBudget * (0.5 + Math.random()));
          let slotQuery = JSON.parse(JSON.stringify(bothQuery));
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
          slotQuery.$and.push({ price: { $lte: slotBudget } });
          let skin = await Skin.findOne(slotQuery).sort({ price: -1 });
          // Prefer best wear at lowest price
          if (skin) {
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            const baseNameMatch = skin.name.match(/^(.*) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
            const baseName = baseNameMatch ? baseNameMatch[1] : skin.name;
            const allWears = await Skin.find({
              name: { $regex: `^${baseName} \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$` },
              price: { $lte: skin.price },
              weapon: skin.weapon,
              type: skin.type,
              side: skin.side,
              colors: { $in: [color] }
            });
            allWears.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            const bestWear = allWears.length > 0 ? allWears[0] : skin;
            if (bestWear && bestWear.price <= skin.price) {
              skin = bestWear;
            }
          }
          if (skin && total + skin.price <= budget) {
            console.log(`[SHUFFLE PASS2] Filled important weapon: ${slot.weapon} with ${skin.name} ($${skin.price}) [wear: ${skin.name.match(/\(([^)]+)\)$/)?.[1] || 'unknown'}]`);
            selected.push(skin);
            total += skin.price;
            remainingBudget = budget - total;
            // Update slotResults for this slot
            let origIdx = slotResults.findIndex(sr => sr.slot.weapon === slot.weapon && !sr.filled);
            if (origIdx !== -1) {
              slotResults[origIdx].skin = skin;
              slotResults[origIdx].filled = true;
            }
          } else {
            console.log(`[SHUFFLE PASS2] Could not fill important weapon: ${slot.weapon} (budget left: $${remainingBudget})`);
          }
        }
      }

      // Log after Pass 2
      console.log('--- Pass 2 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });

      // --- Custom Pass 3: Try to fill knife and gloves with 50% (±15%) of remaining budget each ---
      let knifeIdx = slotResults.findIndex(r => r.slot.type === 'knife');
      let glovesIdx = slotResults.findIndex(r => r.slot.type === 'gloves');
      let knifeBudget = 0, glovesBudget = 0;
      if (knifeIdx !== -1 && !slotResults[knifeIdx].filled) {
        knifeBudget = Math.floor((0.5 + (Math.random() * 0.3 - 0.15)) * remainingBudget);
        let slotQuery = JSON.parse(JSON.stringify(
          side === 'ct' ? ctQuery : side === 't' ? tQuery : bothQuery
        ));
        slotQuery.$and.push({ type: 'knife' });
        slotQuery.$and.push({ price: { $lte: knifeBudget } });
        let allKnives = await Skin.find(slotQuery);
        allKnives = allKnives.filter(isNormalKnife);
        const wearOrder = [
          'Factory New',
          'Minimal Wear',
          'Field-Tested',
          'Well-Worn',
          'Battle-Scarred'
        ];
        allKnives.sort((a, b) => {
          const wearA = wearOrder.findIndex(w => a.name.includes(w));
          const wearB = wearOrder.findIndex(w => b.name.includes(w));
          if (wearA !== wearB) return wearA - wearB;
          return a.price - b.price;
        });
        let chosenKnife = allKnives.length > 0 ? allKnives[0] : null;
        if (chosenKnife && total + chosenKnife.price <= budget) {
          selected.push(chosenKnife);
          total += chosenKnife.price;
          remainingBudget = budget - total;
          slotResults[knifeIdx].skin = chosenKnife;
          slotResults[knifeIdx].filled = true;
        }
      }
      if (glovesIdx !== -1 && !slotResults[glovesIdx].filled) {
        glovesBudget = Math.floor((0.5 + (Math.random() * 0.3 - 0.15)) * remainingBudget);
        let slotQuery = JSON.parse(JSON.stringify(bothQuery));
        slotQuery.$and.push({ type: 'gloves' });
        slotQuery.$and.push({ price: { $lte: glovesBudget } });
        let skin = await Skin.findOne(slotQuery).sort({ price: -1 });
        if (skin && total + skin.price <= budget) {
          selected.push(skin);
          total += skin.price;
          remainingBudget = budget - total;
          slotResults[glovesIdx].skin = skin;
          slotResults[glovesIdx].filled = true;
        }
      }

      // Log after Pass 3

      // --- Knife selection: prefer normal FN/MW unless StatTrak™ is strictly cheaper ---
      // Log after Pass 3
      console.log('--- Pass 3 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });

      // --- Pass 3: Try to upgrade already-filled slots with remaining budget ---
      for (let i = 0; i < slotResults.length; i++) {
        if (slotResults[i].filled) {
          let slot = slotResults[i].slot;
          let currentSkin = slotResults[i].skin;
          let upgradeBudget = remainingBudget + (currentSkin ? currentSkin.price : 0);
          let slotQuery = JSON.parse(JSON.stringify(
            side === 'ct' ? ctQuery : side === 't' ? tQuery : bothQuery
          ));
          if (slot.type) {
            slotQuery.$and.push({ type: slot.type });
          } else if (slot.weapon) {
            slotQuery.$and = slotQuery.$and.filter(q => !q.type);
            slotQuery.$and.push({ weapon: slot.weapon });
          }
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });

          if (slot.type === 'knife') {
            let allKnives = await Skin.find(slotQuery);
            allKnives = allKnives.filter(isNormalKnife);
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            allKnives.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            let bestKnife = allKnives.length > 0 ? allKnives[0] : null;
            if (
              bestKnife &&
              currentSkin &&
              bestKnife._id.toString() !== currentSkin._id.toString() &&
              bestKnife.price > currentSkin.price &&
              (total - currentSkin.price + bestKnife.price) <= budget
            ) {
              let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
              if (idx !== -1) {
                selected[idx] = bestKnife;
                total = total - currentSkin.price + bestKnife.price;
                remainingBudget = budget - total;
                slotResults[i].skin = bestKnife;
              }
            }
            continue; // skip rest of upgrade logic for knives
          }

          // In the upgrade pass for each side, replace non-knife upgrade logic with:
          if (slot.type !== 'knife') {
            let allSkins = await Skin.find(slotQuery);
            allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            allSkins.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return b.price - a.price;
            });
            let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
            let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
            let upgradeSkin = bestWearSkins.find(s => s._id.toString() !== currentSkin._id.toString() && s.price <= upgradeBudget);
            // If found and (price > currentSkin.price OR better wear), upgrade
            if (upgradeSkin && (
              upgradeSkin.price > currentSkin.price ||
              wearOrder.findIndex(w => upgradeSkin.name.includes(w)) < wearOrder.findIndex(w => currentSkin.name.includes(w))
            )) {
              let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
              if (idx !== -1) {
                selected[idx] = upgradeSkin;
                total = total - currentSkin.price + upgradeSkin.price;
                remainingBudget = budget - total;
                slotResults[i].skin = upgradeSkin;
              }
            }
          }
        }
      }

      // Log after Pass 3
      console.log('--- Pass 3 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });

      // --- Dynamic Upgrade Pass: Only for important weapons with initial fill < 5% of budget ---
      const importantWeaponsBySide = {
        both: ['AK-47', 'M4A4', 'M4A1', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18', 'USP-S'],
        ct:   ['M4A4', 'M4A1', 'AWP', 'Desert Eagle', 'USP-S'],
        t:    ['AK-47', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18']
      };
      const wearOrder = [
        'Factory New',
        'Minimal Wear',
        'Field-Tested',
        'Well-Worn',
        'Battle-Scarred'
      ];
      const sideKey = side === 'both' ? 'both' : side === 'ct' ? 'ct' : 't';
      const importantWeapons = importantWeaponsBySide[sideKey];
      let dynamicUpgradeBudget = budget - total;
      for (let i = 0; i < slotResults.length; i++) {
        const slot = slotResults[i].slot;
        const currentSkin = slotResults[i].skin;
        if (
          slotResults[i].filled &&
          slot.weapon &&
          importantWeapons.includes(slot.weapon) &&
          slot.type !== 'knife' &&
          currentSkin &&
          currentSkin.price < 0.05 * budget // Only upgrade if initial fill < 5% of budget
        ) {
          // Calculate max possible budget for this slot (remaining + current skin price)
          let upgradeBudget = dynamicUpgradeBudget + currentSkin.price;
          // Build query for this slot
          let slotQuery;
          if (side === 'both') {
            slotQuery = JSON.parse(JSON.stringify(bothQuery));
          } else if (side === 'ct') {
            slotQuery = JSON.parse(JSON.stringify(ctQuery));
          } else {
            slotQuery = JSON.parse(JSON.stringify(tQuery));
          }
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });
          // Fetch all possible upgrades in color
          let allSkins = await Skin.find(slotQuery);
          allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
          allSkins.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return b.price - a.price; // Most expensive first in best wear
          });
          let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
          let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
          let upgradeSkin = bestWearSkins.find(s =>
            s._id.toString() !== currentSkin._id.toString() &&
            s.price <= upgradeBudget
          );
          // If found and (price > currentSkin.price OR better wear), upgrade
          if (
            upgradeSkin &&
            (
              upgradeSkin.price > currentSkin.price ||
              wearOrder.findIndex(w => upgradeSkin.name.includes(w)) < wearOrder.findIndex(w => currentSkin.name.includes(w))
            ) &&
            (total - currentSkin.price + upgradeSkin.price) <= budget
          ) {
            let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
            if (idx !== -1) {
              selected[idx] = upgradeSkin;
              total = total - currentSkin.price + upgradeSkin.price;
              dynamicUpgradeBudget = budget - total;
              slotResults[i].skin = upgradeSkin;
            }
          }
        }
      }

      // Final log after all passes
      console.log('--- Final Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });
      res.json({
        loadout: selected,
        totalSpent: total,
        budget,
        count: selected.length
      });
      return;
    }
    // --- Custom CT-only loadout logic ---
    if (side === 'ct') {
      // Weapon slot definitions and percentages
      let weaponSlots = [];
      const hasKnife = include && include.includes('knife');
      const hasGloves = include && include.includes('gloves');

      if (hasKnife && hasGloves) {
        weaponSlots = [
          { type: 'gloves', percent: 10 },
          { type: 'knife', percent: 10 },
          { weapon: 'M4A4', percent: 8 },
          { weapon: 'M4A1', percent: 8 },
          { weapon: 'AWP', percent: 8 },
          { weapon: 'USP-S', percent: 8 },
          { weapon: 'Desert Eagle', percent: 8 },
          { weapon: 'Zeus', percent: 8 },
          { weapon: 'UMP-45', percent: 8 },
          { weapon: 'P90', percent: 8 },
          // 16% split among Five-Seven, AUG, MP9, P250
          { weapon: 'Five-Seven', percent: 4 },
          { weapon: 'AUG', percent: 4 },
          { weapon: 'MP9', percent: 4 },
          { weapon: 'P250', percent: 4 },
        ];
      } else if (hasKnife || hasGloves) {
        weaponSlots = [
          { type: hasKnife ? 'knife' : 'gloves', percent: 15 },
          { weapon: 'M4A4', percent: 8 },
          { weapon: 'M4A1', percent: 8 },
          { weapon: 'AWP', percent: 8 },
          { weapon: 'USP-S', percent: 8 },
          { weapon: 'Desert Eagle', percent: 8 },
          { weapon: 'Zeus', percent: 8 },
          { weapon: 'UMP-45', percent: 8 },
          { weapon: 'P90', percent: 8 },
          // 21% split among Five-Seven, AUG, MP9, P250
          { weapon: 'Five-Seven', percent: 5.25 },
          { weapon: 'AUG', percent: 5.25 },
          { weapon: 'MP9', percent: 5.25 },
          { weapon: 'P250', percent: 5.25 },
        ];
      } else {
        weaponSlots = [
          { weapon: 'M4A4', percent: 10 },
          { weapon: 'M4A1', percent: 10 },
          { weapon: 'AWP', percent: 10 },
          { weapon: 'USP-S', percent: 10 },
          { weapon: 'Desert Eagle', percent: 10 },
          { weapon: 'Zeus', percent: 10 },
          { weapon: 'UMP-45', percent: 10 },
          { weapon: 'P90', percent: 10 },
          // 20% split among Five-Seven, AUG, MP9, P250
          { weapon: 'Five-Seven', percent: 5 },
          { weapon: 'AUG', percent: 5 },
          { weapon: 'MP9', percent: 5 },
          { weapon: 'P250', percent: 5 },
        ];
      }

      // Build a query that matches all CT and both-side skins
      let ctQuery = {
        $and: [
          { price: { $lte: budget } },
          { $or: [ { side: 'ct' }, { side: 'both' } ] }
        ]
      };
      if (color) ctQuery.$and.push({ colors: { $in: [color] } });
      if (include && Array.isArray(include)) {
        let types = [];
        if (include.includes('knife')) types.push('knife');
        if (include.includes('gloves')) types.push('gloves');
        if (types.length > 0) ctQuery.$and.push({ type: { $in: types.concat(['rifle','pistol','sniper']) } });
        else ctQuery.$and.push({ type: { $nin: ['knife','gloves'] } });
      }

      // Allow ±2% flexibility
      function getRandomPercent(base, idx) {
        // 4% margin for first 5 slots, 2% for the rest
        if (idx < 5) {
          return base + (Math.random() * 8 - 4); // ±4%
        } else {
          return base + (Math.random() * 4 - 2); // ±2%
        }
      }

      // Calculate slot budgets
      let slotBudgets = weaponSlots.map((slot, idx) => ({
        ...slot,
        slotBudget: Math.floor((getRandomPercent(slot.percent, idx) / 100) * budget)
      }));

      let selected = [], total = 0;
      let slotResults = [];

      // --- Pass 1: Fill slots with best skin within slot budget ---
      for (let i = 0; i < slotBudgets.length; i++) {
        let slot = slotBudgets[i];
        let slotQuery = JSON.parse(JSON.stringify(ctQuery)); // deep copy
        if (slot.type) {
          slotQuery.$and.push({ type: slot.type });
        } else if (slot.weapon) {
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
        }
        slotQuery.$and.push({ price: { $lte: slot.slotBudget } });
        let skin = null;
        if (slot.type === 'knife') {
          let allKnives = await Skin.find(slotQuery);
          allKnives = allKnives.filter(isNormalKnife);
          const wearOrder = [
            'Factory New',
            'Minimal Wear',
            'Field-Tested',
            'Well-Worn',
            'Battle-Scarred'
          ];
          allKnives.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return a.price - b.price;
          });
          skin = allKnives.length > 0 ? allKnives[0] : null;
        } else {
          const wearOrder = [
            'Factory New',
            'Minimal Wear',
            'Field-Tested',
            'Well-Worn',
            'Battle-Scarred'
          ];
          let allSkins = await Skin.find(slotQuery);
          allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
          allSkins.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return a.price - b.price;
          });
          let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
          let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
          let pickedSkin = null;
          if (bestWearSkins.length > 0) {
            let idx = Math.floor(bestWearSkins.length * 0.7);
            if (idx >= bestWearSkins.length) idx = bestWearSkins.length - 1;
            pickedSkin = bestWearSkins[idx];
          }
          skin = pickedSkin;
        }
        if (skin && total + skin.price <= budget) {
          selected.push(skin);
          total += skin.price;
          slotResults.push({ slot, skin, filled: true });
        } else {
          slotResults.push({ slot, skin: null, filled: false });
        }
      }

      // --- Pass 2: Fill unfilled important weapon slots with remaining budget (±50% margin) ---
      console.log('--- CT Pass 1 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });
      let remainingBudget = budget - total;
      const ctImportantWeapons = ['M4A4', 'M4A1', 'AWP', 'Desert Eagle', 'USP-S', 'P250'];
      let unfilledImportant = slotResults.filter(r => !r.filled && r.slot.weapon && ctImportantWeapons.includes(r.slot.weapon));
      if (unfilledImportant.length > 0) {
        let baseBudget = Math.floor(remainingBudget / unfilledImportant.length);
        for (let i = 0; i < unfilledImportant.length; i++) {
          let r = unfilledImportant[i];
          let slot = r.slot;
          let slotBudget = Math.floor(baseBudget * (0.5 + Math.random()));
          let slotQuery = JSON.parse(JSON.stringify(ctQuery));
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
          slotQuery.$and.push({ price: { $lte: slotBudget } });
          let skin = await Skin.findOne(slotQuery).sort({ price: -1 });
          // Prefer best wear at lowest price
          if (skin) {
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            const baseNameMatch = skin.name.match(/^(.*) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
            const baseName = baseNameMatch ? baseNameMatch[1] : skin.name;
            const allWears = await Skin.find({
              name: { $regex: `^${baseName} \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$` },
              price: { $lte: skin.price },
              weapon: skin.weapon,
              type: skin.type,
              side: skin.side,
              colors: { $in: [color] }
            });
            allWears.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            const bestWear = allWears.length > 0 ? allWears[0] : skin;
            if (bestWear && bestWear.price <= skin.price) {
              skin = bestWear;
            }
          }
          if (skin && total + skin.price <= budget) {
            selected.push(skin);
            total += skin.price;
            remainingBudget = budget - total;
            // Update slotResults for this slot
            let origIdx = slotResults.findIndex(sr => sr.slot.weapon === slot.weapon && !sr.filled);
            if (origIdx !== -1) {
              slotResults[origIdx].skin = skin;
              slotResults[origIdx].filled = true;
            }
          }
        }
      }
      // Log after Pass 2
      console.log('--- CT Pass 2 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });
      // --- Pass 3: Fill knife/gloves if unfilled, then upgrade already-filled slots ---
      let knifeIdx = slotResults.findIndex(r => r.slot.type === 'knife');
      let glovesIdx = slotResults.findIndex(r => r.slot.type === 'gloves');
      let knifeBudget = 0, glovesBudget = 0;
      if (knifeIdx !== -1 && !slotResults[knifeIdx].filled) {
        knifeBudget = Math.floor((0.5 + (Math.random() * 0.3 - 0.15)) * remainingBudget);
        let slotQuery = JSON.parse(JSON.stringify(ctQuery));
        slotQuery.$and.push({ type: 'knife' });
        slotQuery.$and.push({ price: { $lte: knifeBudget } });
        // Find all knives within budget
        let allKnives = await Skin.find(slotQuery);
        // Find and sort normal and StatTrak™ knives by price
        let normalKnives = allKnives.filter(isNormalKnife).sort((a, b) => a.price - b.price);
        let cheapestNormal = normalKnives.length > 0 ? normalKnives[0] : null;
        let chosenKnife = null;
        if (cheapestNormal) {
          chosenKnife = cheapestNormal;
          console.log('  Chose normal knife (preferred)');
        } else {
          console.log('  No valid knives available');
        }
        if (chosenKnife && total + chosenKnife.price <= budget) {
          selected.push(chosenKnife);
          total += chosenKnife.price;
          remainingBudget = budget - total;
          slotResults[knifeIdx].skin = chosenKnife;
          slotResults[knifeIdx].filled = true;
        }
      }
      if (glovesIdx !== -1 && !slotResults[glovesIdx].filled) {
        glovesBudget = Math.floor((0.5 + (Math.random() * 0.3 - 0.15)) * remainingBudget);
        let slotQuery = JSON.parse(JSON.stringify(ctQuery));
        slotQuery.$and.push({ type: 'gloves' });
        slotQuery.$and.push({ price: { $lte: glovesBudget } });
        let skin = await Skin.findOne(slotQuery).sort({ price: -1 });
        if (skin && total + skin.price <= budget) {
          selected.push(skin);
          total += skin.price;
          remainingBudget = budget - total;
          slotResults[glovesIdx].skin = skin;
          slotResults[glovesIdx].filled = true;
        }
      }
      // Upgrade already-filled slots
      for (let i = 0; i < slotResults.length; i++) {
        if (slotResults[i].filled) {
          let slot = slotResults[i].slot;
          let currentSkin = slotResults[i].skin;
          let upgradeBudget = remainingBudget + (currentSkin ? currentSkin.price : 0);
          let slotQuery = JSON.parse(JSON.stringify(ctQuery));
          if (slot.type) {
            slotQuery.$and.push({ type: slot.type });
          } else if (slot.weapon) {
            slotQuery.$and = slotQuery.$and.filter(q => !q.type);
            slotQuery.$and.push({ weapon: slot.weapon });
          }
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });
          // Exclude StatTrak™ knives in upgrades
          if (slot.type === 'knife') {
            slotQuery.$and.push({ name: { $not: /StatTrak/ } });
          }
          let betterSkin = await Skin.findOne(slotQuery).sort({ price: -1 });
          if (betterSkin && currentSkin && betterSkin.price > currentSkin.price && (total - currentSkin.price + betterSkin.price) <= budget) {
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            const baseNameMatch = betterSkin.name.match(/^(.*) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
            const baseName = baseNameMatch ? baseNameMatch[1] : betterSkin.name;
            const allWears = await Skin.find({
              name: { $regex: `^${baseName} \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$` },
              price: { $lte: upgradeBudget },
              weapon: betterSkin.weapon,
              type: betterSkin.type,
              side: betterSkin.side,
              colors: { $in: [color] }
            });
            allWears.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            const bestWear = allWears.length > 0 ? allWears[0] : betterSkin;
            if (
              bestWear &&
              bestWear._id.toString() !== currentSkin._id.toString() &&
              bestWear.price > currentSkin.price &&
              (total - currentSkin.price + bestWear.price) <= budget
            ) {
              let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
              if (idx !== -1) {
                selected[idx] = bestWear;
                total = total - currentSkin.price + bestWear.price;
                remainingBudget = budget - total;
                slotResults[i].skin = bestWear;
              }
            }
          }
        }
      }
      // Log after Pass 3

      // --- Knife selection: prefer normal FN/MW unless StatTrak™ is strictly cheaper ---
      // Log after Pass 3
      console.log('--- CT Pass 3 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });

      // --- Pass 3: Try to upgrade already-filled slots with remaining budget ---
      for (let i = 0; i < slotResults.length; i++) {
        if (slotResults[i].filled) {
          let slot = slotResults[i].slot;
          let currentSkin = slotResults[i].skin;
          let upgradeBudget = remainingBudget + (currentSkin ? currentSkin.price : 0);
          let slotQuery = JSON.parse(JSON.stringify(ctQuery));
          if (slot.type) {
            slotQuery.$and.push({ type: slot.type });
          } else if (slot.weapon) {
            slotQuery.$and = slotQuery.$and.filter(q => !q.type);
            slotQuery.$and.push({ weapon: slot.weapon });
          }
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });
          // Exclude StatTrak™ knives in upgrades
          if (slot.type === 'knife') {
            slotQuery.$and.push({ name: { $not: /StatTrak/ } });
          }
          let betterSkin = await Skin.findOne(slotQuery).sort({ price: -1 });
          if (betterSkin && currentSkin && betterSkin.price > currentSkin.price && (total - currentSkin.price + betterSkin.price) <= budget) {
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            const baseNameMatch = betterSkin.name.match(/^(.*) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
            const baseName = baseNameMatch ? baseNameMatch[1] : betterSkin.name;
            const allWears = await Skin.find({
              name: { $regex: `^${baseName} \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$` },
              price: { $lte: upgradeBudget },
              weapon: betterSkin.weapon,
              type: betterSkin.type,
              side: betterSkin.side,
              colors: { $in: [color] }
            });
            allWears.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            const bestWear = allWears.length > 0 ? allWears[0] : betterSkin;
            if (
              bestWear &&
              bestWear._id.toString() !== currentSkin._id.toString() &&
              bestWear.price > currentSkin.price &&
              (total - currentSkin.price + bestWear.price) <= budget
            ) {
              let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
              if (idx !== -1) {
                selected[idx] = bestWear;
                total = total - currentSkin.price + bestWear.price;
                remainingBudget = budget - total;
                slotResults[i].skin = bestWear;
              }
            }
          }
        }
      }
      // Log after Pass 3
      console.log('--- CT Pass 3 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });

      // --- Dynamic Upgrade Pass: Only for important weapons with initial fill < 5% of budget ---
      const importantWeaponsBySide = {
        both: ['AK-47', 'M4A4', 'M4A1', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18', 'USP-S'],
        ct:   ['M4A4', 'M4A1', 'AWP', 'Desert Eagle', 'USP-S'],
        t:    ['AK-47', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18']
      };
      const wearOrder = [
        'Factory New',
        'Minimal Wear',
        'Field-Tested',
        'Well-Worn',
        'Battle-Scarred'
      ];
      const sideKey = side === 'both' ? 'both' : side === 'ct' ? 'ct' : 't';
      const importantWeapons = importantWeaponsBySide[sideKey];
      let dynamicUpgradeBudget = budget - total;
      for (let i = 0; i < slotResults.length; i++) {
        const slot = slotResults[i].slot;
        const currentSkin = slotResults[i].skin;
        if (
          slotResults[i].filled &&
          slot.weapon &&
          importantWeapons.includes(slot.weapon) &&
          slot.type !== 'knife' &&
          currentSkin &&
          currentSkin.price < 0.05 * budget // Only upgrade if initial fill < 5% of budget
        ) {
          // Calculate max possible budget for this slot (remaining + current skin price)
          let upgradeBudget = dynamicUpgradeBudget + currentSkin.price;
          // Build query for this slot
          let slotQuery;
          if (side === 'both') {
            slotQuery = JSON.parse(JSON.stringify(bothQuery));
          } else if (side === 'ct') {
            slotQuery = JSON.parse(JSON.stringify(ctQuery));
          } else {
            slotQuery = JSON.parse(JSON.stringify(tQuery));
          }
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });
          // Fetch all possible upgrades in color
          let allSkins = await Skin.find(slotQuery);
          allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
          allSkins.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return b.price - a.price; // Most expensive first in best wear
          });
          let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
          let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
          let upgradeSkin = bestWearSkins.find(s =>
            s._id.toString() !== currentSkin._id.toString() &&
            s.price <= upgradeBudget
          );
          // If found and (price > currentSkin.price OR better wear), upgrade
          if (
            upgradeSkin &&
            (
              upgradeSkin.price > currentSkin.price ||
              wearOrder.findIndex(w => upgradeSkin.name.includes(w)) < wearOrder.findIndex(w => currentSkin.name.includes(w))
            ) &&
            (total - currentSkin.price + upgradeSkin.price) <= budget
          ) {
            let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
            if (idx !== -1) {
              selected[idx] = upgradeSkin;
              total = total - currentSkin.price + upgradeSkin.price;
              dynamicUpgradeBudget = budget - total;
              slotResults[i].skin = upgradeSkin;
            }
          }
        }
      }

      // Final log after all passes
      console.log('--- Final Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });
      res.json({
        loadout: selected,
        totalSpent: total,
        budget,
        count: selected.length
      });
      return;
    }
    // --- End custom CT-only logic ---
    // --- Custom T-only loadout logic ---
    if (side === 't') {
      const hasKnife = include && include.includes('knife');
      const hasGloves = include && include.includes('gloves');
      let weaponSlots = [];
      if (hasKnife && hasGloves) {
        weaponSlots = [
          { type: 'gloves', percent: 10 },
          { type: 'knife', percent: 10 },
          { weapon: 'AK-47', percent: 10 },
          { weapon: 'Galil', percent: 8 },
          { weapon: 'AWP', percent: 8 },
          { weapon: 'Glock-18', percent: 8 },
          { weapon: 'Desert Eagle', percent: 8 },
          { weapon: 'Zeus', percent: 8 },
          { weapon: 'UMP-45', percent: 8 },
          { weapon: 'P90', percent: 6 },
          { weapon: 'Tec-9', percent: 4 },
          { weapon: 'SG553', percent: 4 },
          { weapon: 'MAC-10', percent: 4 },
          { weapon: 'P250', percent: 4 },
        ];
      } else if (hasKnife || hasGloves) {
        weaponSlots = [
          { type: hasKnife ? 'knife' : 'gloves', percent: 15 },
          { weapon: 'AK-47', percent: 8 },
          { weapon: 'Galil', percent: 8 },
          { weapon: 'AWP', percent: 8 },
          { weapon: 'Glock-18', percent: 8 },
          { weapon: 'Desert Eagle', percent: 8 },
          { weapon: 'Zeus', percent: 8 },
          { weapon: 'UMP-45', percent: 8 },
          { weapon: 'P90', percent: 6 },
          { weapon: 'Tec-9', percent: 5.25 },
          { weapon: 'SG553', percent: 5.25 },
          { weapon: 'MAC-10', percent: 5.25 },
          { weapon: 'P250', percent: 5.25 },
        ];
      } else {
        weaponSlots = [
          { weapon: 'AK-47', percent: 10 },
          { weapon: 'Galil', percent: 10 },
          { weapon: 'AWP', percent: 10 },
          { weapon: 'Glock-18', percent: 10 },
          { weapon: 'Desert Eagle', percent: 10 },
          { weapon: 'Zeus', percent: 10 },
          { weapon: 'UMP-45', percent: 10 },
          { weapon: 'P90', percent: 6 },
          { weapon: 'Tec-9', percent: 6 },
          { weapon: 'SG553', percent: 6 },
          { weapon: 'MAC-10', percent: 6 },
          { weapon: 'P250', percent: 6 },
        ];
      }
      // Log weaponSlots for debugging
      console.log('T-side weaponSlots:', weaponSlots);

      // Build a query that matches all T and both-side skins (after weaponSlots logic)
      let tQuery = {
        $and: [
          { price: { $lte: budget } },
          { $or: [ { side: 't' }, { side: 'both' } ] }
        ]
      };
      if (color) tQuery.$and.push({ colors: { $in: [color] } });
      if (include && Array.isArray(include)) {
        let types = [];
        if (include.includes('knife')) types.push('knife');
        if (include.includes('gloves')) types.push('gloves');
        if (types.length > 0) tQuery.$and.push({ type: { $in: types.concat(['rifle','pistol','sniper']) } });
        else tQuery.$and.push({ type: { $nin: ['knife','gloves'] } });
      }

      function getRandomPercent(base, idx) {
        if (idx < 5) {
          return base + (Math.random() * 8 - 4); // ±4%
        } else {
          return base + (Math.random() * 4 - 2); // ±2%
        }
      }


      // --- Pass 1: Fill slots with best skin within slot budget ---
      let slotBudgets = weaponSlots.map((slot, idx) => ({
        ...slot,
        slotBudget: Math.floor((getRandomPercent(slot.percent, idx) / 100) * budget)
      }));
      // Log slotBudgets for debugging
      console.log('T-side slotBudgets:', slotBudgets);

      let selected = [];
      let total = 0;
      let slotResults = [];

      for (let i = 0; i < slotBudgets.length; i++) {
        let slot = slotBudgets[i];
        let slotQuery = JSON.parse(JSON.stringify(tQuery));
        if (slot.type) {
          slotQuery.$and.push({ type: slot.type });
        } else if (slot.weapon) {
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
        }
        slotQuery.$and.push({ price: { $lte: slot.slotBudget } });
        // Log slot and query for debugging
        console.log(`T-side Pass 1: Slot ${i + 1} (${slot.type || slot.weapon}), slotBudget: ${slot.slotBudget}, query:`, JSON.stringify(slotQuery));
        let skin = null;
        if (slot.type === 'knife') {
          let allKnives = await Skin.find(slotQuery);
          allKnives = allKnives.filter(isNormalKnife);
          const wearOrder = [
            'Factory New',
            'Minimal Wear',
            'Field-Tested',
            'Well-Worn',
            'Battle-Scarred'
          ];
          allKnives.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return a.price - b.price;
          });
          skin = allKnives.length > 0 ? allKnives[0] : null;
        } else {
          const wearOrder = [
            'Factory New',
            'Minimal Wear',
            'Field-Tested',
            'Well-Worn',
            'Battle-Scarred'
          ];
          let allSkins = await Skin.find(slotQuery);
          allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
          allSkins.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return a.price - b.price;
          });
          let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
          let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
          let pickedSkin = null;
          if (bestWearSkins.length > 0) {
            let idx = Math.floor(bestWearSkins.length * 0.7);
            if (idx >= bestWearSkins.length) idx = bestWearSkins.length - 1;
            pickedSkin = bestWearSkins[idx];
          }
          skin = pickedSkin;
        }
        if (skin && total + skin.price <= budget) {
          selected.push(skin);
          total += skin.price;
          slotResults.push({ slot, skin, filled: true });
        } else {
          if (!skin) {
            console.log(`T-side Pass 1: No skin found for slot ${slot.type || slot.weapon} with slotBudget ${slot.slotBudget}`);
          }
          slotResults.push({ slot, skin: null, filled: false });
        }
      }
      // --- Pass 2: Fill unfilled important weapon slots with remaining budget (±50% margin) ---
      let remainingBudget = budget - total;
      const tImportantWeapons = ['AK-47', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18', 'P250'];
      let unfilledImportant = slotResults.filter(r => !r.filled && r.slot.weapon && tImportantWeapons.includes(r.slot.weapon));
      if (unfilledImportant.length > 0) {
        let baseBudget = Math.floor(remainingBudget / unfilledImportant.length);
        for (let i = 0; i < unfilledImportant.length; i++) {
          let r = unfilledImportant[i];
          let slot = r.slot;
          let slotBudget = Math.floor(baseBudget * (0.5 + Math.random()));
          let slotQuery = JSON.parse(JSON.stringify(tQuery));
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
          slotQuery.$and.push({ price: { $lte: slotBudget } });
          let skin = await Skin.findOne(slotQuery).sort({ price: -1 });
          // Prefer best wear at lowest price
          if (skin) {
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            const baseNameMatch = skin.name.match(/^(.*) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
            const baseName = baseNameMatch ? baseNameMatch[1] : skin.name;
            const allWears = await Skin.find({
              name: { $regex: `^${baseName} \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$` },
              price: { $lte: skin.price },
              weapon: skin.weapon,
              type: skin.type,
              side: skin.side,
              colors: { $in: [color] }
            });
            allWears.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            const bestWear = allWears.length > 0 ? allWears[0] : skin;
            if (bestWear && bestWear.price <= skin.price) {
              skin = bestWear;
            }
          }
          if (skin && total + skin.price <= budget) {
            selected.push(skin);
            total += skin.price;
            remainingBudget = budget - total;
            // Update slotResults for this slot
            let origIdx = slotResults.findIndex(sr => sr.slot.weapon === slot.weapon && !sr.filled);
            if (origIdx !== -1) {
              slotResults[origIdx].skin = skin;
              slotResults[origIdx].filled = true;
            }
          }
        }
      }
      // --- Pass 3: Fill knife/gloves if unfilled, then upgrade already-filled slots ---
      let knifeIdx = slotResults.findIndex(r => r.slot.type === 'knife');
      let glovesIdx = slotResults.findIndex(r => r.slot.type === 'gloves');
      let knifeBudget = 0, glovesBudget = 0;
      if (knifeIdx !== -1 && !slotResults[knifeIdx].filled) {
        knifeBudget = Math.floor((0.5 + (Math.random() * 0.3 - 0.15)) * remainingBudget);
        let slotQuery = JSON.parse(JSON.stringify(tQuery));
        slotQuery.$and.push({ type: 'knife' });
        slotQuery.$and.push({ price: { $lte: knifeBudget } });
        // Find all knives within budget
        let allKnives = await Skin.find(slotQuery);
        // Find and sort normal and StatTrak™ knives by price
        let normalKnives = allKnives.filter(isNormalKnife).sort((a, b) => a.price - b.price);
        let cheapestNormal = normalKnives.length > 0 ? normalKnives[0] : null;
        let chosenKnife = null;
        if (cheapestNormal) {
          chosenKnife = cheapestNormal;
          console.log('  Chose normal knife (preferred)');
        } else {
          console.log('  No valid knives available');
        }
        if (chosenKnife && total + chosenKnife.price <= budget) {
          selected.push(chosenKnife);
          total += chosenKnife.price;
          remainingBudget = budget - total;
          slotResults[knifeIdx].skin = chosenKnife;
          slotResults[knifeIdx].filled = true;
        }
      }
      if (glovesIdx !== -1 && !slotResults[glovesIdx].filled) {
        glovesBudget = Math.floor((0.5 + (Math.random() * 0.3 - 0.15)) * remainingBudget);
        let slotQuery = JSON.parse(JSON.stringify(tQuery));
        slotQuery.$and.push({ type: 'gloves' });
        slotQuery.$and.push({ price: { $lte: glovesBudget } });
        let skin = await Skin.findOne(slotQuery).sort({ price: -1 });
        if (skin && total + skin.price <= budget) {
          selected.push(skin);
          total += skin.price;
          remainingBudget = budget - total;
          slotResults[glovesIdx].skin = skin;
          slotResults[glovesIdx].filled = true;
        }
      }
      // Upgrade already-filled slots
      for (let i = 0; i < slotResults.length; i++) {
        if (slotResults[i].filled) {
          let slot = slotResults[i].slot;
          let currentSkin = slotResults[i].skin;
          let upgradeBudget = remainingBudget + (currentSkin ? currentSkin.price : 0);
          let slotQuery = JSON.parse(JSON.stringify(tQuery));
          if (slot.type) {
            slotQuery.$and.push({ type: slot.type });
          } else if (slot.weapon) {
            slotQuery.$and = slotQuery.$and.filter(q => !q.type);
            slotQuery.$and.push({ weapon: slot.weapon });
          }
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });
          // Exclude StatTrak™ knives in upgrades
          if (slot.type === 'knife') {
            slotQuery.$and.push({ name: { $not: /StatTrak/ } });
          }
          let betterSkin = await Skin.findOne(slotQuery).sort({ price: -1 });
          if (betterSkin && currentSkin && betterSkin.price > currentSkin.price && (total - currentSkin.price + betterSkin.price) <= budget) {
            const wearOrder = [
              'Factory New',
              'Minimal Wear',
              'Field-Tested',
              'Well-Worn',
              'Battle-Scarred'
            ];
            const baseNameMatch = betterSkin.name.match(/^(.*) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
            const baseName = baseNameMatch ? baseNameMatch[1] : betterSkin.name;
            const allWears = await Skin.find({
              name: { $regex: `^${baseName} \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$` },
              price: { $lte: upgradeBudget },
              weapon: betterSkin.weapon,
              type: betterSkin.type,
              side: betterSkin.side,
              colors: { $in: [color] }
            });
            allWears.sort((a, b) => {
              const wearA = wearOrder.findIndex(w => a.name.includes(w));
              const wearB = wearOrder.findIndex(w => b.name.includes(w));
              if (wearA !== wearB) return wearA - wearB;
              return a.price - b.price;
            });
            const bestWear = allWears.length > 0 ? allWears[0] : betterSkin;
            if (
              bestWear &&
              bestWear._id.toString() !== currentSkin._id.toString() &&
              bestWear.price > currentSkin.price &&
              (total - currentSkin.price + bestWear.price) <= budget
            ) {
              let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
              if (idx !== -1) {
                selected[idx] = bestWear;
                total = total - currentSkin.price + bestWear.price;
                remainingBudget = budget - total;
                slotResults[i].skin = bestWear;
              }
            }
          }
        }
      }
      // Log after Pass 3
      console.log('--- T Pass 3 Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });
      // --- Dynamic Upgrade Pass: Only for important weapons with initial fill < 5% of budget ---
      const importantWeaponsBySide = {
        both: ['AK-47', 'M4A4', 'M4A1', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18', 'USP-S'],
        ct:   ['M4A4', 'M4A1', 'AWP', 'Desert Eagle', 'USP-S'],
        t:    ['AK-47', 'Galil', 'AWP', 'Desert Eagle', 'Glock-18']
      };
      const wearOrder = [
        'Factory New',
        'Minimal Wear',
        'Field-Tested',
        'Well-Worn',
        'Battle-Scarred'
      ];
      const sideKey = side === 'both' ? 'both' : side === 'ct' ? 'ct' : 't';
      const importantWeapons = importantWeaponsBySide[sideKey];
      let dynamicUpgradeBudget = budget - total;
      for (let i = 0; i < slotResults.length; i++) {
        const slot = slotResults[i].slot;
        const currentSkin = slotResults[i].skin;
        if (
          slotResults[i].filled &&
          slot.weapon &&
          importantWeapons.includes(slot.weapon) &&
          slot.type !== 'knife' &&
          currentSkin &&
          currentSkin.price < 0.05 * budget // Only upgrade if initial fill < 5% of budget
        ) {
          // Calculate max possible budget for this slot (remaining + current skin price)
          let upgradeBudget = dynamicUpgradeBudget + currentSkin.price;
          // Build query for this slot
          let slotQuery;
          if (side === 'both') {
            slotQuery = JSON.parse(JSON.stringify(bothQuery));
          } else if (side === 'ct') {
            slotQuery = JSON.parse(JSON.stringify(ctQuery));
          } else {
            slotQuery = JSON.parse(JSON.stringify(tQuery));
          }
          slotQuery.$and = slotQuery.$and.filter(q => !q.type);
          slotQuery.$and.push({ weapon: slot.weapon });
          slotQuery.$and.push({ price: { $lte: upgradeBudget } });
          // Fetch all possible upgrades in color
          let allSkins = await Skin.find(slotQuery);
          allSkins = allSkins.filter(s => s.colors && s.colors.includes(color));
          allSkins.sort((a, b) => {
            const wearA = wearOrder.findIndex(w => a.name.includes(w));
            const wearB = wearOrder.findIndex(w => b.name.includes(w));
            if (wearA !== wearB) return wearA - wearB;
            return b.price - a.price; // Most expensive first in best wear
          });
          let bestWearIdx = allSkins.length > 0 ? wearOrder.findIndex(w => allSkins[0].name.includes(w)) : -1;
          let bestWearSkins = allSkins.filter(s => s.name.includes(wearOrder[bestWearIdx]));
          let upgradeSkin = bestWearSkins.find(s =>
            s._id.toString() !== currentSkin._id.toString() &&
            s.price <= upgradeBudget
          );
          // If found and (price > currentSkin.price OR better wear), upgrade
          if (
            upgradeSkin &&
            (
              upgradeSkin.price > currentSkin.price ||
              wearOrder.findIndex(w => upgradeSkin.name.includes(w)) < wearOrder.findIndex(w => currentSkin.name.includes(w))
            ) &&
            (total - currentSkin.price + upgradeSkin.price) <= budget
          ) {
            let idx = selected.findIndex(s => s._id.toString() === currentSkin._id.toString());
            if (idx !== -1) {
              selected[idx] = upgradeSkin;
              total = total - currentSkin.price + upgradeSkin.price;
              dynamicUpgradeBudget = budget - total;
              slotResults[i].skin = upgradeSkin;
            }
          }
        }
      }

      // Final log after all passes
      console.log('--- Final Results ---');
      slotResults.forEach((r, idx) => {
        console.log(`Slot ${idx + 1}:`, r.slot.type || r.slot.weapon, r.filled ? `-> ${r.skin?.name} ($${r.skin?.price})` : '-> Not filled');
      });
      res.json({
        loadout: selected,
        totalSpent: total,
        budget,
        count: selected.length
      });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
