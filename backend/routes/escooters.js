const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const [escooters] = await db.query(`
      SELECT e.*, b.name as brand_name 
      FROM escooter e 
      LEFT JOIN brand b ON e.id_brand = b.id 
      ORDER BY e.id DESC
    `);
    res.json(escooters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST
router.post('/', auth, async (req, res) => {
  const { id_brand, model, description, date_launched, battery_voltage, battery_capacity, motor_watt, charger_voltage, status } = req.body;
  try {
    await db.query(
      'INSERT INTO escooter (id_brand, model, description, date_launched, battery_voltage, battery_capacity, motor_watt, charger_voltage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id_brand || null, model, description, date_launched || null, battery_voltage, battery_capacity, motor_watt, charger_voltage, status || 'Active']
    );
    res.status(201).json({ message: 'Escooter created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT
router.put('/:id', auth, async (req, res) => {
  const { id_brand, model, description, date_launched, battery_voltage, battery_capacity, motor_watt, charger_voltage, status } = req.body;
  try {
    await db.query(
      'UPDATE escooter SET id_brand=?, model=?, description=?, date_launched=?, battery_voltage=?, battery_capacity=?, motor_watt=?, charger_voltage=?, status=? WHERE id=?',
      [id_brand || null, model, description, date_launched || null, battery_voltage, battery_capacity, motor_watt, charger_voltage, status || 'Active', req.params.id]
    );
    res.json({ message: 'Escooter updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM escooter WHERE id = ?', [req.params.id]);
    res.json({ message: 'Escooter deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
