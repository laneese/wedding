/* ─────────────────────────────────────────
   Ever After Planner — script.js v4
   localStorage, events, party, gifts, export/import,
   preset palettes, interactive seating
───────────────────────────────────────── */

const STORAGE_KEY = 'everAfterPlannerData_v1';

// ── Default state ──
function defaultState() {
  return {
    wedding: { partner1:'', partner2:'', weddingDate:'', weddingLocation:'', totalBudget:'', expectedGuests:'' },
    expenses: [],
    guests: [],
    tables: [],
    venues: [],
    colors: [
      { hex: '#8fac82', name: 'Sage Green' },
      { hex: '#f0b89a', name: 'Peach Blush' },
      { hex: '#faf3e8', name: 'Warm Cream' },
      { hex: '#d4e8d0', name: 'Soft Mint' }
    ],
    selectedStyles: [],
    selectedFlowers: [],
    visionNote: '',
    checklistDone: {},
    packItems: [],
    honeymoon: null,
    events: {
      shower: { date:'', venue:'', host:'', notes:'', attendees:[], gifts:[] },
      bachelorette: { date:'', venue:'', host:'', notes:'', attendees:[] },
      bachelor: { date:'', venue:'', host:'', notes:'', attendees:[] },
      rehearsal: { date:'', time:'', venue:'', dress:'', notes:'', attendees:[] }
    },
    party: {
      'Maid of Honor': [],
      'Best Man': [],
      'Bridesmaids': [],
      'Groomsmen': [],
      'Flower Girl(s)': [],
      'Ring Bearer(s)': [],
      'Officiant': [],
      'Ushers': [],
      'Parents of the Couple': [],
      'Readers / Performers': []
    },
    weddingGifts: [],
    starRating: 0,
    weddingDay: {},
    appointments: [],
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    selectedCalendarDate: null
  };
}

let state = defaultState();

// ── Load from localStorage ──
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(defaultState(), parsed);
      // Ensure nested objects fully populated
      state.events = Object.assign(defaultState().events, state.events || {});
      state.party = Object.assign(defaultState().party, state.party || {});
      state.wedding = Object.assign(defaultState().wedding, state.wedding || {});
    }
  } catch (e) { console.warn('Failed to load state:', e); }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.warn('Failed to save state:', e); }
}

// ── Toast notification ──
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => t.classList.remove('show'), 2000);
}

// ── Checklist groups ──
const checklistGroups = [
  { title: 'Foundation', items: [
    { id: 1, text: 'Set your wedding date' },
    { id: 2, text: 'Create your guest list' },
    { id: 3, text: 'Set your budget' },
    { id: 4, text: 'Book your venue' },
    { id: 5, text: 'Choose your wedding party' },
  ]},
  { title: 'Vendors & Services', items: [
    { id: 6, text: 'Book photographer & videographer' },
    { id: 7, text: 'Hire a caterer' },
    { id: 8, text: 'Book hair & makeup' },
    { id: 9, text: 'Book florist' },
    { id: 10, text: 'Book music / DJ / band' },
    { id: 11, text: 'Order wedding cake' },
  ]},
  { title: 'Attire & Details', items: [
    { id: 12, text: 'Find your wedding dress / attire' },
    { id: 13, text: 'Buy rings' },
    { id: 14, text: 'Send invitations' },
    { id: 15, text: 'Arrange transport' },
  ]},
  { title: 'Final Touches', items: [
    { id: 16, text: 'Plan honeymoon' },
    { id: 17, text: 'Plan rehearsal dinner' },
    { id: 18, text: 'Finalize seating chart' },
  ]}
];

const allChecklistItems = checklistGroups.flatMap(g => g.items.map(i => ({ ...i, group: g.title })));

// ── Preset palettes ──
const presetPalettes = [
  { name: 'Romantic Garden', colors: [
    { hex: '#8fac82', name: 'Sage' }, { hex: '#f0b89a', name: 'Blush' },
    { hex: '#faf3e8', name: 'Cream' }, { hex: '#c9a878', name: 'Gold' }
  ]},
  { name: 'Coastal Elegance', colors: [
    { hex: '#2c3e50', name: 'Navy' }, { hex: '#ffffff', name: 'White' },
    { hex: '#d4b896', name: 'Sandy' }, { hex: '#a8d4c4', name: 'Seafoam' }
  ]},
  { name: 'Bohemian Sunset', colors: [
    { hex: '#c26b4d', name: 'Terracotta' }, { hex: '#d4a896', name: 'Dusty Pink' },
    { hex: '#f4e4c1', name: 'Cream' }, { hex: '#8b5a3c', name: 'Rust' }
  ]},
  { name: 'Modern Minimal', colors: [
    { hex: '#2c2c2c', name: 'Black' }, { hex: '#ffffff', name: 'White' },
    { hex: '#b8b8b8', name: 'Grey' }, { hex: '#e8c4b0', name: 'Blush' }
  ]},
  { name: 'Classic Black Tie', colors: [
    { hex: '#1a2842', name: 'Navy' }, { hex: '#c9a878', name: 'Gold' },
    { hex: '#faf3e8', name: 'Ivory' }, { hex: '#8b2635', name: 'Burgundy' }
  ]},
  { name: 'Dusty Winter', colors: [
    { hex: '#6b7a8f', name: 'Dusty Blue' }, { hex: '#d4c4a8', name: 'Champagne' },
    { hex: '#ffffff', name: 'White' }, { hex: '#a8a8a8', name: 'Silver' }
  ]}
];

const styleOptions = ['Romantic','Rustic','Bohemian','Modern & Minimal','Classic & Elegant','Garden Party','Vintage','Beach','Black Tie','Whimsical','Tropical','Cottagecore'];

const flowerOptions = [
  { name:'Roses', emoji:'🌹' }, { name:'Peonies', emoji:'🌸' },
  { name:'Wildflowers', emoji:'🌼' }, { name:'Tulips', emoji:'🌷' },
  { name:'Eucalyptus', emoji:'🌿' }, { name:'Lavender', emoji:'💜' },
  { name:'Hydrangeas', emoji:'🩵' }, { name:'Sunflowers', emoji:'🌻' },
  { name:'Orchids', emoji:'🌺' }, { name:'Dahlias', emoji:'🏵️' },
  { name:"Baby's Breath", emoji:'🤍' }, { name:'Lilies', emoji:'⚘' },
];

const packPresets = ['Passport','Tickets','Travel Insurance','Sunscreen','Swimwear','Camera','Adaptor','Toiletries','Medications','Cash','Wedding Certificate','Honeymoon outfits','Chargers'];

const chartColors = ['#8fac82','#f0b89a','#d4e8d0','#f7d8c5','#c5d4b0','#c9a878','#a3b898','#fcefe6','#7a9970','#d4b8a8','#6a8f5f','#c09884'];

const RING_C = 2 * Math.PI * 85;

