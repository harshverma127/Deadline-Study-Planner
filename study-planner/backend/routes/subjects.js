// routes/subjects.js - Subject Management

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// GET all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await db.subjects.allForUser(req.user.user_id);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// POST create subject
router.post('/', async (req, res) => {
  try {
    const { subject_name } = req.body;
    if (!subject_name || !subject_name.trim())
      return res.status(400).json({ error: 'Subject name is required' });

    const result = await db.subjects.create({
      subject_name: subject_name.trim(),
      user_id: req.user.user_id
    });
    res.status(201).json(result.row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// DELETE subject
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.subjects.delete(
      parseInt(req.params.id), req.user.user_id
    );
    if (result.changes === 0)
      return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
