const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET all users (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, date_registered, full_name, email, status FROM users ORDER BY id DESC');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update user status (Protected)
router.put('/:id', auth, async (req, res) => {
  const { status, full_name, email } = req.body;
  const userId = req.params.id;

  try {
    // Only updating fields that are provided
    let query = 'UPDATE users SET ';
    const queryParams = [];
    
    if (status) {
      query += 'status = ?, ';
      queryParams.push(status);
    }
    if (full_name) {
      query += 'full_name = ?, ';
      queryParams.push(full_name);
    }
    if (email) {
      query += 'email = ?, ';
      queryParams.push(email);
    }

    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    queryParams.push(userId);

    await db.query(query, queryParams);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE user (Protected)
router.delete('/:id', auth, async (req, res) => {
  const userId = req.params.id;

  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
