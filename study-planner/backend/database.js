// database.js - Pure JavaScript JSON database
// NO native addons, NO compilation needed, works on ANY Windows/Mac/Linux
// Data is stored in db.json file next to server.js

const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// ── Default empty database structure ──
const DEFAULT_DB = {
  users:     [],
  subjects:  [],
  tasks:     [],
  schedules: [],
  _counters: { users: 0, subjects: 0, tasks: 0, schedules: 0 }
};

// ── Load database from file (or create fresh) ──
function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('DB load error, resetting:', e.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

// ── Save database to file ──
function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Get next auto-increment ID for a table ──
function nextId(table) {
  const data = load();
  data._counters[table] = (data._counters[table] || 0) + 1;
  save(data);
  return data._counters[table];
}

// ─────────────────────────────────────────────
// db object — mimics the sqlite3 async wrapper API
// All methods return Promises so routes use await
// ─────────────────────────────────────────────
const db = {

  // ── USERS ──────────────────────────────────

  users: {
    findByEmail(email) {
      const data = load();
      return Promise.resolve(data.users.find(u => u.email === email) || null);
    },
    findById(id) {
      const data = load();
      return Promise.resolve(data.users.find(u => u.user_id === id) || null);
    },
    create({ name, email, password }) {
      const data = load();
      const user_id = nextId('users');
      const user = { user_id, name, email, password, created_at: new Date().toISOString() };
      data.users.push(user);
      save(data);
      return Promise.resolve({ lastInsertRowid: user_id, row: user });
    }
  },

  // ── SUBJECTS ───────────────────────────────

  subjects: {
    allForUser(user_id) {
      const data = load();
      const list = data.subjects
        .filter(s => s.user_id === user_id)
        .sort((a, b) => a.subject_name.localeCompare(b.subject_name));
      return Promise.resolve(list);
    },
    findById(id, user_id) {
      const data = load();
      return Promise.resolve(
        data.subjects.find(s => s.subject_id === id && s.user_id === user_id) || null
      );
    },
    create({ subject_name, user_id }) {
      const data = load();
      const subject_id = nextId('subjects');
      const subject = { subject_id, subject_name, user_id };
      data.subjects.push(subject);
      save(data);
      return Promise.resolve({ lastInsertRowid: subject_id, row: subject });
    },
    delete(subject_id, user_id) {
      const data = load();
      const before = data.subjects.length;
      data.subjects = data.subjects.filter(
        s => !(s.subject_id === subject_id && s.user_id === user_id)
      );
      // Cascade: delete tasks for this subject
      data.tasks = data.tasks.filter(t => t.subject_id !== subject_id);
      save(data);
      return Promise.resolve({ changes: before - data.subjects.length });
    }
  },

  // ── TASKS ──────────────────────────────────

  tasks: {
    // Get all tasks for a user, joined with subject_name
    allForUser(user_id) {
      const data = load();
      const tasks = data.tasks
        .filter(t => t.user_id === user_id)
        .map(t => {
          const subj = data.subjects.find(s => s.subject_id === t.subject_id);
          return { ...t, subject_name: subj ? subj.subject_name : 'Unknown' };
        })
        .sort((a, b) => {
          if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
          return a.priority - b.priority;
        });
      return Promise.resolve(tasks);
    },
    // Pending tasks only (for scheduling)
    pendingForUser(user_id) {
      const data = load();
      const tasks = data.tasks
        .filter(t => t.user_id === user_id && t.status === 'pending')
        .map(t => {
          const subj = data.subjects.find(s => s.subject_id === t.subject_id);
          return { ...t, subject_name: subj ? subj.subject_name : 'Unknown' };
        })
        .sort((a, b) => {
          if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
          return a.priority - b.priority;
        });
      return Promise.resolve(tasks);
    },
    findById(task_id, user_id) {
      const data = load();
      const t = data.tasks.find(t => t.task_id === task_id && t.user_id === user_id);
      if (!t) return Promise.resolve(null);
      const subj = data.subjects.find(s => s.subject_id === t.subject_id);
      return Promise.resolve({ ...t, subject_name: subj ? subj.subject_name : 'Unknown' });
    },
    create({ title, deadline, priority, estimated_time, subject_id, user_id }) {
      const data = load();
      const task_id = nextId('tasks');
      const task = {
        task_id, title, deadline,
        priority: parseInt(priority),
        estimated_time: parseFloat(estimated_time),
        subject_id, user_id,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      data.tasks.push(task);
      save(data);
      const subj = data.subjects.find(s => s.subject_id === subject_id);
      return Promise.resolve({
        lastInsertRowid: task_id,
        row: { ...task, subject_name: subj ? subj.subject_name : 'Unknown' }
      });
    },
    update(task_id, user_id, fields) {
      const data = load();
      const idx = data.tasks.findIndex(t => t.task_id === task_id && t.user_id === user_id);
      if (idx === -1) return Promise.resolve({ changes: 0 });
      data.tasks[idx] = { ...data.tasks[idx], ...fields };
      save(data);
      const t = data.tasks[idx];
      const subj = data.subjects.find(s => s.subject_id === t.subject_id);
      return Promise.resolve({
        changes: 1,
        row: { ...t, subject_name: subj ? subj.subject_name : 'Unknown' }
      });
    },
    delete(task_id, user_id) {
      const data = load();
      const before = data.tasks.length;
      data.tasks = data.tasks.filter(
        t => !(t.task_id === task_id && t.user_id === user_id)
      );
      // Cascade: remove from schedules
      data.schedules = data.schedules.filter(s => s.task_id !== task_id);
      save(data);
      return Promise.resolve({ changes: before - data.tasks.length });
    }
  },

  // ── SCHEDULES ──────────────────────────────

  schedules: {
    forUser(user_id) {
      const data = load();
      const entries = data.schedules
        .filter(s => s.user_id === user_id)
        .map(s => {
          const t    = data.tasks.find(t => t.task_id === s.task_id);
          const subj = t ? data.subjects.find(sub => sub.subject_id === t.subject_id) : null;
          return {
            schedule_id:    s.schedule_id,
            date:           s.date,
            time_slot:      s.time_slot,
            task_id:        s.task_id,
            title:          t ? t.title : '',
            deadline:       t ? t.deadline : '',
            priority:       t ? t.priority : 2,
            estimated_time: t ? t.estimated_time : 1,
            status:         t ? t.status : 'pending',
            subject_name:   subj ? subj.subject_name : 'Unknown'
          };
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? -1 : 1;
          return a.time_slot < b.time_slot ? -1 : 1;
        });
      return Promise.resolve(entries);
    },
    clearForUser(user_id) {
      const data = load();
      data.schedules = data.schedules.filter(s => s.user_id !== user_id);
      save(data);
      return Promise.resolve();
    },
    bulkInsert(entries) {
      // entries: [{ date, task_id, time_slot, user_id }]
      const data = load();
      for (const e of entries) {
        const schedule_id = nextId('schedules');
        data.schedules.push({ schedule_id, ...e });
      }
      save(data);
      return Promise.resolve();
    }
  }
};

// Initialize db.json if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  save(DEFAULT_DB);
  console.log('✅ Fresh database created (db.json)');
} else {
  console.log('✅ Database loaded (db.json)');
}

module.exports = db;
