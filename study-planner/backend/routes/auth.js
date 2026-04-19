// routes/auth.js - Register and Login

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');

const JWT_SECRET = 'study_planner_secret_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await db.users.findByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Email already registered' });

    const hashed = bcrypt.hashSync(password, 10);
    const result = await db.users.create({ name, email, password: hashed });

    const token = jwt.sign(
      { user_id: result.lastInsertRowid, name, email },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.status(201).json({
      message: 'Registration successful', token,
      user: { user_id: result.lastInsertRowid, name, email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await db.users.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({
      message: 'Login successful', token,
      user: { user_id: user.user_id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
