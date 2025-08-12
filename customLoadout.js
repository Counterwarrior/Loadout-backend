// Custom Loadout Builder Logic (separate from Loadout-gen)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Use the same Skin model as in index.js
let Skin;
try {
  Skin = mongoose.model('Skin');
} catch (e) {
  const skinSchema = new mongoose.Schema({
    name: String,
    weapon: String,
    side: String,
    colors: [String],
    price: Number,
    type: String,
    imageUrl: String,
  });
  Skin = mongoose.model('Skin', skinSchema);
}

const MAIN_WEAPONS = ['AK-47', 'M4A4', 'M4A1', 'AWP'];
const SPECIALS = ['Knife', 'Gloves'];

// Helper: allocate budget per your rules
function allocateBudget(budget, selected) {
  const allocation = {};
  const main = selected.filter(w => MAIN_WEAPONS.includes(w));
  const specials = selected.filter(w => SPECIALS.includes(w));
  const others = selected.filter(w => !MAIN_WEAPONS.includes(w) && !SPECIALS.includes(w));
  const total = selected.length;
  let margin = 0.03 * budget;

  if (specials.length === 1) {
    if (total < 6) {
      allocation[specials[0]] = 0.4 * budget;
      const rest = budget - allocation[specials[0]];
      const per = rest / (total - 1);
      selected.filter(w => w !== specials[0]).forEach(w => allocation[w] = per);
    } else {
      allocation[specials[0]] = 0.3 * budget;
      main.forEach(w => allocation[w] = 0.1 * budget);
      const rest = budget - allocation[specials[0]] - main.length * 0.1 * budget;
      const per = others.length ? rest / others.length : 0;
      others.forEach(w => allocation[w] = per);
    }
  } else if (specials.length === 2 && total < 6) {
    allocation['Gloves'] = 0.25 * budget;
    allocation['Knife'] = 0.25 * budget;
    const rest = budget - 0.5 * budget;
    const per = (total - 2) ? rest / (total - 2) : 0;
    selected.filter(w => !SPECIALS.includes(w)).forEach(w => allocation[w] = per);
  } else if (specials.length === 0) {
    if (total === 0) {
      allocation['AK-47'] = budget;
    } else if (total === 1) {
      allocation[selected[0]] = budget;
    } else if (total === 2) {
      allocation[selected[0]] = 0.5 * budget + 0.05 * budget;
      allocation[selected[1]] = 0.5 * budget - 0.05 * budget;
    } else if (total === 3) {
      selected.forEach(w => {
        allocation[w] = MAIN_WEAPONS.includes(w) ? (budget / 3) + 0.1 * budget : (budget / 3) - 0.1 * budget;
      });
    } else if (total === 4) {
      selected.forEach(w => {
        allocation[w] = MAIN_WEAPONS.includes(w) ? 0.3 * budget : (budget - main.length * 0.3 * budget) / (total - main.length);
      });
    } else if (total >= 5 && total < 9) {
      selected.forEach(w => {
        allocation[w] = MAIN_WEAPONS.includes(w) ? 0.25 * budget : (budget - main.length * 0.25 * budget) / (total - main.length);
      });
    } else if (total >= 9) {
      selected.forEach(w => {
        allocation[w] = MAIN_WEAPONS.includes(w) ? 0.13 * budget : (budget - main.length * 0.13 * budget) / (total - main.length);
      });
    }
  }
  // Apply 3% margin
  Object.keys(allocation).forEach(w => allocation[w] = allocation[w] - margin);
  return allocation;
}

// Helper: get best skin for weapon within budget
async function getBestSkin(weapon, budget) {
  let query = { weapon };
  if (weapon === 'Knife' || weapon === 'Gloves') query = { type: weapon.toLowerCase() };
  // Do NOT filter by color for custom-build
  const skins = await Skin.find({ ...query, price: { $lte: budget } }).sort({ price: -1 });
  return skins[0] || null;
}

// POST /api/custom-loadout
router.post('/api/custom-loadout', async (req, res) => {
  try {
    const { budget, weapons } = req.body;
    let selected = Array.isArray(weapons) ? weapons : [];
    if (!budget || isNaN(budget)) return res.status(400).json({ error: 'Invalid budget' });
    if (!selected.length) selected = ['AK-47'];
    const allocation = allocateBudget(budget, selected);
    const results = [];
    for (const weapon of selected) {
      const best = await getBestSkin(weapon, allocation[weapon] || 0);
      if (best) results.push(best);
    }
    const totalSpent = results.reduce((sum, s) => sum + (s.price || 0), 0);
    res.json({ loadout: results, totalSpent, budget });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