const partyRoleEmojis = {
  'Maid of Honor': '👰',
  'Best Man': '🤵',
  'Bridesmaids': '💐',
  'Groomsmen': '🎩',
  'Flower Girl(s)': '🌸',
  'Ring Bearer(s)': '💍',
  'Officiant': '📖',
  'Ushers': '🎟️',
  'Parents of the Couple': '👨‍👩‍👧',
  'Readers / Performers': '🎤'
};

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTabs();
  initSubtabs();
  initOverview();
  restoreInputs();
  renderChecklist();
  renderExpenses();
  renderGuests();
  renderSeating();
  renderVenues();
  initMoodBoard();
  renderPresetPalettes();
  renderEvents();
  renderParty();
  renderWeddingGifts();
  renderPackList();
  renderPackPresets();
  restoreHoneymoon();
  restoreWeddingDay();
  renderAppointments();
  renderCalendar();
  initStarRating();
  updateOverviewStats();
  renderRsvpRing();
});

// ── Tabs ──
function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

function initSubtabs() {
  document.querySelectorAll('.subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.subtab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('sub-' + btn.dataset.subtab).classList.add('active');
    });
  });
}

// ── Overview ──
function initOverview() {
  ['partner1','partner2','weddingDate','weddingLocation','totalBudget','expectedGuests'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      state.wedding[id] = el.value;
      saveState();
      updateOverviewStats();
    });
  });
}

function restoreInputs() {
  // Wedding details
  ['partner1','partner2','weddingDate','weddingLocation','totalBudget','expectedGuests'].forEach(id => {
    const el = document.getElementById(id);
    if (el && state.wedding[id]) el.value = state.wedding[id];
  });
  // Event details
  restoreEventInputs();
  // Vision note
  const vn = document.getElementById('visionNote');
  if (vn) { vn.value = state.visionNote || ''; extractKeywords(); }
}

function updateOverviewStats() {
  const dateVal = state.wedding.weddingDate;
  let daysLeft = 0;
  if (dateVal) {
    const diff = Math.ceil((new Date(dateVal) - new Date()) / 86400000);
    daysLeft = diff;
    document.getElementById('daysLeft').textContent = diff > 0 ? diff.toLocaleString() : '🎉';
  } else {
    document.getElementById('daysLeft').textContent = '—';
  }
  const cpct = dateVal ? Math.min(Math.max(daysLeft/365, 0), 1) : 0;
  document.getElementById('countdownFill').style.strokeDashoffset = RING_C * (1 - cpct);

  const done = allChecklistItems.filter(i => state.checklistDone[i.id]).length;
  const total = allChecklistItems.length;
  const pct = total ? done / total : 0;
  document.getElementById('tasksPercent').textContent = Math.round(pct * 100) + '%';
  document.getElementById('tasksCount').textContent = `${done} / ${total}`;
  document.getElementById('tasksFill').style.strokeDashoffset = RING_C * (1 - pct);

  const total$ = parseFloat(state.wedding.totalBudget) || 0;
  const spent$ = state.expenses.reduce((s, e) => s + e.amount, 0);
  updateBudgetDisplay(total$, spent$);

  renderRsvpRing();
  drawDonut();
}

