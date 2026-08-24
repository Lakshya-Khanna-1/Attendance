import express from 'express';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db.js';
import { SUBJECTS_META, WEEKLY_TIMETABLE, getScheduleForDay } from './src/timetable.js';
import { runDailyGitPush, generateDailySummary } from './scripts/daily_sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8017;
const HOST = '0.0.0.0';

// Automated daily push at exactly 5:00 PM (17:00 IST)
function scheduleDaily5pmPush() {
  const now = new Date();
  const target = new Date();
  target.setHours(17, 0, 0, 0);

  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  const hoursUntil = (delay / (1000 * 60 * 60)).toFixed(2);
  console.log(`⏰ [AutoPusher] Daily 5:00 PM GitHub sync scheduled in ${hoursUntil} hours (at ${target.toLocaleTimeString()})`);

  setTimeout(() => {
    try {
      console.log('⏰ [AutoPusher] Running automated 5:00 PM GitHub push...');
      runDailyGitPush();
    } catch (err) {
      console.error('❌ [AutoPusher] Scheduled push error:', err);
    }
    // Schedule next day
    scheduleDaily5pmPush();
  }, delay);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Network helpers to detect Tailscale and LAN IPs
function getNetworkInterfaces() {
  const nets = os.networkInterfaces();
  const results = {
    tailscale: [],
    lan: [],
    all: []
  };

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        const item = {
          name,
          address: net.address,
          url: `http://${net.address}:${PORT}`
        };
        results.all.push(item);

        // Check if Tailscale interface (Tailscale CGNAT range is 100.64.0.0/10, i.e., starts with 100.)
        if (net.address.startsWith('100.') || name.toLowerCase().includes('tailscale')) {
          results.tailscale.push(item);
        } else {
          results.lan.push(item);
        }
      }
    }
  }

  // Always ensure Tailscale IP fallback if interface is virtual
  const knownTailscaleIp = '100.72.67.61';
  if (!results.tailscale.some(t => t.address === knownTailscaleIp)) {
    results.tailscale.unshift({
      name: 'Tailscale (MagicDNS)',
      address: knownTailscaleIp,
      url: `http://${knownTailscaleIp}:${PORT}`
    });
  }

  return results;
}

// API Routes

// 1. Get Network & Tailscale Connection Info
app.get('/api/network-info', (req, res) => {
  const interfaces = getNetworkInterfaces();
  const hostname = os.hostname();
  res.json({
    port: PORT,
    hostname,
    localUrl: `http://localhost:${PORT}`,
    tailscaleIps: interfaces.tailscale,
    lanIps: interfaces.lan,
    allIps: interfaces.all
  });
});

// 2. Get Config & Meta
app.get('/api/config', (req, res) => {
  res.json({
    config: db.getConfig(),
    subjects: SUBJECTS_META
  });
});

app.post('/api/config', (req, res) => {
  const updated = db.updateConfig(req.body);
  res.json({ config: updated });
});

// 3. Get Full Weekly Timetable
app.get('/api/timetable', (req, res) => {
  const group = req.query.group || db.getConfig().group || 'A';
  const timetable = {};
  for (let d = 1; d <= 5; d++) {
    timetable[d] = getScheduleForDay(d, group);
  }
  res.json({
    group,
    timetable,
    subjects: SUBJECTS_META
  });
});

// 4. Get Day Attendance (Specific Date YYYY-MM-DD)
app.get('/api/day/:date', (req, res) => {
  const dateStr = req.params.date;
  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }
  const dayData = db.getDayAttendance(dateStr);
  res.json(dayData);
});

// 5. Mark Attendance for a single slot
app.post('/api/attendance/mark', (req, res) => {
  const { date, slotId, status, subject } = req.body;
  if (!date || !slotId || !status) {
    return res.status(400).json({ error: 'Missing date, slotId or status' });
  }
  if (!['present', 'absent', 'cancelled', 'unmarked'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const result = db.markSlot(date, slotId, status, subject);
  const stats = db.getCalculatedStats();
  res.json({ day: result, stats });
});

// 6. Mark Attendance for Whole Day
app.post('/api/attendance/mark-day', (req, res) => {
  const { date, status } = req.body;
  if (!date || !status) {
    return res.status(400).json({ error: 'Missing date or status' });
  }
  const result = db.markWholeDay(date, status);
  const stats = db.getCalculatedStats();
  res.json({ day: result, stats });
});

// 7. Clear Day Attendance
app.post('/api/attendance/clear-day', (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: 'Missing date' });
  }
  const result = db.clearDate(date);
  const stats = db.getCalculatedStats();
  res.json({ day: result, stats });
});

// 8. Get Overall Stats & Recommendations
app.get('/api/stats', (req, res) => {
  const stats = db.getCalculatedStats();
  res.json(stats);
});

// 9. Direct Seed / Edit Subject Stats
app.post('/api/stats/seed', (req, res) => {
  const { subjectCode, present, total } = req.body;
  if (!subjectCode || present === undefined || total === undefined) {
    return res.status(400).json({ error: 'Missing subjectCode, present, or total' });
  }
  try {
    const stats = db.seedSubjectStats(subjectCode, present, total);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 10. Get Attendance History Timeline
app.get('/api/history', (req, res) => {
  const history = db.getHistory();
  res.json(history);
});

// 11. Get Calendar Month Summary
app.get('/api/calendar/:year/:month', (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }
  const summary = db.getMonthSummary(year, month);
  res.json(summary);
});

// Start Server
app.listen(PORT, HOST, () => {
  const network = getNetworkInterfaces();
  console.log('\n=============================================================');
  console.log('🚀 GGSIPU Smart Attendance Tracker Server is RUNNING!');
  console.log(`📍 Local Desktop Access:  http://localhost:${PORT}`);
  
  if (network.tailscale.length > 0) {
    console.log('🌐 Tailscale Phone Access:');
    network.tailscale.forEach((net) => {
      console.log(`   👉 ${net.url} (${net.name})`);
    });
  } else {
    console.log('ℹ️  Tailscale interface not detected yet or inactive.');
    if (network.lan.length > 0) {
      console.log('📡 Local Wi-Fi / LAN Phone Access:');
      network.lan.forEach((net) => {
        console.log(`   👉 ${net.url} (${net.name})`);
      });
    }
  }
  console.log('=============================================================\n');

  // Start the daily 5:00 PM auto-pusher
  scheduleDaily5pmPush();
});
