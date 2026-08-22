import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SUBJECTS_META, getScheduleForDay, getWeeklySubjectCounts } from './timetable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'attendance.json');
const BACKUP_FILE = path.join(DATA_DIR, 'attendance.backup.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_STATE = {
  config: {
    group: 'A',
    studentName: 'GTBIT 2nd Year IT-1',
    targetThreshold: 75,
    minWarningThreshold: 60
  },
  baseStats: {}, // e.g. { CM_Th: { present: 0, total: 0 } }
  dailyRecords: {}, // e.g. { "2026-08-22": { "fri_09_10": "present" } }
  customClasses: {} // e.g. extra/custom classes added manually
};

class AttendanceDB {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          config: { ...DEFAULT_STATE.config, ...(parsed.config || {}) }
        };
      }
    } catch (err) {
      console.error('Error loading DB file, attempting backup recovery:', err);
      try {
        if (fs.existsSync(BACKUP_FILE)) {
          const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
          return JSON.parse(raw);
        }
      } catch (backupErr) {
        console.error('Backup load failed:', backupErr);
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save() {
    try {
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_FILE, serialized, 'utf-8');
      // Create backup
      fs.writeFileSync(BACKUP_FILE, serialized, 'utf-8');
    } catch (err) {
      console.error('Failed to save attendance DB:', err);
    }
  }

  getConfig() {
    return this.data.config;
  }

  updateConfig(updates) {
    this.data.config = { ...this.data.config, ...updates };
    this.save();
    return this.data.config;
  }

  /**
   * Get attendance records for a specific date (YYYY-MM-DD)
   */
  getDayAttendance(dateStr) {
    const records = this.data.dailyRecords[dateStr] || {};
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon ...
    const group = this.data.config.group || 'A';
    const schedule = getScheduleForDay(dayOfWeek, group);

    // Merge schedule slots with marked attendance
    const slots = schedule.slots.map((slot) => {
      const status = records[slot.id] || 'unmarked'; // 'present' | 'absent' | 'cancelled' | 'unmarked'
      const meta = SUBJECTS_META[slot.subject] || {};
      return {
        ...slot,
        subjectMeta: meta,
        status
      };
    });

    return {
      date: dateStr,
      dayOfWeek,
      dayName: schedule.dayName,
      group,
      slots,
      unmarkedCount: slots.filter((s) => s.status === 'unmarked').length
    };
  }

  /**
   * Mark attendance for a single slot on a given date
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} slotId
   * @param {string} status 'present' | 'absent' | 'cancelled' | 'unmarked'
   * @param {string} subject Optional subject code
   */
  markSlot(dateStr, slotId, status, subject = null) {
    if (!this.data.dailyRecords[dateStr]) {
      this.data.dailyRecords[dateStr] = {};
    }

    if (status === 'unmarked') {
      delete this.data.dailyRecords[dateStr][slotId];
      if (Object.keys(this.data.dailyRecords[dateStr]).length === 0) {
        delete this.data.dailyRecords[dateStr];
      }
    } else {
      this.data.dailyRecords[dateStr][slotId] = status;
    }

    this.save();
    return this.getDayAttendance(dateStr);
  }

  /**
   * Bulk mark all slots for a day
   */
  markWholeDay(dateStr, status) {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const group = this.data.config.group || 'A';
    const schedule = getScheduleForDay(dayOfWeek, group);

    if (!this.data.dailyRecords[dateStr]) {
      this.data.dailyRecords[dateStr] = {};
    }

    schedule.slots.forEach((slot) => {
      if (status === 'unmarked') {
        delete this.data.dailyRecords[dateStr][slot.id];
      } else {
        this.data.dailyRecords[dateStr][slot.id] = status;
      }
    });

    if (status === 'unmarked' && Object.keys(this.data.dailyRecords[dateStr]).length === 0) {
      delete this.data.dailyRecords[dateStr];
    }

    this.save();
    return this.getDayAttendance(dateStr);
  }

  /**
   * Seed / Edit base stats for a subject
   */
  seedSubjectStats(subjectCode, present, total) {
    if (!SUBJECTS_META[subjectCode]) {
      throw new Error(`Invalid subject code: ${subjectCode}`);
    }
    this.data.baseStats[subjectCode] = {
      present: Math.max(0, parseInt(present, 10) || 0),
      total: Math.max(0, parseInt(total, 10) || 0)
    };
    this.save();
    return this.getCalculatedStats();
  }

  /**
   * Clear all records for a date
   */
  clearDate(dateStr) {
    if (this.data.dailyRecords[dateStr]) {
      delete this.data.dailyRecords[dateStr];
      this.save();
    }
    return this.getDayAttendance(dateStr);
  }

  /**
   * Get full history timeline of recorded dates
   */
  getHistory() {
    const dates = Object.keys(this.data.dailyRecords).sort().reverse();
    return dates.map((d) => this.getDayAttendance(d));
  }

  /**
   * Get monthly summary for calendar view
   */
  getMonthSummary(year, month) {
    const group = this.data.config.group || 'A';
    const numDays = new Date(year, month, 0).getDate();
    const days = [];

    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = this.getDayAttendance(dateStr);
      const totalSlots = dayData.slots.length;
      const presentCount = dayData.slots.filter((s) => s.status === 'present').length;
      const absentCount = dayData.slots.filter((s) => s.status === 'absent').length;
      const cancelledCount = dayData.slots.filter((s) => s.status === 'cancelled').length;
      const unmarkedCount = dayData.slots.filter((s) => s.status === 'unmarked').length;
      const isRecorded = !!this.data.dailyRecords[dateStr];

      let statusType = 'none'; // 'none' | 'perfect' | 'warning' | 'critical' | 'holiday'
      if (totalSlots === 0) {
        statusType = 'off';
      } else if (isRecorded) {
        if (cancelledCount === totalSlots) {
          statusType = 'holiday';
        } else if (presentCount === totalSlots) {
          statusType = 'perfect';
        } else if (absentCount > 0) {
          const held = presentCount + absentCount;
          const ratio = held > 0 ? presentCount / held : 1;
          statusType = ratio < 0.6 ? 'critical' : 'warning';
        } else {
          statusType = 'partial';
        }
      }

      days.push({
        date: dateStr,
        dayNumber: day,
        dayOfWeek: dayData.dayOfWeek,
        dayName: dayData.dayName,
        totalSlots,
        presentCount,
        absentCount,
        cancelledCount,
        unmarkedCount,
        isRecorded,
        statusType
      });
    }

    return {
      year,
      month,
      days
    };
  }

  /**
   * Compute comprehensive stats, percentage, recommendations, and bunk buffers
   */
  getCalculatedStats() {
    const group = this.data.config.group || 'A';
    const weeklyCounts = getWeeklySubjectCounts(group);

    // Initialize counters for all known subjects
    const subjectsMap = {};
    for (const [code, meta] of Object.entries(SUBJECTS_META)) {
      // Check if subject is relevant to this group (e.g. Group A doesn't take Group B labs)
      const weeklyFrequency = weeklyCounts[code] || 0;
      // Also check if there are base stats or logs for this subject
      const base = this.data.baseStats[code] || { present: 0, total: 0 };

      subjectsMap[code] = {
        code,
        name: meta.name,
        teacher: meta.teacher,
        room: meta.room,
        type: meta.type,
        color: meta.color,
        weeklyFrequency,
        basePresent: base.present,
        baseTotal: base.total,
        loggedPresent: 0,
        loggedAbsent: 0,
        loggedCancelled: 0,
        totalPresent: base.present,
        totalAbsent: Math.max(0, base.total - base.present),
        totalCancelled: 0,
        totalHeld: base.total,
        percentage: 0
      };
    }

    // Map slot id to subject code for lookup
    const slotToSubjectMap = {};
    for (let d = 0; d <= 6; d++) {
      const sched = getScheduleForDay(d, group);
      for (const slot of sched.slots) {
        slotToSubjectMap[slot.id] = slot.subject;
      }
    }

    // Aggregate daily records
    for (const [dateStr, records] of Object.entries(this.data.dailyRecords)) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      const daySched = getScheduleForDay(dayOfWeek, group);
      const daySlotsMap = Object.fromEntries(daySched.slots.map((s) => [s.id, s]));

      for (const [slotId, status] of Object.entries(records)) {
        const slot = daySlotsMap[slotId];
        const subjectCode = slot ? slot.subject : slotToSubjectMap[slotId];

        if (subjectCode && subjectsMap[subjectCode]) {
          const s = subjectsMap[subjectCode];
          if (status === 'present') {
            s.loggedPresent += 1;
            s.totalPresent += 1;
            s.totalHeld += 1;
          } else if (status === 'absent') {
            s.loggedAbsent += 1;
            s.totalAbsent += 1;
            s.totalHeld += 1;
          } else if (status === 'cancelled') {
            s.loggedCancelled += 1;
            s.totalCancelled += 1;
            // Cancelled does NOT increase totalHeld or totalPresent
          }
        }
      }
    }

    // Compute metrics & recommendation for each subject
    const subjectList = Object.values(subjectsMap)
      .filter((s) => s.weeklyFrequency > 0 || s.totalHeld > 0)
      .map((s) => {
        const P = s.totalPresent;
        const T = s.totalHeld;
        const pct = T === 0 ? 100 : Math.round((P / T) * 1000) / 10;
        s.percentage = pct;

        // Recommendation math
        // Required for 60%
        let needFor60 = 0;
        if (pct < 60) {
          needFor60 = Math.max(0, Math.ceil((0.60 * T - P) / 0.40));
        }

        // Required for 70%
        let needFor70 = 0;
        if (pct < 70) {
          needFor70 = Math.max(0, Math.ceil((0.70 * T - P) / 0.30));
        }

        // Required for 75%
        let needFor75 = 0;
        if (pct < 75) {
          needFor75 = Math.max(0, Math.ceil((0.75 * T - P) / 0.25));
        }

        // Safe bunks
        let safeBunk75 = 0;
        if (pct >= 75 && T > 0) {
          safeBunk75 = Math.max(0, Math.floor((P - 0.75 * T) / 0.75));
        }

        let safeBunk60 = 0;
        if (pct >= 60 && T > 0) {
          safeBunk60 = Math.max(0, Math.floor((P - 0.60 * T) / 0.60));
        }

        // Weekly guidance
        let advice = '';
        let statusCategory = 'green'; // 'red' | 'yellow' | 'green'

        if (pct < 60) {
          statusCategory = 'red';
          const weeklyFreq = s.weeklyFrequency;
          if (weeklyFreq > 0) {
            const weeksNeeded = (needFor60 / weeklyFreq).toFixed(1);
            advice = `⚠️ Critical (<60%): Attend next ${needFor60} classes in a row to reach 60%. (Next week has ${weeklyFreq} classes, attend all).`;
          } else {
            advice = `⚠️ Critical: Need ${needFor60} consecutive classes to hit 60%.`;
          }
        } else if (pct < 70) {
          statusCategory = 'yellow';
          advice = `📈 Moderate (60-70%): Attend next ${needFor70} classes to reach 70% (or ${needFor75} for 75% IPU ideal).`;
        } else if (pct < 75) {
          statusCategory = 'yellow';
          advice = `🎯 Approaching safe zone: Attend next ${needFor75} classes to hit 75% IPU criteria.`;
        } else {
          statusCategory = 'green';
          if (safeBunk75 > 0) {
            advice = `🌴 Safe zone: You can safely bunk ${safeBunk75} class${safeBunk75 > 1 ? 'es' : ''} and still maintain ≥75%.`;
          } else {
            advice = `✅ On target (≥75%): Attend upcoming classes to build a bunk buffer.`;
          }
        }

        return {
          ...s,
          needFor60,
          needFor70,
          needFor75,
          safeBunk75,
          safeBunk60,
          statusCategory,
          advice
        };
      });

    // Overall aggregate stats
    const totalP = subjectList.reduce((acc, s) => acc + s.totalPresent, 0);
    const totalT = subjectList.reduce((acc, s) => acc + s.totalHeld, 0);
    const overallPct = totalT === 0 ? 100 : Math.round((totalP / totalT) * 1000) / 10;

    let overallSafeBunks75 = 0;
    let overallNeedFor75 = 0;
    if (overallPct >= 75 && totalT > 0) {
      overallSafeBunks75 = Math.max(0, Math.floor((totalP - 0.75 * totalT) / 0.75));
    } else if (overallPct < 75) {
      overallNeedFor75 = Math.max(0, Math.ceil((0.75 * totalT - totalP) / 0.25));
    }

    const under60Subjects = subjectList.filter((s) => s.percentage < 60 && s.totalHeld > 0);
    const under70Subjects = subjectList.filter((s) => s.percentage >= 60 && s.percentage < 70 && s.totalHeld > 0);

    return {
      overall: {
        totalPresent: totalP,
        totalHeld: totalT,
        percentage: overallPct,
        statusCategory: overallPct < 60 ? 'red' : overallPct < 75 ? 'yellow' : 'green',
        safeBunks75: overallSafeBunks75,
        needFor75: overallNeedFor75,
        totalRecordedDays: Object.keys(this.data.dailyRecords).length,
        criticalSubjectsCount: under60Subjects.length,
        warningSubjectsCount: under70Subjects.length
      },
      subjects: subjectList,
      group
    };
  }
}

export const db = new AttendanceDB();
