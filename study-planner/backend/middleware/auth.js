// middleware/auth.js - JWT verification middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'study_planner_secret_2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
