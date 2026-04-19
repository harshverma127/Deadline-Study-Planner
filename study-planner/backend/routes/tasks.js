// routes/tasks.js - Task Management (Input Module)

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// GET all tasks for user
router.get('/', async (req, res) => {
  try {
    const tasks = await db.tasks.allForUser(req.user.user_id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const { title, deadline, priority, estimated_time, subject_id } = req.body;

    if (!title || !deadline || !subject_id)
      return res.status(400).json({ error: 'Title, deadline, and subject are required' });

    // No past deadlines
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today)
      return res.status(400).json({ error: 'Deadline cannot be in the past' });

    const priorityNum = parseInt(priority) || 2;
    if (![1, 2, 3].includes(priorityNum))
      return res.status(400).json({ error: 'Priority must be 1 (High), 2 (Medium), or 3 (Low)' });

    const estTime = parseFloat(estimated_time) || 1.0;
    if (estTime <= 0 || estTime > 24)
      return res.status(400).json({ error: 'Estimated time must be between 0.5 and 24 hours' });

    // Verify subject belongs to user
    const subject = await db.subjects.findById(parseInt(subject_id), req.user.user_id);
    if (!subject)
      return res.status(404).json({ error: 'Subject not found' });

    const result = await db.tasks.create({
      title: title.trim(), deadline, priority: priorityNum,
      estimated_time: estTime,
      subject_id: parseInt(subject_id),
      user_id: req.user.user_id
    });
    res.status(201).json(result.row);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const existing = await db.tasks.findById(taskId, req.user.user_id);
    if (!existing)
      return res.status(404).json({ error: 'Task not found' });

    // Validate deadline if changed
    if (req.body.deadline) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(req.body.deadline) < today)
        return res.status(400).json({ error: 'Deadline cannot be in the past' });
    }

    // Build update fields (only update what was sent)
    const fields = {};
    if (req.body.title)          fields.title          = req.body.title;
    if (req.body.deadline)       fields.deadline       = req.body.deadline;
    if (req.body.priority)       fields.priority       = parseInt(req.body.priority);
    if (req.body.estimated_time) fields.estimated_time = parseFloat(req.body.estimated_time);
    if (req.body.subject_id)     fields.subject_id     = parseInt(req.body.subject_id);
    if (req.body.status)         fields.status         = req.body.status;

    const result = await db.tasks.update(taskId, req.user.user_id, fields);
    res.json(result.row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.tasks.delete(parseInt(req.params.id), req.user.user_id);
    if (result.changes === 0)
      return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
