const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET brands
router.get('/brands', auth, async (req, res) => {
  try {
    const [brands] = await db.query('SELECT * FROM brand ORDER BY name ASC');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET escooters (models)
router.get('/models', auth, async (req, res) => {
  try {
    const [models] = await db.query('SELECT e.*, b.name as brand_name FROM escooter e LEFT JOIN brand b ON e.id_brand = b.id ORDER BY b.name, e.model ASC');
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
