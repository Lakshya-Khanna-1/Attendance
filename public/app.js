/**
 * GTBIT GGSIPU Attendance Tracker - Frontend Client
 */

// Application State
const state = {
  currentDateStr: getTodayDateString(),
  selectedDateStr: getTodayDateString(),
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1, // 1-12
  activeTab: 'tab-today',
  group: 'A',
  stats: null,
  dayData: null,
  calendarData: null,
  networkInfo: null,
  subjectsMeta: {}
};

// Date Helpers
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

function getRelativeDayLabel(dateStr) {
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';

  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const diffTime = d.getTime() - t.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Toast Notifications
function showToast(message, duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// API Calls
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    state.group = data.config.group || 'A';
    state.subjectsMeta = data.subjects || {};
    document.getElementById('activeGroupBadge').textContent = state.group;
    updateGroupToggleUI();
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

async function fetchDaySchedule(dateStr) {
  try {
    const res = await fetch(`/api/day/${dateStr}`);
    const data = await res.json();
    state.dayData = data;
    renderSchedule();
  } catch (err) {
    console.error('Failed to load day schedule:', err);
    showToast('Failed to load schedule');
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    state.stats = data;
    renderOverallBanner();
    renderSubjectsGrid();
    populateSimulatorSubjects();
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function fetchCalendar(year, month) {
  try {
    const res = await fetch(`/api/calendar/${year}/${month}`);
    const data = await res.json();
    state.calendarData = data;
    renderCalendar();
  } catch (err) {
    console.error('Failed to load calendar:', err);
  }
}

async function fetchNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    state.networkInfo = await res.json();
  } catch (err) {
    console.error('Failed to load network info:', err);
  }
}

// UI Renderers

// 1. Overall Header Banner
function renderOverallBanner() {
  if (!state.stats) return;
  const overall = state.stats.overall;
  const pct = overall.percentage;

  document.getElementById('overallPercentage').textContent = `${pct}%`;
  document.getElementById('overallAttended').textContent = overall.totalPresent;
  document.getElementById('overallHeld').textContent = overall.totalHeld;

  // SVG Progress Ring (circumference = 2 * PI * 32 ~= 201)
  const circle = document.getElementById('overallCircle');
  const circumference = 201;
  const offset = circumference - (pct / 100) * circumference;
  circle.style.strokeDashoffset = Math.max(0, offset);

  // Status Pill
  const pill = document.getElementById('overallStatusPill');
  pill.className = `overall-status-pill ${overall.statusCategory}`;
  if (pct < 60) {
    pill.textContent = '🔴 Critical Zone (<60%)';
    circle.style.stroke = 'var(--color-absent)';
  } else if (pct < 75) {
    pill.textContent = '🟡 Warning Zone (60-75%)';
    circle.style.stroke = 'var(--color-warning)';
  } else {
    pill.textContent = '🟢 Safe Zone (≥75%)';
    circle.style.stroke = 'var(--color-present)';
  }

  // Quick Alerts
  const alertsContainer = document.getElementById('overallQuickAlerts');
  alertsContainer.innerHTML = '';

  if (overall.criticalSubjectsCount > 0) {
    const item = document.createElement('div');
    item.className = 'alert-banner-item critical';
    item.innerHTML = `<span>⚠️</span> <span><strong>${overall.criticalSubjectsCount}</strong> subject${overall.criticalSubjectsCount > 1 ? 's are' : ' is'} below 60%! Immediate attendance required.</span>`;
    alertsContainer.appendChild(item);
  } else if (overall.safeBunks75 > 0) {
    const item = document.createElement('div');
    item.className = 'alert-banner-item safe';
    item.innerHTML = `<span>🌴</span> <span>You have <strong>${overall.safeBunks75}</strong> safe bunks available overall for 75% criteria.</span>`;
    alertsContainer.appendChild(item);
  }
}

// 2. Schedule Section
function renderSchedule() {
  const dateStr = state.selectedDateStr;
  const dayNameLabel = getRelativeDayLabel(dateStr);
  const formattedDate = formatDateDisplay(dateStr);

  document.getElementById('displayDayName').textContent = dayNameLabel;
  document.getElementById('displayFormattedDate').textContent = formattedDate;
  document.getElementById('datePickerInput').value = dateStr;

  const container = document.getElementById('slotsContainer');
  const countBadge = document.getElementById('dayClassCount');
  container.innerHTML = '';

  if (!state.dayData || !state.dayData.slots || state.dayData.slots.length === 0) {
    countBadge.textContent = '0 classes';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏖️</div>
        <h3 class="empty-title">No Regular Classes Scheduled</h3>
        <p class="empty-desc">Wednesday / Weekend is off, or no classes are scheduled for this date.</p>
      </div>
    `;
    return;
  }

  const slots = state.dayData.slots;
  countBadge.textContent = `${slots.length} class${slots.length > 1 ? 'es' : ''}`;

  slots.forEach((slot) => {
    const meta = slot.subjectMeta || {};
    const card = document.createElement('div');
    card.className = `slot-card status-${slot.status}`;
    card.style.setProperty('--slot-color', meta.color || 'var(--color-primary)');

    card.innerHTML = `
      <div class="slot-header">
        <div class="slot-subject-info">
          <span class="slot-code-badge">${slot.subject}</span>
          <span class="slot-type-badge ${slot.type}">${slot.type}</span>
          ${slot.units > 1 ? `<span class="slot-type-badge">${slot.units} units</span>` : ''}
        </div>
        <span class="slot-time">${slot.time}</span>
      </div>
      
      <div class="slot-sub-info">
        <span>👨‍🏫 ${slot.teacher}</span>
        <span>📍 ${slot.room}</span>
      </div>

      <div class="slot-actions">
        <button class="status-btn ${slot.status === 'present' ? 'active-present' : ''}" data-status="present" data-slot="${slot.id}" data-subject="${slot.subject}">
          <span>✅</span> Present
        </button>
        <button class="status-btn ${slot.status === 'absent' ? 'active-absent' : ''}" data-status="absent" data-slot="${slot.id}" data-subject="${slot.subject}">
          <span>❌</span> Absent
        </button>
        <button class="status-btn ${slot.status === 'cancelled' ? 'active-cancelled' : ''}" data-status="cancelled" data-slot="${slot.id}" data-subject="${slot.subject}">
          <span>⛔</span> Cancelled
        </button>
      </div>
    `;

    // Add click listeners to buttons
    const buttons = card.querySelectorAll('.status-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetStatus = btn.getAttribute('data-status');
        const slotId = btn.getAttribute('data-slot');
        const subject = btn.getAttribute('data-subject');
        
        // If clicking already active status, toggle to unmarked
        const newStatus = slot.status === targetStatus ? 'unmarked' : targetStatus;
        await markAttendance(dateStr, slotId, newStatus, subject);
      });
    });

    container.appendChild(card);
  });
}

// 3. Mark Attendance Action
async function markAttendance(dateStr, slotId, status, subject) {
  try {
    const res = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, slotId, status, subject })
    });
    const data = await res.json();
    state.dayData = data.day;
    state.stats = data.stats;
    renderSchedule();
    renderOverallBanner();
    renderSubjectsGrid();
    if (state.activeTab === 'tab-calendar') {
      fetchCalendar(state.calendarYear, state.calendarMonth);
    }
    showToast(status === 'unmarked' ? 'Mark cleared' : `Marked as ${status}`);
  } catch (err) {
    console.error('Error marking attendance:', err);
    showToast('Failed to save attendance');
  }
}

// 4. Interactive Calendar Renderer
function renderCalendar() {
  if (!state.calendarData) return;
  const { year, month, days } = state.calendarData;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  document.getElementById('calMonthTitle').textContent = `${monthNames[month - 1]} ${year}`;

  const container = document.getElementById('calendarDaysGrid');
  container.innerHTML = '';

  // Get day of week of the 1st of month (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(year, month - 1, 1).getDay();

  // Add empty pads for preceding days
  for (let i = 0; i < firstDayIndex; i++) {
    const pad = document.createElement('div');
    pad.className = 'cal-day-cell empty-pad';
    container.appendChild(pad);
  }

  const todayStr = getTodayDateString();

  days.forEach((d) => {
    const cell = document.createElement('button');
    cell.className = 'cal-day-cell';
    if (d.date === todayStr) cell.classList.add('today');
    if (d.date === state.selectedDateStr) cell.classList.add('selected');
    if (d.totalSlots === 0) cell.classList.add('off-day');

    let badgeHtml = '';
    if (d.totalSlots > 0) {
      if (d.isRecorded) {
        if (d.cancelledCount === d.totalSlots) {
          badgeHtml = '<span class="cal-status-badge holiday">Bunk</span>';
        } else if (d.presentCount === d.totalSlots) {
          badgeHtml = `<span class="cal-status-badge perfect">${d.presentCount}P</span>`;
        } else if (d.absentCount > 0) {
          badgeHtml = `<span class="cal-status-badge critical">${d.presentCount}/${d.totalSlots}</span>`;
        } else {
          badgeHtml = `<span class="cal-status-badge scheduled">${d.presentCount}P</span>`;
        }
      } else {
        badgeHtml = `<span class="cal-status-badge scheduled">${d.totalSlots}c</span>`;
      }
    }

    cell.innerHTML = `
      <span class="cal-date-number">${d.dayNumber}</span>
      ${badgeHtml}
    `;

    // Click handler: Navigate to this date in the Timetable tab
    cell.addEventListener('click', () => {
      state.selectedDateStr = d.date;
      switchTab('tab-today');
      fetchDaySchedule(d.date);
    });

    container.appendChild(cell);
  });
}

// 5. Subjects & Recommendations Tab
function renderSubjectsGrid() {
  if (!state.stats || !state.stats.subjects) return;
  const container = document.getElementById('subjectsGrid');
  const overviewContainer = document.getElementById('recommendationsOverview');
  container.innerHTML = '';
  overviewContainer.innerHTML = '';

  const subjects = state.stats.subjects;
  const criticalList = subjects.filter((s) => s.statusCategory === 'red');

  if (criticalList.length > 0) {
    const recCard = document.createElement('div');
    recCard.className = 'rec-card critical';
    recCard.innerHTML = `
      <span style="font-size: 1.2rem;">⚠️</span>
      <div>
        <strong>Urgent Attendance Alert:</strong> You are below 60% in 
        ${criticalList.map((s) => `<strong>${s.code}</strong> (${s.percentage}%)`).join(', ')}.
        Prioritize these classes next week to avoid detainment / exam penalties!
      </div>
    `;
    overviewContainer.appendChild(recCard);
  }

  subjects.forEach((subj) => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.setProperty('--card-color', subj.color || 'var(--color-primary)');

    card.innerHTML = `
      <div class="subject-top">
        <div class="subject-main-info">
          <div class="subject-title-row">
            <span class="subject-code">${subj.code}</span>
            <span class="slot-type-badge ${subj.type}">${subj.type}</span>
          </div>
          <span class="subject-full-name">${subj.name}</span>
        </div>
        <div class="subject-stat-badge">
          <div class="subject-pct ${subj.statusCategory}">${subj.percentage}%</div>
          <div class="subject-counts">${subj.totalPresent} / ${subj.totalHeld} attended</div>
        </div>
      </div>

      <div class="progress-bar-bg">
        <div class="progress-bar-fill ${subj.statusCategory}" style="width: ${Math.min(100, subj.percentage)}%;"></div>
      </div>

      <div class="subject-advice-box">
        <span>💡</span>
        <span>${subj.advice}</span>
      </div>

      <div class="subject-card-footer">
        <span class="weekly-freq-badge">📅 ${subj.weeklyFrequency} class${subj.weeklyFrequency > 1 ? 'es' : ''} / week</span>
        <button class="btn-edit-seed" data-subject="${subj.code}" data-present="${subj.basePresent}" data-total="${subj.baseTotal}">
          ✏️ Edit Baseline
        </button>
      </div>
    `;

    // Edit baseline button
    const editBtn = card.querySelector('.btn-edit-seed');
    editBtn.addEventListener('click', () => {
      openEditModal(subj.code, subj.totalPresent, subj.totalHeld);
    });

    container.appendChild(card);
  });
}

// 6. Simulator
function populateSimulatorSubjects() {
  const simSelect = document.getElementById('simSubjectSelect');
  const seedSelect = document.getElementById('seedSubjectSelect');
  
  if (!state.stats || !state.stats.subjects) return;

  const currentSimVal = simSelect.value;
  simSelect.innerHTML = '';
  seedSelect.innerHTML = '';

  state.stats.subjects.forEach((subj) => {
    const opt1 = document.createElement('option');
    opt1.value = subj.code;
    opt1.textContent = `${subj.code} - ${subj.name} (${subj.percentage}%)`;
    simSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = subj.code;
    opt2.textContent = `${subj.code} - ${subj.name}`;
    seedSelect.appendChild(opt2);
  });

  if (currentSimVal) {
    simSelect.value = currentSimVal;
  }
  calculateSimulation();
}

function calculateSimulation() {
  const subjectCode = document.getElementById('simSubjectSelect').value;
  const attendCount = parseInt(document.getElementById('simAttendCount').value, 10) || 0;
  const bunkCount = parseInt(document.getElementById('simBunkCount').value, 10) || 0;

  if (!state.stats || !subjectCode) return;
  const subj = state.stats.subjects.find((s) => s.code === subjectCode);
  if (!subj) return;

  const currentP = subj.totalPresent;
  const currentT = subj.totalHeld;

  const newP = currentP + attendCount;
  const newT = currentT + attendCount + bunkCount;
  const newPct = newT === 0 ? 100 : Math.round((newP / newT) * 1000) / 10;

  const pctElem = document.getElementById('simProjectedPct');
  pctElem.textContent = `${newPct}%`;

  if (newPct < 60) pctElem.style.color = 'var(--color-absent)';
  else if (newPct < 75) pctElem.style.color = 'var(--color-warning)';
  else pctElem.style.color = 'var(--color-present)';

  const diff = Math.round((newPct - subj.percentage) * 10) / 10;
  const diffElem = document.getElementById('simResultDiff');
  if (diff > 0) {
    diffElem.textContent = `▲ +${diff}% improvement (from ${subj.percentage}%)`;
    diffElem.style.color = 'var(--color-present)';
  } else if (diff < 0) {
    diffElem.textContent = `▼ ${diff}% drop (from ${subj.percentage}%)`;
    diffElem.style.color = 'var(--color-absent)';
  } else {
    diffElem.textContent = `No change in percentage (${subj.percentage}%)`;
    diffElem.style.color = 'var(--text-muted)';
  }
}

// 7. Modals & QR Code
function openQrModal() {
  const modal = document.getElementById('qrModal');
  modal.removeAttribute('hidden');

  const linksContainer = document.getElementById('networkLinksContainer');
  linksContainer.innerHTML = '';

  const tailscaleTarget = 'http://100.72.67.61:8017';

  // Render QR
  const canvas = document.getElementById('qrCanvas');
  if (window.QRCode) {
    QRCode.toCanvas(canvas, tailscaleTarget, { width: 180, margin: 2 }, function (error) {
      if (error) console.error(error);
    });
  }

  // Render clickable links
  const links = [
    { name: 'Tailscale (Recommended on Phone)', url: tailscaleTarget },
    { name: 'Tailscale MagicDNS', url: 'http://desktop-jodckvv:8017' },
    { name: 'Local Wi-Fi / LAN', url: 'http://172.16.50.6:8017' },
    { name: 'Localhost (PC)', url: 'http://localhost:8017' }
  ];

  links.forEach((item) => {
    const btn = document.createElement('a');
    btn.className = 'net-link-btn';
    btn.href = item.url;
    btn.target = '_blank';
    btn.innerHTML = `
      <span>🌐 ${item.name}</span>
      <span style="font-size:0.75rem; color:var(--color-primary)">${item.url}</span>
    `;
    linksContainer.appendChild(btn);
  });
}

function openEditModal(subjectCode, present, total) {
  document.getElementById('editModalSubjectCode').value = subjectCode;
  document.getElementById('editModalTitle').textContent = `Edit Baseline: ${subjectCode}`;
  document.getElementById('editModalPresent').value = present;
  document.getElementById('editModalTotal').value = total;
  document.getElementById('editSubjectModal').removeAttribute('hidden');
}

function updateGroupToggleUI() {
  document.getElementById('groupABtn').classList.toggle('active', state.group === 'A');
  document.getElementById('groupBBtn').classList.toggle('active', state.group === 'B');
  document.getElementById('activeGroupBadge').textContent = state.group;
}

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === tabId);
  });

  if (tabId === 'tab-calendar') {
    fetchCalendar(state.calendarYear, state.calendarMonth);
  }
}

// Event Listeners Setup
function initEventListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Date Navigation
  document.getElementById('prevDayBtn').addEventListener('click', () => {
    state.selectedDateStr = offsetDate(state.selectedDateStr, -1);
    fetchDaySchedule(state.selectedDateStr);
  });

  document.getElementById('nextDayBtn').addEventListener('click', () => {
    state.selectedDateStr = offsetDate(state.selectedDateStr, 1);
    fetchDaySchedule(state.selectedDateStr);
  });

  document.getElementById('todayQuickBtn').addEventListener('click', () => {
    state.selectedDateStr = getTodayDateString();
    fetchDaySchedule(state.selectedDateStr);
  });

  // Date Picker Click
  const datePickerInput = document.getElementById('datePickerInput');
  datePickerInput.addEventListener('change', (e) => {
    if (e.target.value) {
      state.selectedDateStr = e.target.value;
      fetchDaySchedule(state.selectedDateStr);
    }
  });

  // Calendar Month Navigation
  document.getElementById('calPrevMonthBtn').addEventListener('click', () => {
    state.calendarMonth -= 1;
    if (state.calendarMonth < 1) {
      state.calendarMonth = 12;
      state.calendarYear -= 1;
    }
    fetchCalendar(state.calendarYear, state.calendarMonth);
  });

  document.getElementById('calNextMonthBtn').addEventListener('click', () => {
    state.calendarMonth += 1;
    if (state.calendarMonth > 12) {
      state.calendarMonth = 1;
      state.calendarYear += 1;
    }
    fetchCalendar(state.calendarYear, state.calendarMonth);
  });

  document.getElementById('calTodayBtn').addEventListener('click', () => {
    state.calendarYear = new Date().getFullYear();
    state.calendarMonth = new Date().getMonth() + 1;
    fetchCalendar(state.calendarYear, state.calendarMonth);
  });

  // Bulk Actions
  document.getElementById('markAllPresentBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/attendance/mark-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: state.selectedDateStr, status: 'present' })
      });
      const data = await res.json();
      state.dayData = data.day;
      state.stats = data.stats;
      renderSchedule();
      renderOverallBanner();
      renderSubjectsGrid();
      showToast('All classes marked Present for this day');
    } catch (err) {
      console.error(err);
      showToast('Failed to mark classes');
    }
  });

  document.getElementById('markAllCancelledBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/attendance/mark-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: state.selectedDateStr, status: 'cancelled' })
      });
      const data = await res.json();
      state.dayData = data.day;
      state.stats = data.stats;
      renderSchedule();
      renderOverallBanner();
      renderSubjectsGrid();
      showToast('All classes marked Cancelled / Holiday');
    } catch (err) {
      console.error(err);
      showToast('Failed to mark classes');
    }
  });

  // QR Modal
  document.getElementById('qrModalBtn').addEventListener('click', openQrModal);
  document.getElementById('closeQrModalBtn').addEventListener('click', () => {
    document.getElementById('qrModal').setAttribute('hidden', '');
  });

  // Edit Modal
  document.getElementById('closeEditModalBtn').addEventListener('click', () => {
    document.getElementById('editSubjectModal').setAttribute('hidden', '');
  });
  document.getElementById('cancelEditModalBtn').addEventListener('click', () => {
    document.getElementById('editSubjectModal').setAttribute('hidden', '');
  });

  document.getElementById('saveEditModalBtn').addEventListener('click', async () => {
    const code = document.getElementById('editModalSubjectCode').value;
    const present = parseInt(document.getElementById('editModalPresent').value, 10) || 0;
    const total = parseInt(document.getElementById('editModalTotal').value, 10) || 0;

    if (present > total) {
      showToast('Attended cannot exceed Total held classes');
      return;
    }

    try {
      const res = await fetch('/api/stats/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: code, present, total })
      });
      const data = await res.json();
      state.stats = data.stats;
      renderOverallBanner();
      renderSubjectsGrid();
      document.getElementById('editSubjectModal').setAttribute('hidden', '');
      showToast(`Updated baseline for ${code}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update baseline');
    }
  });

  // Group Toggle
  document.getElementById('groupABtn').addEventListener('click', async () => {
    state.group = 'A';
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: 'A' })
    });
    updateGroupToggleUI();
    fetchDaySchedule(state.selectedDateStr);
    fetchStats();
    showToast('Switched to Group A');
  });

  document.getElementById('groupBBtn').addEventListener('click', async () => {
    state.group = 'B';
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: 'B' })
    });
    updateGroupToggleUI();
    fetchDaySchedule(state.selectedDateStr);
    fetchStats();
    showToast('Switched to Group B');
  });

  // Simulator Counters
  document.getElementById('simSubjectSelect').addEventListener('change', calculateSimulation);
  
  document.getElementById('simAttendPlus').addEventListener('click', () => {
    const input = document.getElementById('simAttendCount');
    input.value = (parseInt(input.value, 10) || 0) + 1;
    calculateSimulation();
  });
  document.getElementById('simAttendMinus').addEventListener('click', () => {
    const input = document.getElementById('simAttendCount');
    input.value = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
    calculateSimulation();
  });
  document.getElementById('simAttendCount').addEventListener('input', calculateSimulation);

  document.getElementById('simBunkPlus').addEventListener('click', () => {
    const input = document.getElementById('simBunkCount');
    input.value = (parseInt(input.value, 10) || 0) + 1;
    calculateSimulation();
  });
  document.getElementById('simBunkMinus').addEventListener('click', () => {
    const input = document.getElementById('simBunkCount');
    input.value = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
    calculateSimulation();
  });
  document.getElementById('simBunkCount').addEventListener('input', calculateSimulation);

  // Direct Seed Settings
  document.getElementById('saveSeedBtn').addEventListener('click', async () => {
    const code = document.getElementById('seedSubjectSelect').value;
    const present = parseInt(document.getElementById('seedPresentInput').value, 10) || 0;
    const total = parseInt(document.getElementById('seedTotalInput').value, 10) || 0;

    if (!code) {
      showToast('Select a subject');
      return;
    }
    if (present > total) {
      showToast('Attended cannot exceed Total held classes');
      return;
    }

    try {
      const res = await fetch('/api/stats/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode: code, present, total })
      });
      const data = await res.json();
      state.stats = data.stats;
      renderOverallBanner();
      renderSubjectsGrid();
      showToast(`Seeded stats for ${code}`);
      document.getElementById('seedPresentInput').value = '';
      document.getElementById('seedTotalInput').value = '';
    } catch (err) {
      console.error(err);
      showToast('Failed to seed stats');
    }
  });
}

// Initial Initialization
async function initApp() {
  initEventListeners();
  await fetchConfig();
  await fetchStats();
  await fetchDaySchedule(state.selectedDateStr);
  await fetchCalendar(state.calendarYear, state.calendarMonth);
  await fetchNetworkInfo();
}

window.addEventListener('DOMContentLoaded', initApp);
