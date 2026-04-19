// scheduler.js - Core Scheduling Logic (matches Class Diagram)
// Modules: Processing Module (priority + scheduling)

class Scheduler {
  
  // ─────────────────────────────────────────
  // PRIORITY CALCULATION
  // Lower score = higher priority (sorts first)
  // ─────────────────────────────────────────
  static calculatePriorityScore(task) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);

    // Days remaining until deadline
    const daysUntilDeadline = Math.max(
      0,
      Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
    );

    // Priority weight: 1=High → weight 3, 2=Medium → weight 2, 3=Low → weight 1
    const priorityWeight = 4 - task.priority; // High=3, Medium=2, Low=1

    // Score: fewer days left + higher priority = lower score = sorted first
    // Multiply days by 10 so deadline dominates, then subtract priority weight
    const score = daysUntilDeadline * 10 - priorityWeight;

    return score;
  }

  // ─────────────────────────────────────────
  // SORT TASKS
  // 1st: Earliest deadline
  // 2nd: Highest priority (1 > 2 > 3)
  // ─────────────────────────────────────────
  static sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
      // Primary sort: deadline (ascending)
      const deadlineA = new Date(a.deadline);
      const deadlineB = new Date(b.deadline);
      if (deadlineA - deadlineB !== 0) {
        return deadlineA - deadlineB;
      }
      // Secondary sort: priority (1=High comes first)
      return a.priority - b.priority;
    });
  }

  // ─────────────────────────────────────────
  // GENERATE SCHEDULE
  // Assigns tasks to time slots across days
  // Max 3–4 tasks per day
  // Spreads tasks between today and deadline
  // ─────────────────────────────────────────
  static generateSchedule(tasks) {
    const MAX_TASKS_PER_DAY = 4;
    const TIME_SLOTS = [
      '08:00 - 09:00',
      '09:30 - 10:30',
      '11:00 - 12:00',
      '14:00 - 15:00',
      '15:30 - 16:30',
      '17:00 - 18:00',
      '19:00 - 20:00',
      '20:30 - 21:30',
    ];

    // Filter only pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    if (pendingTasks.length === 0) return [];

    // Sort tasks by deadline + priority
    const sortedTasks = this.sortTasks(pendingTasks);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map: dateString → [tasks assigned to that day]
    const dayMap = {};

    for (const task of sortedTasks) {
      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      // How many days available (today to deadline)
      const daysAvailable = Math.max(
        1,
        Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) + 1
      );

      // Estimated hours needed
      const hoursNeeded = task.estimated_time || 1;

      // How many slots needed (each slot = 1 hour, rounded up)
      const slotsNeeded = Math.ceil(hoursNeeded);

      // Try to spread: assign 1 slot per day, starting today
      let slotsAssigned = 0;
      let dayOffset = 0;

      while (slotsAssigned < slotsNeeded && dayOffset < daysAvailable) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayOffset);
        const dateStr = this.formatDate(currentDate);

        // Initialize day if not yet in map
        if (!dayMap[dateStr]) {
          dayMap[dateStr] = [];
        }

        // Add task to this day if under limit
        if (dayMap[dateStr].length < MAX_TASKS_PER_DAY) {
          dayMap[dateStr].push({ task, slotIndex: dayMap[dateStr].length });
          slotsAssigned++;
        }

        dayOffset++;

        // If we've gone past deadline days, wrap back to today
        if (dayOffset >= daysAvailable && slotsAssigned < slotsNeeded) {
          dayOffset = 0; // restart from today for remaining slots
          // Avoid infinite loop: if no day has room, break
          const hasRoom = Object.values(dayMap).some(
            d => d.length < MAX_TASKS_PER_DAY
          );
          if (!hasRoom) break;
        }
      }
    }

    // Convert dayMap to flat schedule entries
    const schedule = [];
    const sortedDates = Object.keys(dayMap).sort();

    for (const dateStr of sortedDates) {
      const entries = dayMap[dateStr];
      entries.forEach((entry, index) => {
        schedule.push({
          date: dateStr,
          task_id: entry.task.task_id,
          time_slot: TIME_SLOTS[index % TIME_SLOTS.length],
          task: entry.task,
        });
      });
    }

    return schedule;
  }

  // ─────────────────────────────────────────
  // HELPER: Format date as YYYY-MM-DD
  // ─────────────────────────────────────────
  static formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ─────────────────────────────────────────
  // HELPER: Get priority label from number
  // ─────────────────────────────────────────
  static getPriorityLabel(priority) {
    const labels = { 1: 'High', 2: 'Medium', 3: 'Low' };
    return labels[priority] || 'Medium';
  }
}

module.exports = Scheduler;
