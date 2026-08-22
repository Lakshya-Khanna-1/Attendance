# 📊 GTBIT (GGSIPU) Smart Attendance Tracker

A full-featured, mobile-friendly attendance tracker and recovery planner customized for **Guru Tegh Bahadur Institute of Technology (GTBIT)**, 2nd Year IT-1 (Group A), hosted over **Tailscale**.

---

## 🚀 Key Features

* **🗓️ Official GTBIT Timetable (Group A)**:
  * Complete Monday–Friday timetable pre-configured for Theory & Labs (`CM_Th`, `DLCD_Th`, `DM_Th`, `DS_Th`, `OOPs_Th`, and Lab sessions).
  * Each 2-hour lab block counts as **1 attendance unit**.
* **3 Attendance Options per Class**:
  * **✅ Present**: Attended $+1$, Total $+1$.
  * **❌ Absent**: Attended $+0$, Total $+1$.
  * **⛔ Mass Bunk / Cancelled**: Attended $+0$, Total $+0$ (logged without penalizing percentage).
* **🗓️ Interactive Monthly Calendar**:
  * Tap any date to immediately view, log, or edit past attendance.
  * Color-coded status dots for each day (Present, Absent, Mass Bunk, Scheduled).
* **🎯 Recovery & Bunk Calculator**:
  * **Critical Zone (<60%)**: Calculates consecutive classes required to hit 60% and 70%, with next-week timetable schedules.
  * **Safe Zone (≥75%)**: Calculates remaining safe bunk buffer.
* **🔮 "What-If" Simulator**:
  * Simulate attending or skipping future classes to preview projected percentages before bunking.
* **🌐 Tailscale Multi-Device Access**:
  * Accessible from your phone anywhere on your Tailnet.
  * Instant QR code generator for easy mobile connection.
* **📁 Automated Daily Sync (`Pvt.Logs/`)**:
  * Automatically generates daily Markdown attendance summaries in `Pvt.Logs/` and pushes them to GitHub every evening.

---

## 💻 Local Setup & Running

```bash
# Install dependencies
npm install

# Start the server (Port 8017)
npm start
```

* **Local Browser**: [http://localhost:8017](http://localhost:8017)
* **Phone (via Tailscale)**: `http://100.72.67.61:8017`

---

## 🔒 Data Storage
All attendance records are persisted locally in `data/attendance.json` with automatic backup in `data/attendance.backup.json`.
Daily summaries are archived in `Pvt.Logs/Summary_YYYY-MM-DD.md`.
