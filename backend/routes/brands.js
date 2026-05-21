const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const [existing] = await db.query('SELECT * FROM brand WHERE name = ?', [name]);
    if (existing.length > 0) return res.status(400).json({ message: 'Brand already exists' });
    
    const [result] = await db.query('INSERT INTO brand (name, status) VALUES (?, ?)', [name, 'Active']);
    res.status(201).json({ id: result.insertId, name, status: 'Active' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
