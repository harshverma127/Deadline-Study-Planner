# 📚 Deadline-Aware Study Planner

A full-stack web application for students to manage study tasks with automatic deadline-based scheduling.

---

## 🗂️ Folder Structure

```
study-planner/
├── backend/
│   ├── server.js          ← Express server entry point
│   ├── database.js        ← SQLite initialization (all 4 ER tables)
│   ├── scheduler.js       ← Scheduler class (priority + schedule logic)
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js        ← JWT authentication middleware
│   └── routes/
│       ├── auth.js        ← Register / Login
│       ├── subjects.js    ← Subject CRUD
│       ├── tasks.js       ← Task CRUD (Input Module)
│       └── schedule.js    ← Schedule generation (Processing + Output)
└── frontend/
    ├── index.html         ← Login / Register page
    ├── css/
    │   └── style.css      ← Pastel design system
    ├── js/
    │   └── app.js         ← Shared API helper + utilities
    └── pages/
        ├── dashboard.html ← Task list + subjects manager
        ├── add-task.html  ← Add new task form
        └── schedule.html  ← Generated schedule view
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v16+ installed  
- npm installed

### Steps

```bash
# 1. Go into the backend folder
cd study-planner/backend

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
```

### Open in Browser
```
http://localhost:3000
```

---

## 🧑‍💻 How to Use

1. **Register** a new account (or login if already registered)
2. Go to **Dashboard** → Add subjects (e.g. "Mathematics", "Physics")
3. Go to **Add Task** → Fill in title, subject, deadline, priority, time
4. Go to **Schedule** → Click **⚡ Generate Schedule**
5. View your auto-generated daily study plan!

---

## 🧩 Architecture (matches ER + Class Diagrams)

### Entities
| Entity   | Table      | Key Fields                                      |
|----------|------------|-------------------------------------------------|
| User     | users      | user_id, name, email, password                  |
| Subject  | subjects   | subject_id, subject_name, user_id               |
| Task     | tasks      | task_id, title, deadline, priority, subject_id  |
| Schedule | schedules  | schedule_id, date, task_id, time_slot           |

### Classes
- **User** — Authentication, JWT token management  
- **Subject** — Belongs to a User, groups Tasks  
- **Task** — Core entity with deadline + priority  
- **Scheduler** — `sortTasks()`, `calculatePriorityScore()`, `generateSchedule()`

### DFD Modules
- **Input Module** — `routes/tasks.js`, `routes/subjects.js`  
- **Processing Module** — `scheduler.js` + `routes/schedule.js`  
- **Output Module** — `routes/schedule.js` GET + `frontend/pages/schedule.html`

---

## 🧠 Scheduling Logic

```
1. Filter pending tasks
2. Sort by: earliest deadline → highest priority (1 > 2 > 3)
3. For each task:
   - Calculate available days (today → deadline)
   - Distribute 1 time slot per day
   - Max 4 tasks per day
4. Assign time slots: 08:00, 09:30, 11:00, 14:00...
```

---

## 🔐 API Endpoints

| Method | Endpoint               | Description             |
|--------|------------------------|-------------------------|
| POST   | /api/auth/register     | Register new user       |
| POST   | /api/auth/login        | Login                   |
| GET    | /api/subjects          | Get subjects            |
| POST   | /api/subjects          | Create subject          |
| DELETE | /api/subjects/:id      | Delete subject          |
| GET    | /api/tasks             | Get all tasks           |
| POST   | /api/tasks             | Create task             |
| PUT    | /api/tasks/:id         | Update task             |
| DELETE | /api/tasks/:id         | Delete task             |
| GET    | /api/schedule          | Get saved schedule      |
| GET    | /api/schedule/generate | Regenerate schedule     |

---

## ✅ Validations
- No past deadlines allowed  
- Password minimum 6 characters  
- Estimated time: 0.5–8 hours  
- Priority must be 1 (High), 2 (Medium), or 3 (Low)  
- Subject must belong to the logged-in user  

---

*Built for academic college project — simple, clean, fully functional.*
