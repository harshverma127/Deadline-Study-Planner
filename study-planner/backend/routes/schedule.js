// routes/schedule.js - Processing + Output Module

const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const Scheduler = require('../scheduler');

router.use(auth);

// GET /api/schedule/generate — Processing Module
router.get('/generate', async (req, res) => {
  try {
    const tasks = await db.tasks.pendingForUser(req.user.user_id);

    if (tasks.length === 0)
      return res.json({ schedule: [], message: 'No pending tasks to schedule' });

    // Use Scheduler class to generate schedule
    const schedule = Scheduler.generateSchedule(tasks);

    // Clear old schedule, save new one
    await db.schedules.clearForUser(req.user.user_id);
    await db.schedules.bulkInsert(
      schedule.map(e => ({
        date: e.date,
        task_id: e.task_id,
        time_slot: e.time_slot,
        user_id: req.user.user_id
      }))
    );

    res.json({ schedule, message: 'Schedule generated successfully' });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// GET /api/schedule — Output Module
router.get('/', async (req, res) => {
  try {
    const schedule = await db.schedules.forUser(req.user.user_id);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

module.exports = router;