// ── Checklist ──
function renderChecklist() {
  const container = document.getElementById('checklistGrouped');
  container.innerHTML = checklistGroups.map(group => {
    const items = group.items;
    const doneCount = items.filter(i => state.checklistDone[i.id]).length;
    return `
      <div class="checklist-group">
        <div class="checklist-group-title">
          ${group.title}
          <span class="count">${doneCount} / ${items.length}</span>
        </div>
        <div class="checklist">
          ${items.map(item => `
            <div class="check-item ${state.checklistDone[item.id] ? 'done' : ''}" onclick="toggleCheck(${item.id})">
              <div class="check-box">${state.checklistDone[item.id] ? '✓' : ''}</div>
              <span class="check-text">${item.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
  updateOverviewStats();
}

function toggleCheck(id) {
  state.checklistDone[id] = !state.checklistDone[id];
  saveState();
  renderChecklist();
}

// ── RSVP Ring ──
function renderRsvpRing() {
  const confirmed = state.guests.filter(g => g.rsvp === 'Confirmed').length;
  const declined = state.guests.filter(g => g.rsvp === 'Declined').length;
  const pending = state.guests.filter(g => g.rsvp === 'Pending').length;
  const total = state.guests.length;

  document.getElementById('rsvpCount').textContent = confirmed;
  document.getElementById('legConfirmed').textContent = confirmed;
  document.getElementById('legDeclined').textContent = declined;
  document.getElementById('legPending').textContent = pending;

  const svg = document.getElementById('rsvpSvg');
  svg.querySelectorAll('.rsvp-segment').forEach(el => el.remove());
  if (total === 0) return;

  const segments = [
    { val: confirmed, color: '#8fac82' },
    { val: declined, color: '#f0b89a' },
    { val: pending, color: '#d4b896' }
  ];
  const ns = 'http://www.w3.org/2000/svg';
  let offset = 0;
  segments.forEach(seg => {
    if (seg.val === 0) return;
    const length = (seg.val / total) * RING_C;
    const gap = RING_C - length;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', '100'); c.setAttribute('cy', '100'); c.setAttribute('r', '85');
    c.setAttribute('class', 'rsvp-segment');
    c.setAttribute('stroke', seg.color);
    c.setAttribute('stroke-dasharray', `${length} ${gap}`);
    c.setAttribute('stroke-dashoffset', -offset);
    svg.appendChild(c);
    offset += length;
  });
}

// ── Donut ──
function drawDonut() {
  const container = document.getElementById('donutContainer');
  if (!container) return;
  const cats = {};
  state.expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const entries = Object.entries(cats);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="donut-empty-msg">
        <span class="emoji">💰</span>
        <div class="msg">Your budget story starts here</div>
        <div class="sub">Add expenses in the Budget tab to see your spending breakdown.</div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="donut-frame"><canvas id="donutChart" width="220" height="220"></canvas></div>
    <div class="donut-legend" id="donutLegend"></div>`;

  const canvas = document.getElementById('donutChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, r = 80, inner = 50;
  let angle = -Math.PI/2;
  entries.forEach(([, val], i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.arc(cx, cy, inner, angle + slice, angle, true);
    ctx.closePath();
    ctx.fillStyle = chartColors[i % chartColors.length];
    ctx.fill();
    angle += slice;
  });
  ctx.fillStyle = '#2c3d33';
  ctx.font = 'bold 15px DM Sans';
  ctx.textAlign = 'center';
  ctx.fillText('$' + total.toLocaleString(), cx, cy + 5);

  document.getElementById('donutLegend').innerHTML = entries.map(([cat, val], i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${chartColors[i % chartColors.length]}"></div>
      <span>${cat}: <strong>$${val.toLocaleString()}</strong></span>
    </div>`).join('');
}

// ── Budget ──
function addExpense() {
  const name = document.getElementById('expName').value.trim();
  const category = document.getElementById('expCategory').value;
  const amount = parseFloat(document.getElementById('expAmount').value);
  if (!name || isNaN(amount) || amount <= 0) { alert('Please enter a name and valid amount.'); return; }
  state.expenses.push({ id: Date.now(), name, category, amount });
  document.getElementById('expName').value = '';
  document.getElementById('expAmount').value = '';
  saveState();
  renderExpenses();
  updateOverviewStats();
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  saveState();
  renderExpenses();
  updateOverviewStats();
}

function renderExpenses() {
  const tbody = document.getElementById('expenseBody');
  if (!tbody) return;
  if (state.expenses.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No expenses yet. Add one above! 💸</td></tr>';
  } else {
    tbody.innerHTML = state.expenses.map(e => `
      <tr>
        <td>${e.name}</td>
        <td><span style="background:${catColor(e.category)}22;color:${catColor(e.category)};padding:3px 10px;border-radius:40px;font-size:12px;">${e.category}</span></td>
        <td><strong>$${e.amount.toLocaleString()}</strong></td>
        <td><button class="btn-danger" onclick="deleteExpense(${e.id})">✕</button></td>
      </tr>`).join('');
  }
  const total = parseFloat(state.wedding.totalBudget) || 0;
  const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
  updateBudgetDisplay(total, spent);
  renderBarChart();
}

function updateBudgetDisplay(total, spent) {
  const bt = document.getElementById('bTotal'); if (bt) bt.textContent = '$' + total.toLocaleString();
  const bs = document.getElementById('bSpent'); if (bs) bs.textContent = '$' + spent.toLocaleString();
  const br = document.getElementById('bRemaining');
  if (br) {
    const rem = total - spent;
    br.textContent = (rem >= 0 ? '$' : '-$') + Math.abs(rem).toLocaleString();
    br.style.color = rem >= 0 ? 'var(--sage-dark)' : '#c0504d';
  }
  const bf = document.getElementById('budgetFill');
  if (bf) {
    const pct = total ? Math.min((spent / total) * 100, 100) : 0;
    bf.style.width = pct + '%';
  }
}

function renderBarChart() {
  const wrap = document.getElementById('barChart');
  if (!wrap) return;
  const cats = {};
  state.expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;
  if (entries.length === 0) {
    wrap.innerHTML = '<p style="color:var(--text-mid);font-style:italic;font-size:14px;text-align:center;padding:20px;">📊 Add expenses to see spending by category.</p>';
    return;
  }
  wrap.innerHTML = entries.map(([cat, val], i) => `
    <div class="bar-row">
      <span class="bar-cat">${cat}</span>
      <div class="bar-outer"><div class="bar-inner" style="width:${(val/max)*100}%;background:${chartColors[i % chartColors.length]}"></div></div>
      <span class="bar-val">$${val.toLocaleString()}</span>
    </div>`).join('');
}

function catColor(cat) {
  const map = { Venue:'#8fac82',Catering:'#f0b89a',Photography:'#d4e8d0',Flowers:'#f7d8c5',Music:'#c5d4b0',Attire:'#c9a878',Cake:'#a3b898',Transport:'#e8c4b0',Honeymoon:'#7a9970',Stationery:'#d4b8a8',Other:'#c09884' };
  return map[cat] || '#96a398';
}

// ── Guests ──
function addGuest() {
  const name = document.getElementById('guestName').value.trim();
  const email = document.getElementById('guestEmail').value.trim();
  const side = document.getElementById('guestSide').value;
  const rsvp = document.getElementById('guestRsvp').value;
  const meal = document.getElementById('guestMeal').value;
  if (!name) { alert('Please enter a guest name.'); return; }
  state.guests.push({ id: Date.now(), name, email, side, rsvp, meal });
  document.getElementById('guestName').value = '';
  document.getElementById('guestEmail').value = '';
  saveState();
  renderGuests();
  updateOverviewStats();
  renderSeating();
}

function deleteGuest(id) {
  state.guests = state.guests.filter(g => g.id !== id);
  // Also remove from seating
  state.tables.forEach(t => { t.assignments = t.assignments.map(a => a === id ? null : a); });
  saveState();
  renderGuests();
  updateOverviewStats();
  renderSeating();
}

function renderGuests() {
  const search = (document.getElementById('guestSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('guestFilter')?.value || 'All';
  const filtered = state.guests.filter(g =>
    (filter === 'All' || g.rsvp === filter) && g.name.toLowerCase().includes(search)
  );
  const tbody = document.getElementById('guestBody');
  if (!tbody) return;
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">${state.guests.length === 0 ? 'No guests yet. Add someone! 💌' : 'No matches found.'}</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(g => `
      <tr>
        <td><strong>${g.name}</strong>${g.email ? `<br><small style="color:var(--text-light)">${g.email}</small>` : ''}</td>
        <td style="color:var(--text-mid);font-size:13px">${g.side}</td>
        <td><span class="rsvp-badge ${g.rsvp}">${g.rsvp}</span></td>
        <td style="font-size:13px;color:var(--text-mid)">${g.meal}</td>
        <td><button class="btn-danger" onclick="deleteGuest(${g.id})">✕</button></td>
      </tr>`).join('');
  }
  document.getElementById('gTotal').textContent = state.guests.length;
  document.getElementById('gConfirmed').textContent = state.guests.filter(g => g.rsvp === 'Confirmed').length;
  document.getElementById('gDeclined').textContent = state.guests.filter(g => g.rsvp === 'Declined').length;
  document.getElementById('gPending').textContent = state.guests.filter(g => g.rsvp === 'Pending').length;
}

// ── Seating (visual + drag & drop) ──
function addTable() {
  const name = document.getElementById('tableName').value.trim() || `Table ${state.tables.length + 1}`;
  const seats = Math.min(Math.max(parseInt(document.getElementById('tableSeats').value) || 8, 2), 16);
  state.tables.push({ id: Date.now(), name, seats, assignments: Array(seats).fill(null) });
  document.getElementById('tableName').value = '';
  saveState();
  renderSeating();
}

function renderSeating() {
  const grid = document.getElementById('seatingGrid');
  const pool = document.getElementById('unassignedChips');
  if (!grid || !pool) return;

  const confirmedGuests = state.guests.filter(g => g.rsvp === 'Confirmed');
  const assignedIds = new Set(state.tables.flatMap(t => t.assignments).filter(Boolean));
  const unassigned = confirmedGuests.filter(g => !assignedIds.has(g.id));

  // Unassigned pool
  pool.innerHTML = unassigned.length
    ? unassigned.map(g => `<div class="guest-chip" draggable="true" data-guest="${g.id}">${g.name}</div>`).join('')
    : '<div class="pool-empty">All confirmed guests are seated, or no confirmed guests yet.</div>';

  // Table cards
  if (state.tables.length === 0) {
    grid.innerHTML = '<p class="empty-msg">🪑 No tables yet. Create a table above to get started!</p>';
  } else {
    grid.innerHTML = state.tables.map(table => {
      const filled = table.assignments.filter(Boolean).length;
      const seats = table.assignments.map((assignedId, i) => {
        const angle = (i / table.seats) * 2 * Math.PI - Math.PI/2;
        const R = 70;
        const x = 90 + R * Math.cos(angle);
        const y = 90 + R * Math.sin(angle);
        const guest = assignedId ? state.guests.find(g => g.id === assignedId) : null;
        const name = guest ? guest.name.split(' ')[0] : (i+1);
        return `<div class="seat-circle ${guest ? 'filled' : ''}" style="left:${x}px;top:${y}px" data-table="${table.id}" data-seat="${i}" onclick="unassignSeat(${table.id}, ${i})" title="${guest ? guest.name + ' — click to remove' : 'Seat ' + (i+1)}">${name}</div>`;
      }).join('');

      return `
        <div class="table-card" data-table="${table.id}">
          <div class="table-card-header">
            <span class="table-card-title">${table.name}</span>
            <span class="seat-capacity">${filled} / ${table.seats}</span>
            <button class="btn-danger" onclick="deleteTable(${table.id})">✕</button>
          </div>
          <div class="table-visual">
            <div class="table-top">${table.name}</div>
            ${seats}
          </div>
        </div>`;
    }).join('');
  }

  attachDragAndDrop();
}

function attachDragAndDrop() {
  document.querySelectorAll('.guest-chip').forEach(chip => {
    chip.addEventListener('dragstart', e => {
      chip.classList.add('dragging');
      e.dataTransfer.setData('text/plain', chip.dataset.guest);
    });
    chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
  });

  document.querySelectorAll('.table-card').forEach(card => {
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const guestId = parseInt(e.dataTransfer.getData('text/plain'));
      const tableId = parseInt(card.dataset.table);
      assignToTable(tableId, guestId);
    });
  });
}

function assignToTable(tableId, guestId) {
  const table = state.tables.find(t => t.id === tableId);
  if (!table) return;
  // Find first empty seat
  const emptyIdx = table.assignments.findIndex(a => !a);
  if (emptyIdx === -1) { toast('This table is full!'); return; }
  table.assignments[emptyIdx] = guestId;
  saveState();
  renderSeating();
}

function unassignSeat(tableId, seatIdx) {
  const table = state.tables.find(t => t.id === tableId);
  if (!table || !table.assignments[seatIdx]) return;
  table.assignments[seatIdx] = null;
  saveState();
  renderSeating();
}

function deleteTable(id) {
  state.tables = state.tables.filter(t => t.id !== id);
  saveState();
  renderSeating();
}

// ── Venue ──
function initStarRating() {
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      state.starRating = parseInt(star.dataset.val);
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('lit', parseInt(s.dataset.val) <= state.starRating);
      });
    });
    star.addEventListener('mouseover', () => {
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('lit', parseInt(s.dataset.val) <= parseInt(star.dataset.val));
      });
    });
    star.addEventListener('mouseout', () => {
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('lit', parseInt(s.dataset.val) <= state.starRating);
      });
    });
  });
}

function addVenue() {
  const name = document.getElementById('venueName').value.trim();
  if (!name) { alert('Please enter a venue name.'); return; }
  state.venues.push({
    id: Date.now(),
    name,
    location: document.getElementById('venueLocation').value.trim(),
    capacity: parseInt(document.getElementById('venueCapacity').value) || 0,
    price: parseFloat(document.getElementById('venuePrice').value) || 0,
    type: document.getElementById('venueType').value,
    catering: document.getElementById('venueCatering').value,
    notes: document.getElementById('venueNotes').value.trim(),
    rating: state.starRating
  });
  ['venueName','venueLocation','venueCapacity','venuePrice','venueNotes'].forEach(id => document.getElementById(id).value = '');
  state.starRating = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('lit'));
  saveState();
  renderVenues();
}

function deleteVenue(id) {
  state.venues = state.venues.filter(v => v.id !== id);
  saveState();
  renderVenues();
}

function renderVenues() {
  const wrap = document.getElementById('venueCards');
  if (!wrap) return;
  if (state.venues.length === 0) {
    wrap.innerHTML = '<p class="empty-msg">🏛️ No venues yet. Add one above to start comparing!</p>';
    return;
  }
  wrap.innerHTML = state.venues.map(v => `
    <div class="venue-card">
      <button class="btn-danger venue-delete" onclick="deleteVenue(${v.id})">✕</button>
      <div class="venue-card-name">${v.name}</div>
      <div class="venue-loc">📍 ${v.location || 'Location TBD'}</div>
      <div class="venue-stars">${'★'.repeat(v.rating)}${'☆'.repeat(5 - v.rating)}</div>
      <div class="venue-meta">
        <span class="venue-chip">👥 Up to ${v.capacity || '?'}</span>
        <span class="venue-chip">💰 $${v.price.toLocaleString()}</span>
        <span class="venue-chip">${v.type === 'Indoor' ? '🏠' : v.type === 'Outdoor' ? '🌿' : '🌤'} ${v.type}</span>
        <span class="venue-chip">🍽 ${v.catering}</span>
      </div>
      ${v.notes ? `<div class="venue-notes">"${v.notes}"</div>` : ''}
    </div>`).join('');
}

// ── Events ──
function saveEvent(eventKey) {
  const e = state.events[eventKey];
  if (eventKey === 'shower' || eventKey === 'bachelorette' || eventKey === 'bachelor') {
    e.date = document.getElementById(eventKey + 'Date').value;
    e.venue = document.getElementById(eventKey + 'Venue').value;
    e.host = document.getElementById(eventKey + 'Host').value;
    e.notes = document.getElementById(eventKey + 'Notes').value;
  } else if (eventKey === 'rehearsal') {
    e.date = document.getElementById('rehearsalDate').value;
    e.time = document.getElementById('rehearsalTime').value;
    e.venue = document.getElementById('rehearsalVenue').value;
    e.dress = document.getElementById('rehearsalDress').value;
    e.notes = document.getElementById('rehearsalNotes').value;
  }
  saveState();
}

function restoreEventInputs() {
  ['shower','bachelorette','bachelor'].forEach(k => {
    const e = state.events[k];
    const d = document.getElementById(k + 'Date'); if (d) d.value = e.date || '';
    const v = document.getElementById(k + 'Venue'); if (v) v.value = e.venue || '';
    const h = document.getElementById(k + 'Host'); if (h) h.value = e.host || '';
    const n = document.getElementById(k + 'Notes'); if (n) n.value = e.notes || '';
  });
  const r = state.events.rehearsal;
  const ids = {rehearsalDate:'date',rehearsalTime:'time',rehearsalVenue:'venue',rehearsalDress:'dress',rehearsalNotes:'notes'};
  Object.entries(ids).forEach(([id, key]) => {
    const el = document.getElementById(id); if (el) el.value = r[key] || '';
  });
}

function addAttendee(eventKey) {
  const input = document.getElementById(eventKey + 'Attendee');
  const name = input.value.trim();
  if (!name) return;
  state.events[eventKey].attendees.push({ id: Date.now(), name });
  input.value = '';
  saveState();
  renderEvents();
}

function removeAttendee(eventKey, id) {
  state.events[eventKey].attendees = state.events[eventKey].attendees.filter(a => a.id !== id);
  saveState();
  renderEvents();
}

function renderEvents() {
  ['shower','bachelorette','bachelor','rehearsal'].forEach(key => {
    const tbody = document.getElementById(key + 'AttendeeBody');
    if (!tbody) return;
    const attendees = state.events[key].attendees;
    if (attendees.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="2">No attendees added yet.</td></tr>';
    } else {
      tbody.innerHTML = attendees.map(a => `
        <tr>
          <td>${a.name}</td>
          <td style="text-align:right"><button class="btn-danger" onclick="removeAttendee('${key}', ${a.id})">✕</button></td>
        </tr>`).join('');
    }
  });
  renderShowerGifts();
}

// ── Gifts (shower + wedding) ──
function addGift(type) {
  const itemId = type === 'shower' ? 'showerGiftItem' : 'weddingGiftItem';
  const fromId = type === 'shower' ? 'showerGiftFrom' : 'weddingGiftFrom';
  const item = document.getElementById(itemId).value.trim();
  const from = document.getElementById(fromId).value.trim();
  if (!item || !from) { alert('Please enter both the gift and who it\'s from.'); return; }
  const gift = { id: Date.now(), item, from, thankSent: false };
  if (type === 'shower') state.events.shower.gifts.push(gift);
  else state.weddingGifts.push(gift);
  document.getElementById(itemId).value = '';
  document.getElementById(fromId).value = '';
  saveState();
  renderShowerGifts();
  renderWeddingGifts();
}

function toggleThank(type, id) {
  const list = type === 'shower' ? state.events.shower.gifts : state.weddingGifts;
  const g = list.find(g => g.id === id);
  if (g) { g.thankSent = !g.thankSent; saveState(); renderShowerGifts(); renderWeddingGifts(); }
}

function deleteGift(type, id) {
  if (type === 'shower') state.events.shower.gifts = state.events.shower.gifts.filter(g => g.id !== id);
  else state.weddingGifts = state.weddingGifts.filter(g => g.id !== id);
  saveState();
  renderShowerGifts();
  renderWeddingGifts();
}

function giftRowHTML(g, type) {
  return `
    <div class="gift-row">
      <div class="gift-info"><strong>${g.item}</strong><span class="from">from ${g.from}</span></div>
      <label class="gift-thank ${g.thankSent ? 'sent' : ''}">
        <input type="checkbox" ${g.thankSent ? 'checked' : ''} onchange="toggleThank('${type}', ${g.id})"/>
        ${g.thankSent ? 'Thank you sent ✓' : 'Send thank you'}
      </label>
      <button class="btn-danger" onclick="deleteGift('${type}', ${g.id})">✕</button>
    </div>`;
}

function renderShowerGifts() {
  const wrap = document.getElementById('showerGiftList');
  if (!wrap) return;
  const list = state.events.shower.gifts;
  wrap.innerHTML = list.length
    ? list.map(g => giftRowHTML(g, 'shower')).join('')
    : '<p class="empty-msg">🎁 No gifts logged yet.</p>';
}

function renderWeddingGifts() {
  const wrap = document.getElementById('weddingGiftList');
  if (!wrap) return;
  const list = state.weddingGifts;
  wrap.innerHTML = list.length
    ? list.map(g => giftRowHTML(g, 'wedding')).join('')
    : '<p class="empty-msg">🎁 No wedding gifts logged yet. Add one above!</p>';

  const tot = document.getElementById('giftTotal');
  if (tot) {
    tot.textContent = list.length;
    document.getElementById('giftThankYesCount').textContent = list.filter(g => g.thankSent).length;
    document.getElementById('giftThankNoCount').textContent = list.filter(g => !g.thankSent).length;
  }
}

// ── Wedding Party ──
function renderParty() {
  const grid = document.getElementById('partyRolesGrid');
  if (!grid) return;
  grid.innerHTML = Object.keys(state.party).map(role => {
    const members = state.party[role];
    return `
      <div class="party-role">
        <div class="party-role-title"><span class="party-role-emoji">${partyRoleEmojis[role] || '✨'}</span>${role}</div>
        <div class="party-members">
          ${members.length ? members.map(m => `
            <div class="party-member">
              <span>${m.name}${m.note ? ` — <em style="color:var(--text-light)">${m.note}</em>` : ''}</span>
              <button class="btn-danger" onclick="removePartyMember('${role}', ${m.id})">✕</button>
            </div>
          `).join('') : '<p style="color:var(--text-light);font-style:italic;font-size:13px;padding:8px;">None yet</p>'}
        </div>
        <div class="party-member-input">
          <input type="text" id="partyInput-${role.replace(/\W/g,'')}" placeholder="Add a name" class="flex-input"/>
          <button class="btn-primary" onclick="addPartyMember('${role}')">+</button>
        </div>
      </div>`;
  }).join('');
}

function addPartyMember(role) {
  const input = document.getElementById('partyInput-' + role.replace(/\W/g,''));
  const name = input.value.trim();
  if (!name) return;
  state.party[role].push({ id: Date.now(), name, note: '' });
  input.value = '';
  saveState();
  renderParty();
}

function removePartyMember(role, id) {
  state.party[role] = state.party[role].filter(m => m.id !== id);
  saveState();
  renderParty();
}

// ── Mood Board ──
function initMoodBoard() {
  renderSwatches();
  renderPaletteHero();
  renderStyleGrid();
  renderFlowerGrid();
  const vn = document.getElementById('visionNote');
  if (vn) vn.addEventListener('input', () => {
    state.visionNote = vn.value;
    saveState();
    extractKeywords();
  });
}

function addColor() {
  const hex = document.getElementById('colorPicker').value;
  const name = document.getElementById('colorName').value.trim() || hex;
  state.colors.push({ hex, name });
  document.getElementById('colorName').value = '';
  saveState();
  renderSwatches();
  renderPaletteHero();
}

function removeSwatch(i) {
  state.colors.splice(i, 1);
  saveState();
  renderSwatches();
  renderPaletteHero();
}

function clearColors() {
  if (!confirm('Clear all colors from your palette?')) return;
  state.colors = [];
  saveState();
  renderSwatches();
  renderPaletteHero();
  toast('Palette cleared');
}

function applyPreset(idx) {
  const preset = presetPalettes[idx];
  state.colors = preset.colors.map(c => ({ ...c }));
  saveState();
  renderSwatches();
  renderPaletteHero();
  toast('Applied "' + preset.name + '" palette');
}

function renderSwatches() {
  const wrap = document.getElementById('paletteSwatches');
  if (state.colors.length === 0) {
    wrap.className = 'swatch-row empty';
    wrap.innerHTML = '';
  } else {
    wrap.className = 'swatch-row';
    wrap.innerHTML = state.colors.map((c, i) => `
      <div class="swatch" style="background:${c.hex}" title="${c.name} — click to remove" onclick="removeSwatch(${i})">
        <span class="swatch-label">${c.name}</span>
      </div>`).join('');
  }
}

function renderPaletteHero() {
  const strip = document.getElementById('paletteHeroStrip');
  const names = document.getElementById('paletteHeroNames');
  if (state.colors.length === 0) {
    strip.className = 'palette-hero-strip empty';
    strip.innerHTML = 'Add colors below to see your palette';
    names.innerHTML = '';
  } else {
    strip.className = 'palette-hero-strip';
    strip.innerHTML = state.colors.map(c => `<div style="background:${c.hex}" title="${c.name}"></div>`).join('');
    names.innerHTML = state.colors.map(c => `<span class="palette-hero-name"><span class="mini-swatch" style="background:${c.hex}"></span>${c.name}</span>`).join('');
  }
}

function renderPresetPalettes() {
  const wrap = document.getElementById('presetPalettes');
  if (!wrap) return;
  wrap.innerHTML = presetPalettes.map((p, i) => `
    <div class="preset-palette" onclick="applyPreset(${i})">
      <div class="preset-swatches">
        ${p.colors.map(c => `<div style="background:${c.hex}"></div>`).join('')}
      </div>
      <div class="preset-name">${p.name}</div>
    </div>`).join('');
}

function renderStyleGrid() {
  document.getElementById('styleGrid').innerHTML = styleOptions.map(s => `
    <span class="style-chip ${state.selectedStyles.includes(s) ? 'selected' : ''}" onclick="toggleStyle('${s}')">${s}</span>
  `).join('');
}

function toggleStyle(s) {
  const i = state.selectedStyles.indexOf(s);
  if (i >= 0) state.selectedStyles.splice(i, 1); else state.selectedStyles.push(s);
  saveState();
  renderStyleGrid();
}

function clearStyles() {
  if (!confirm('Clear all style selections?')) return;
  state.selectedStyles = [];
  saveState();
  renderStyleGrid();
  toast('Styles cleared');
}

function renderFlowerGrid() {
  document.getElementById('flowerGrid').innerHTML = flowerOptions.map(f => `
    <div class="flower-card ${state.selectedFlowers.includes(f.name) ? 'selected' : ''}" onclick="toggleFlower('${f.name}')">
      <span class="flower-emoji">${f.emoji}</span>${f.name}
    </div>`).join('');
}

function toggleFlower(name) {
  const i = state.selectedFlowers.indexOf(name);
  if (i >= 0) state.selectedFlowers.splice(i, 1); else state.selectedFlowers.push(name);
  saveState();
  renderFlowerGrid();
}

function clearFlowers() {
  if (!confirm('Clear all flower selections?')) return;
  state.selectedFlowers = [];
  saveState();
  renderFlowerGrid();
  toast('Flowers cleared');
}

function extractKeywords() {
  const text = (document.getElementById('visionNote')?.value || '').toLowerCase();
  const kwRaw = ['romantic','garden','rustic','vintage','bohemian','modern','elegant','floral','candlelit','outdoor','sunset','golden','linen','intimate','wildflower','eucalyptus','arch','canopy','fairy lights','marquee','beach','mountains','forest','minimalist','luxe','opulent'];
  const found = kwRaw.filter(kw => text.includes(kw));
  document.getElementById('moodKeywords').innerHTML = found.map(kw => `<span class="mood-kw">${kw}</span>`).join('');
}

function clearVision() {
  if (!confirm('Clear your vision notes?')) return;
  state.visionNote = '';
  document.getElementById('visionNote').value = '';
  saveState();
  extractKeywords();
  toast('Notes cleared');
}

// ── Honeymoon ──
function saveHoneymoon() {
  const dest = document.getElementById('hmDest').value.trim();
  if (!dest) { alert('Please enter a destination!'); return; }
  const depart = document.getElementById('hmDepart').value;
  const ret = document.getElementById('hmReturn').value;
  const budget = parseFloat(document.getElementById('hmBudget').value) || 0;
  const accom = document.getElementById('hmAccom').value;
  const style = document.getElementById('hmStyle').value;
  const notes = document.getElementById('hmNotes').value.trim();
  let nights = '—';
  if (depart && ret) nights = Math.max(0, Math.ceil((new Date(ret) - new Date(depart)) / 86400000));
  state.honeymoon = { dest, depart, ret, budget, accom, style, notes, nights };
  saveState();
  renderHoneymoonSummary();
  toast('Honeymoon saved ✈️');
}

function restoreHoneymoon() {
  if (!state.honeymoon) return;
  const h = state.honeymoon;
  document.getElementById('hmDest').value = h.dest || '';
  document.getElementById('hmDepart').value = h.depart || '';
  document.getElementById('hmReturn').value = h.ret || '';
  document.getElementById('hmBudget').value = h.budget || '';
  document.getElementById('hmAccom').value = h.accom || 'Luxury Resort';
  document.getElementById('hmStyle').value = h.style || 'Relaxation';
  document.getElementById('hmNotes').value = h.notes || '';
  renderHoneymoonSummary();
}

function renderHoneymoonSummary() {
  if (!state.honeymoon) return;
  const h = state.honeymoon;
  document.getElementById('hmSummaryCard').style.display = '';
  document.getElementById('hmSummary').innerHTML = [
    { label: '🌍 Destination', val: h.dest },
    { label: '✈️ Departing', val: h.depart || '—' },
    { label: '🏠 Return', val: h.ret || '—' },
    { label: '🌙 Nights', val: h.nights },
    { label: '💰 Budget', val: '$' + (h.budget || 0).toLocaleString() },
    { label: '🏨 Accommodation', val: h.accom },
    { label: '🎒 Travel Style', val: h.style },
  ].map(item => `<div class="hm-item"><div class="hm-item-label">${item.label}</div><div class="hm-item-val">${item.val}</div></div>`).join('')
  + (h.notes ? `<div class="hm-item" style="grid-column:1/-1"><div class="hm-item-label">🌟 Dream Experiences</div><div class="hm-item-val" style="font-size:15px;font-family:DM Sans">${h.notes}</div></div>` : '');
}

function addPackItem() {
  const val = document.getElementById('packItem').value.trim();
  if (!val) return;
  state.packItems.push({ id: Date.now(), text: val, checked: false });
  document.getElementById('packItem').value = '';
  saveState();
  renderPackList();
}

function togglePackItem(id) {
  const item = state.packItems.find(p => p.id === id);
  if (item) { item.checked = !item.checked; saveState(); renderPackList(); }
}

function deletePackItem(id) {
  state.packItems = state.packItems.filter(p => p.id !== id);
  saveState();
  renderPackList();
}

function renderPackList() {
  const w = document.getElementById('packList');
  if (!w) return;
  w.innerHTML = state.packItems.map(item => `
    <div class="pack-item ${item.checked ? 'checked' : ''}">
      <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="togglePackItem(${item.id})"/>
      <span class="pack-item-label">${item.text}</span>
      <button class="btn-danger" onclick="deletePackItem(${item.id})">✕</button>
    </div>`).join('');
}

function renderPackPresets() {
  const w = document.getElementById('presetChips');
  if (!w) return;
  w.innerHTML = packPresets.map(p => `<span class="preset-chip" onclick="addPresetItem('${p}')">${p}</span>`).join('');
}

function addPresetItem(text) {
  if (!state.packItems.find(p => p.text === text)) {
    state.packItems.push({ id: Date.now(), text, checked: false });
    saveState();
    renderPackList();
  }
}

// ── Export / Import ──
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `wedding-planner-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup downloaded 💾');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!confirm('This will replace all your current data. Continue?')) return;
      state = Object.assign(defaultState(), imported);
      state.events = Object.assign(defaultState().events, state.events || {});
      state.party = Object.assign(defaultState().party, state.party || {});
      state.wedding = Object.assign(defaultState().wedding, state.wedding || {});
      saveState();
      // Re-render everything
      restoreInputs();
      renderChecklist();
      renderExpenses();
      renderGuests();
      renderSeating();
      renderVenues();
      renderSwatches();
      renderPaletteHero();
      renderStyleGrid();
      renderFlowerGrid();
      renderEvents();
      renderParty();
      renderWeddingGifts();
      renderPackList();
      restoreHoneymoon();
      updateOverviewStats();
      renderRsvpRing();
      toast('Data restored successfully! ✨');
    } catch (err) {
      alert('Could not read that file. Make sure it\'s a backup from this planner.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ─────────────────────────────────────────
// WEDDING DAY TIMELINE
// ─────────────────────────────────────────
const WD_FIELDS = [
  'wdBrideHairMakeup','wdBrideHairArtist','wdBrideHairPhone','wdBrideDressed','wdBridePhotos','wdBrideLocation',
  'wdGroomReady','wdGroomPhotos','wdGroomLocation',
  'wdGuestArrival','wdCeremonyStart','wdCeremonyVenue','wdOfficiantName','wdOfficiantPhone','wdPhotographer','wdPhotographerPhone',
  'wdT1Time','wdT1From','wdT1To','wdT1Type','wdT1Company','wdT1Phone','wdT1Notes',
  'wdPhotoTime','wdPhotoLocation',
  'wdT2Time','wdT2From','wdT2To','wdT2Company','wdT2Phone',
  'wdReceptionArrival','wdReceptionStart','wdReceptionVenue','wdCocktail','wdDinner','wdSpeeches','wdCakeCutting','wdFirstDance','wdLastSong',
  'wdDJName','wdDJPhone','wdCatererName','wdCatererPhone','wdVenueCoord','wdVenueCoordPhone',
  'wdT3Time','wdT3From','wdT3To','wdT3Type','wdT3Company','wdT3Phone',
  'wdSpecialNotes'
];

function restoreWeddingDay() {
  WD_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (state.weddingDay[id]) el.value = state.weddingDay[id];
    el.addEventListener('input', () => {
      state.weddingDay[id] = el.value;
      saveState();
      renderTimelinePreview();
    });
  });
  renderTimelinePreview();
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayH = hour % 12 || 12;
  return `${displayH}:${m} ${suffix}`;
}

function renderTimelinePreview() {
  const wd = state.weddingDay;
  const preview = document.getElementById('timelinePreview');
  if (!preview) return;

  const items = [];
  const add = (time, title, details, phone) => {
    if (!time) return;
    items.push({ time, title, details, phone });
  };

  // Build timeline from data
  add(wd.wdBrideHairMakeup, 'Bride — Hair & Makeup', wd.wdBrideHairArtist, wd.wdBrideHairPhone);
  add(wd.wdGroomReady, 'Groom — Getting Ready', wd.wdGroomLocation);
  add(wd.wdBrideDressed, 'Bride — Getting Dressed', wd.wdBrideLocation);
  add(wd.wdBridePhotos, 'Bride — Photos with Bridesmaids', wd.wdBrideLocation);
  add(wd.wdGroomPhotos, 'Groom — Photos with Groomsmen', wd.wdGroomLocation);
  add(wd.wdGuestArrival, 'Guests Arrive for Ceremony', wd.wdCeremonyVenue);
  add(wd.wdCeremonyStart, '💒 Ceremony Begins', wd.wdCeremonyVenue + (wd.wdOfficiantName ? ' • Officiated by ' + wd.wdOfficiantName : ''), wd.wdOfficiantPhone);
  add(wd.wdT1Time, '🚗 Transport 1: ' + (wd.wdT1From || 'Ceremony') + ' → ' + (wd.wdT1To || 'Photos'), wd.wdT1Company + (wd.wdT1Type ? ' • ' + wd.wdT1Type : ''), wd.wdT1Phone);
  add(wd.wdPhotoTime, '📸 Photo Session', wd.wdPhotoLocation);
  add(wd.wdT2Time, '🚗 Transport 2: Photos → Reception', wd.wdT2Company, wd.wdT2Phone);
  add(wd.wdReceptionArrival, 'Guests Arrive at Reception', wd.wdReceptionVenue);
  add(wd.wdCocktail, '🥂 Cocktail Hour');
  add(wd.wdReceptionStart, '🎉 Reception Begins', wd.wdReceptionVenue);
  add(wd.wdDinner, '🍽️ Dinner Served', wd.wdCatererName, wd.wdCatererPhone);
  add(wd.wdSpeeches, '🎤 Speeches & Toasts');
  add(wd.wdCakeCutting, '🎂 Cake Cutting');
  add(wd.wdFirstDance, '💃 First Dance', wd.wdDJName, wd.wdDJPhone);
  add(wd.wdLastSong, '🎵 Last Song / Send-off');
  add(wd.wdT3Time, '🚗 Transport 3: Reception → ' + (wd.wdT3To || 'Hotel'), wd.wdT3Company + (wd.wdT3Type ? ' • ' + wd.wdT3Type : ''), wd.wdT3Phone);

  // Sort by time
  items.sort((a, b) => a.time.localeCompare(b.time));

  const partner1 = state.wedding.partner1 || '';
  const partner2 = state.wedding.partner2 || '';
  const names = partner1 && partner2 ? `${partner1} & ${partner2}` : 'Your Wedding Day';
  const dateStr = state.wedding.weddingDate
    ? new Date(state.wedding.weddingDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : 'Date TBD';

  if (items.length === 0) {
    preview.innerHTML = `
      <h3>✦ ${names} ✦</h3>
      <div class="timeline-date">${dateStr}</div>
      <div class="timeline-empty">Fill in the sections below and your full timeline will appear here.</div>`;
    return;
  }

  preview.innerHTML = `
    <h3>✦ ${names} ✦</h3>
    <div class="timeline-date">${dateStr}</div>
    ${items.map(item => `
      <div class="timeline-row">
        <div class="timeline-time">${formatTime(item.time)}</div>
        <div class="timeline-event">
          <strong>${item.title}</strong>
          ${item.details ? `<div class="details">${item.details}</div>` : ''}
          ${item.phone ? `<div class="phone">📞 ${item.phone}</div>` : ''}
        </div>
      </div>
    `).join('')}`;
}

// ─────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────
function getApptCategory(type) {
  const venues = ['Ceremony Venue','Reception Venue'];
  const fittings = ['Dress Fitting','Tuxedo Fitting','Hair & Makeup'];
  if (venues.includes(type)) return 'venue';
  if (fittings.includes(type)) return 'fitting';
  return 'vendor';
}

function addAppointment() {
  const type = document.getElementById('apptType').value;
  const vendor = document.getElementById('apptVendor').value.trim();
  const date = document.getElementById('apptDate').value;
  const time = document.getElementById('apptTime').value;
  const location = document.getElementById('apptLocation').value.trim();
  const phone = document.getElementById('apptPhone').value.trim();
  const notes = document.getElementById('apptNotes').value.trim();

  if (!vendor || !date) { alert('Please enter at least a vendor name and a date.'); return; }

  state.appointments.push({
    id: Date.now(), type, vendor, date, time, location, phone, notes, attended: false
  });

  ['apptVendor','apptLocation','apptPhone','apptNotes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('apptDate').value = '';
  document.getElementById('apptTime').value = '';

  saveState();
  renderAppointments();
  renderCalendar();
  toast('Appointment added ✓');
}

function deleteAppointment(id) {
  state.appointments = state.appointments.filter(a => a.id !== id);
  saveState();
  renderAppointments();
  renderCalendar();
}

function toggleAttended(id) {
  const a = state.appointments.find(a => a.id === id);
  if (a) { a.attended = !a.attended; saveState(); renderAppointments(); renderCalendar(); }
}

function renderAppointments() {
  const wrap = document.getElementById('apptList');
  if (!wrap) return;

  // Stats
  const total = state.appointments.length;
  const attended = state.appointments.filter(a => a.attended).length;
  const upcoming = state.appointments.filter(a => !a.attended && a.date >= new Date().toISOString().slice(0,10)).length;
  document.getElementById('apptTotal').textContent = total;
  document.getElementById('apptAttended').textContent = attended;
  document.getElementById('apptUpcoming').textContent = upcoming;

  if (total === 0) {
    wrap.innerHTML = '<p class="empty-msg">📅 No appointments yet. Add one above!</p>';
    return;
  }

  // Sort by date
  const sorted = [...state.appointments].sort((a, b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));

  wrap.innerHTML = sorted.map(a => {
    const d = new Date(a.date + 'T12:00:00');
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const cat = getApptCategory(a.type);
    return `
      <div class="appt-card ${cat} ${a.attended ? 'attended' : ''}">
        <div class="appt-date-badge">
          <div class="day">${day}</div>
          <div class="month">${month}</div>
        </div>
        <div class="appt-info">
          <span class="appt-type">${a.type}</span>
          <div class="appt-vendor">${a.vendor}</div>
          <div class="appt-detail">
            ${a.time ? formatTime(a.time) + ' ' : ''}
            ${a.location ? '• ' + a.location : ''}
            ${a.phone ? `<br><span class="phone">📞 ${a.phone}</span>` : ''}
            ${a.notes ? `<br><em>${a.notes}</em>` : ''}
          </div>
        </div>
        <label class="appt-check">
          <input type="checkbox" ${a.attended ? 'checked' : ''} onchange="toggleAttended(${a.id})"/>
          ${a.attended ? 'Attended' : 'Mark attended'}
        </label>
        <button class="btn-danger" onclick="deleteAppointment(${a.id})">✕</button>
      </div>`;
  }).join('');
}

function switchApptView(view) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('apptListCard').style.display = view === 'list' ? '' : 'none';
  document.getElementById('apptCalendarCard').style.display = view === 'calendar' ? '' : 'none';
  if (view === 'calendar') renderCalendar();
}

function changeMonth(delta) {
  state.calendarMonth += delta;
  if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
  else if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
  state.selectedCalendarDate = null;
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calendarTitle');
  if (!grid || !title) return;

  const year = state.calendarYear;
  const month = state.calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const todayStr = new Date().toISOString().slice(0,10);

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  title.textContent = monthName;

  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('');

  // Empty cells before month starts
  for (let i = 0; i < startDayOfWeek; i++) html += '<div class="calendar-day empty"></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayAppts = state.appointments.filter(a => a.date === dateStr);
    const classes = ['calendar-day'];
    if (dayAppts.length > 0) classes.push('has-appts');
    if (dateStr === todayStr) classes.push('today');
    if (dateStr === state.selectedCalendarDate) classes.push('selected');
    html += `<div class="${classes.join(' ')}" onclick="selectCalendarDate('${dateStr}')">${day}${dayAppts.length > 0 ? `<div class="dot-row"><span class="dot"></span></div>` : ''}</div>`;
  }

  grid.innerHTML = html;
  renderSelectedDayPanel();
}

function selectCalendarDate(dateStr) {
  state.selectedCalendarDate = dateStr;
  renderCalendar();
}

function renderSelectedDayPanel() {
  const panel = document.getElementById('selectedDayPanel');
  if (!panel) return;
  if (!state.selectedCalendarDate) { panel.style.display = 'none'; return; }

  const dayAppts = state.appointments.filter(a => a.date === state.selectedCalendarDate);
  const d = new Date(state.selectedCalendarDate + 'T12:00:00');
  const dateFmt = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  if (dayAppts.length === 0) {
    panel.style.display = '';
    panel.innerHTML = `<h4>${dateFmt}</h4><p style="color:var(--text-light);font-style:italic;font-size:13px">No appointments on this day.</p>`;
    return;
  }

  panel.style.display = '';
  panel.innerHTML = `<h4>${dateFmt}</h4>` + dayAppts.map(a => `
    <div style="padding:10px 0;border-bottom:1px dashed var(--peach-light)">
      <strong>${a.vendor}</strong> <span style="color:var(--text-light);font-size:12px">(${a.type})</span>
      ${a.time ? `<div style="font-size:13px;color:var(--text-mid)">${formatTime(a.time)}${a.location ? ' • ' + a.location : ''}</div>` : ''}
      ${a.phone ? `<div style="font-size:13px;color:var(--peach);font-weight:600">📞 ${a.phone}</div>` : ''}
    </div>
  `).join('');
}
