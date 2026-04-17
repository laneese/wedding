/* ─────────────────────────────────────────
   Ever After Planner — script.js
───────────────────────────────────────── */

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  expenses: [],
  guests: [],
  tables: [],
  venues: [],
  colors: [
    { hex: '#8fac82', name: 'Sage Green' },
    { hex: '#e8a98a', name: 'Peachy Rose' },
    { hex: '#f2cdb8', name: 'Blush Peach' }
  ],
  selectedStyles: [],
  selectedFlowers: [],
  checklist: [],
  packItems: [],
  starRating: 0,
  honeymoon: null
};

// ── CHECKLIST DATA ─────────────────────────────────────────────────────────
const checklistItems = [
  { id: 1, text: 'Set your wedding date', done: false },
  { id: 2, text: 'Create your guest list', done: false },
  { id: 3, text: 'Set your budget', done: false },
  { id: 4, text: 'Book your venue', done: false },
  { id: 5, text: 'Choose your wedding party', done: false },
  { id: 6, text: 'Book photographer & videographer', done: false },
  { id: 7, text: 'Hire a caterer', done: false },
  { id: 8, text: 'Book hair & makeup', done: false },
  { id: 9, text: 'Find your wedding dress / attire', done: false },
  { id: 10, text: 'Book florist', done: false },
  { id: 11, text: 'Book music / DJ / band', done: false },
  { id: 12, text: 'Send invitations', done: false },
  { id: 13, text: 'Plan honeymoon', done: false },
  { id: 14, text: 'Arrange transport', done: false },
  { id: 15, text: 'Order wedding cake', done: false },
  { id: 16, text: 'Buy rings', done: false },
  { id: 17, text: 'Plan rehearsal dinner', done: false },
  { id: 18, text: 'Finalize seating chart', done: false },
];

// ── STYLE OPTIONS ─────────────────────────────────────────────────────────
const styleOptions = [
  'Romantic', 'Rustic', 'Bohemian', 'Modern & Minimal', 'Classic & Elegant',
  'Garden Party', 'Vintage', 'Beach', 'Black Tie', 'Whimsical', 'Tropical', 'Cottagecore'
];

// ── FLOWER OPTIONS ─────────────────────────────────────────────────────────
const flowerOptions = [
  { name: 'Roses', emoji: '🌹' },
  { name: 'Peonies', emoji: '🌸' },
  { name: 'Wildflowers', emoji: '🌼' },
  { name: 'Tulips', emoji: '🌷' },
  { name: 'Eucalyptus', emoji: '🌿' },
  { name: 'Lavender', emoji: '💜' },
  { name: 'Hydrangeas', emoji: '🩵' },
  { name: 'Sunflowers', emoji: '🌻' },
  { name: 'Orchids', emoji: '🌺' },
  { name: 'Dahlias', emoji: '🏵️' },
  { name: 'Baby\'s Breath', emoji: '🤍' },
  { name: 'Lilies', emoji: '⚘' },
];

// ── PACK PRESETS ─────────────────────────────────────────────────────────
const packPresets = [
  'Passport', 'Tickets', 'Travel Insurance', 'Sunscreen', 'Swimwear',
  'Camera', 'Adaptor', 'Toiletries', 'Medications', 'Euros / Cash',
  'Wedding Certificate', 'Honeymoon outfits', 'Chargers'
];

// ── CHART COLORS ─────────────────────────────────────────────────────────
const chartColors = [
  '#8fac82','#e8a98a','#b8c9a3','#d4a896','#c5d4b0',
  '#e8c4b0','#a3b898','#f2cdb8','#7a9970','#d4b8a8',
  '#6a8f5f','#c09884'
];

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  state.checklist = checklistItems.map(i => ({ ...i }));
  initTabs();
  initOverview();
  initChecklist();
  initMoodBoard();
  initHoneymoon();
  initStarRating();
  updateOverviewStats();
});

// ─────────────────────────────────────────
// TABS
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────
function initOverview() {
  ['partner1','partner2','weddingDate','weddingLocation','totalBudget','expectedGuests'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateOverviewStats);
  });
}

function updateOverviewStats() {
  // Days left
  const dateVal = document.getElementById('weddingDate').value;
  if (dateVal) {
    const diff = Math.ceil((new Date(dateVal) - new Date()) / (1000*60*60*24));
    document.getElementById('daysLeft').textContent = diff > 0 ? diff.toLocaleString() : '🎉 Today!';
  } else {
    document.getElementById('daysLeft').textContent = '—';
  }

  // Budget
  const total = parseFloat(document.getElementById('totalBudget').value) || 0;
  const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById('budgetUsed').textContent = '$' + spent.toLocaleString();
  updateBudgetDisplay(total, spent);

  // RSVPs
  const confirmed = state.guests.filter(g => g.rsvp === 'Confirmed').length;
  document.getElementById('rsvpCount').textContent = confirmed;

  // Tasks
  const done = state.checklist.filter(c => c.done).length;
  const pct = state.checklist.length ? Math.round((done / state.checklist.length) * 100) : 0;
  document.getElementById('tasksPercent').textContent = pct + '%';

  // Donut
  drawDonut();
}

// ─────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────
function initChecklist() {
  renderChecklist();
}

function renderChecklist() {
  const el = document.getElementById('checklist');
  el.innerHTML = state.checklist.map(item => `
    <div class="check-item ${item.done ? 'done' : ''}" onclick="toggleCheck(${item.id})">
      <div class="check-box">${item.done ? '✓' : ''}</div>
      <span class="check-text">${item.text}</span>
    </div>
  `).join('');

  const done = state.checklist.filter(c => c.done).length;
  const total = state.checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressText').textContent = `${done} / ${total}`;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('tasksPercent').textContent = pct + '%';
}

function toggleCheck(id) {
  const item = state.checklist.find(c => c.id === id);
  if (item) { item.done = !item.done; renderChecklist(); }
}

// ─────────────────────────────────────────
// DONUT CHART
// ─────────────────────────────────────────
function drawDonut() {
  const canvas = document.getElementById('donutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Group expenses by category
  const cats = {};
  state.expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const entries = Object.entries(cats);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const cx = W / 2, cy = H / 2, r = 80, inner = 50;

  if (entries.length === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
    ctx.fillStyle = '#f0eae6';
    ctx.fill();
    ctx.fillStyle = '#a09590';
    ctx.font = '13px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', cx, cy + 5);
    document.getElementById('donutLegend').innerHTML = '';
    return;
  }

  let angle = -Math.PI / 2;
  entries.forEach(([cat, val], i) => {
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

  // Center text
  ctx.fillStyle = '#3d3530';
  ctx.font = 'bold 15px DM Sans';
  ctx.textAlign = 'center';
  ctx.fillText('$' + total.toLocaleString(), cx, cy + 5);

  // Legend
  document.getElementById('donutLegend').innerHTML = entries.map(([cat, val], i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${chartColors[i % chartColors.length]}"></div>
      <span>${cat}: $${val.toLocaleString()}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────
function addExpense() {
  const name = document.getElementById('expName').value.trim();
  const category = document.getElementById('expCategory').value;
  const amount = parseFloat(document.getElementById('expAmount').value);
  if (!name || isNaN(amount) || amount <= 0) { alert('Please enter a name and valid amount.'); return; }
  state.expenses.push({ id: Date.now(), name, category, amount });
  document.getElementById('expName').value = '';
  document.getElementById('expAmount').value = '';
  renderExpenses();
  updateOverviewStats();
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  renderExpenses();
  updateOverviewStats();
}

function renderExpenses() {
  const tbody = document.getElementById('expenseBody');
  if (state.expenses.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No expenses yet. Add one above! 💸</td></tr>';
  } else {
    tbody.innerHTML = state.expenses.map(e => `
      <tr>
        <td>${e.name}</td>
        <td><span style="background:${catColor(e.category)}22;color:${catColor(e.category)};padding:3px 10px;border-radius:40px;font-size:12px;">${e.category}</span></td>
        <td><strong>$${e.amount.toLocaleString()}</strong></td>
        <td><button class="btn-danger" onclick="deleteExpense(${e.id})">✕</button></td>
      </tr>
    `).join('');
  }

  const total = parseFloat(document.getElementById('totalBudget').value) || 0;
  const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
  updateBudgetDisplay(total, spent);
  renderBarChart();
}

function updateBudgetDisplay(total, spent) {
  document.getElementById('bTotal').textContent = '$' + total.toLocaleString();
  document.getElementById('bSpent').textContent = '$' + spent.toLocaleString();
  const rem = total - spent;
  document.getElementById('bRemaining').textContent = (rem >= 0 ? '$' : '-$') + Math.abs(rem).toLocaleString();
  document.getElementById('bRemaining').style.color = rem >= 0 ? 'var(--sage-dark)' : '#c0504d';
  const pct = total ? Math.min((spent / total) * 100, 100) : 0;
  document.getElementById('budgetFill').style.width = pct + '%';
  document.getElementById('budgetFill').style.background = pct > 90 ? 'linear-gradient(90deg,#e8a98a,#c0504d)' : '';
}

function renderBarChart() {
  const wrap = document.getElementById('barChart');
  const cats = {};
  state.expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  if (entries.length === 0) { wrap.innerHTML = '<p style="color:var(--text-light);font-style:italic;font-size:14px;">Add expenses to see spending by category.</p>'; return; }

  wrap.innerHTML = entries.map(([cat, val], i) => `
    <div class="bar-row">
      <span class="bar-cat">${cat}</span>
      <div class="bar-outer">
        <div class="bar-inner" style="width:${(val/max)*100}%;background:${chartColors[i % chartColors.length]}"></div>
      </div>
      <span class="bar-val">$${val.toLocaleString()}</span>
    </div>
  `).join('');
}

function catColor(cat) {
  const map = { Venue:'#8fac82',Catering:'#e8a98a',Photography:'#b8c9a3',Flowers:'#d4a896',Music:'#c5d4b0',Attire:'#e8c4b0',Cake:'#a3b898',Transport:'#f2cdb8',Honeymoon:'#7a9970',Stationery:'#d4b8a8',Other:'#c09884' };
  return map[cat] || '#a09590';
}

// ─────────────────────────────────────────
// GUESTS
// ─────────────────────────────────────────
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
  renderGuests();
  updateOverviewStats();
  updateSeatingDropdowns();
}

function deleteGuest(id) {
  state.guests = state.guests.filter(g => g.id !== id);
  renderGuests();
  updateOverviewStats();
  updateSeatingDropdowns();
}

function renderGuests() {
  const search = (document.getElementById('guestSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('guestFilter')?.value || 'All';
  const filtered = state.guests.filter(g =>
    (filter === 'All' || g.rsvp === filter) &&
    g.name.toLowerCase().includes(search)
  );

  const tbody = document.getElementById('guestBody');
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
      </tr>
    `).join('');
  }

  document.getElementById('gTotal').textContent = state.guests.length;
  document.getElementById('gConfirmed').textContent = state.guests.filter(g => g.rsvp === 'Confirmed').length;
  document.getElementById('gDeclined').textContent  = state.guests.filter(g => g.rsvp === 'Declined').length;
  document.getElementById('gPending').textContent   = state.guests.filter(g => g.rsvp === 'Pending').length;
}

// ─────────────────────────────────────────
// SEATING
// ─────────────────────────────────────────
function addTable() {
  const name = document.getElementById('tableName').value.trim() || `Table ${state.tables.length + 1}`;
  const seats = parseInt(document.getElementById('tableSeats').value) || 8;
  state.tables.push({ id: Date.now(), name, seats, assignments: Array(seats).fill(null) });
  document.getElementById('tableName').value = '';
  renderSeating();
}

function renderSeating() {
  const grid = document.getElementById('seatingGrid');
  if (state.tables.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No tables yet. Create a table above to get started! 🪑</p>';
    return;
  }

  const confirmedGuests = state.guests.filter(g => g.rsvp === 'Confirmed');

  grid.innerHTML = state.tables.map(table => `
    <div class="table-card">
      <div class="table-card-header">
        <span class="table-card-title">${table.name}</span>
        <span class="seat-capacity">${table.assignments.filter(Boolean).length} / ${table.seats} seats</span>
        <button class="btn-danger" onclick="deleteTable(${table.id})">✕</button>
      </div>
      <div class="seat-slots">
        ${table.assignments.map((assigned, i) => `
          <div class="seat-slot ${assigned ? 'filled' : ''}">
            <span style="color:var(--text-light);font-size:12px;margin-right:8px">${i+1}</span>
            <select class="seat-assign-select" onchange="assignSeat(${table.id}, ${i}, this.value)">
              <option value="">— Empty —</option>
              ${confirmedGuests.map(g => `<option value="${g.id}" ${assigned == g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function assignSeat(tableId, seatIdx, guestId) {
  const table = state.tables.find(t => t.id === tableId);
  if (table) { table.assignments[seatIdx] = guestId ? parseInt(guestId) : null; renderSeating(); }
}

function deleteTable(id) {
  state.tables = state.tables.filter(t => t.id !== id);
  renderSeating();
}

function updateSeatingDropdowns() { renderSeating(); }

// ─────────────────────────────────────────
// VENUE
// ─────────────────────────────────────────
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
  const location = document.getElementById('venueLocation').value.trim();
  const capacity = parseInt(document.getElementById('venueCapacity').value) || 0;
  const price = parseFloat(document.getElementById('venuePrice').value) || 0;
  const type = document.getElementById('venueType').value;
  const catering = document.getElementById('venueCatering').value;
  const notes = document.getElementById('venueNotes').value.trim();
  const rating = state.starRating;
  if (!name) { alert('Please enter a venue name.'); return; }
  state.venues.push({ id: Date.now(), name, location, capacity, price, type, catering, notes, rating });
  ['venueName','venueLocation','venueCapacity','venuePrice','venueNotes'].forEach(id => document.getElementById(id).value = '');
  state.starRating = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('lit'));
  renderVenues();
}

function deleteVenue(id) {
  state.venues = state.venues.filter(v => v.id !== id);
  renderVenues();
}

function renderVenues() {
  const wrap = document.getElementById('venueCards');
  if (state.venues.length === 0) {
    wrap.innerHTML = '<p class="empty-msg">No venues yet. Add one above to start comparing! 🏛️</p>';
    return;
  }
  wrap.innerHTML = state.venues.map(v => `
    <div class="venue-card">
      <button class="btn-danger venue-delete" onclick="deleteVenue(${v.id})">✕</button>
      <div class="venue-card-name">${v.name}</div>
      <div class="venue-loc">📍 ${v.location || 'Location TBD'}</div>
      <div class="venue-stars">${'★'.repeat(v.rating)}${'☆'.repeat(5 - v.rating)}</div>
      <div class="venue-meta">
        <span class="venue-chip">👥 Up to ${v.capacity || '?'} guests</span>
        <span class="venue-chip">💰 $${v.price.toLocaleString()}</span>
        <span class="venue-chip">${v.type === 'Indoor' ? '🏠' : v.type === 'Outdoor' ? '🌿' : '🌤'} ${v.type}</span>
        <span class="venue-chip">🍽 Catering: ${v.catering}</span>
      </div>
      ${v.notes ? `<div class="venue-notes">"${v.notes}"</div>` : ''}
    </div>
  `).join('');
}

// ─────────────────────────────────────────
// MOOD BOARD
// ─────────────────────────────────────────
function initMoodBoard() {
  renderSwatches();
  renderStyleGrid();
  renderFlowerGrid();

  document.getElementById('visionNote').addEventListener('input', extractKeywords);
}

function addColor() {
  const hex = document.getElementById('colorPicker').value;
  const name = document.getElementById('colorName').value.trim() || hex;
  state.colors.push({ hex, name });
  document.getElementById('colorName').value = '';
  renderSwatches();
}

function renderSwatches() {
  document.getElementById('paletteSwatches').innerHTML = state.colors.map((c, i) => `
    <div class="swatch" style="background:${c.hex}" title="${c.name}" onclick="removeSwatch(${i})">
      <span class="swatch-label">${c.name}</span>
    </div>
  `).join('');
}

function removeSwatch(i) {
  if (state.colors.length > 1) { state.colors.splice(i, 1); renderSwatches(); }
}

function renderStyleGrid() {
  document.getElementById('styleGrid').innerHTML = styleOptions.map(s => `
    <span class="style-chip ${state.selectedStyles.includes(s) ? 'selected' : ''}" onclick="toggleStyle('${s}')">${s}</span>
  `).join('');
}

function toggleStyle(s) {
  const i = state.selectedStyles.indexOf(s);
  if (i >= 0) state.selectedStyles.splice(i, 1); else state.selectedStyles.push(s);
  renderStyleGrid();
}

function renderFlowerGrid() {
  document.getElementById('flowerGrid').innerHTML = flowerOptions.map(f => `
    <div class="flower-card ${state.selectedFlowers.includes(f.name) ? 'selected' : ''}" onclick="toggleFlower('${f.name}')">
      <span class="flower-emoji">${f.emoji}</span>${f.name}
    </div>
  `).join('');
}

function toggleFlower(name) {
  const i = state.selectedFlowers.indexOf(name);
  if (i >= 0) state.selectedFlowers.splice(i, 1); else state.selectedFlowers.push(name);
  renderFlowerGrid();
}

function extractKeywords() {
  const text = document.getElementById('visionNote').value;
  const kwRaw = ['romantic','garden','rustic','vintage','bohemian','modern','elegant','floral','candlelit','outdoor','sunset','golden','linen','intimate','grandeur','wildflower','eucalyptus','arch','canopy','fairy lights','marquee','waterfall','beach','mountains','forest','minimalist','luxe','opulent'];
  const found = kwRaw.filter(kw => text.toLowerCase().includes(kw));
  document.getElementById('moodKeywords').innerHTML = found.map(kw => `<span class="mood-kw">${kw}</span>`).join('');
}

// ─────────────────────────────────────────
// HONEYMOON
// ─────────────────────────────────────────
function initHoneymoon() {
  renderPackPresets();
}

function saveHoneymoon() {
  const dest = document.getElementById('hmDest').value.trim();
  const depart = document.getElementById('hmDepart').value;
  const ret = document.getElementById('hmReturn').value;
  const budget = parseFloat(document.getElementById('hmBudget').value) || 0;
  const accom = document.getElementById('hmAccom').value;
  const style = document.getElementById('hmStyle').value;
  const notes = document.getElementById('hmNotes').value.trim();

  if (!dest) { alert('Please enter a destination!'); return; }

  // Calculate nights
  let nights = '—';
  if (depart && ret) {
    nights = Math.max(0, Math.ceil((new Date(ret) - new Date(depart)) / (1000*60*60*24)));
  }

  state.honeymoon = { dest, depart, ret, budget, accom, style, notes, nights };

  document.getElementById('hmSummaryCard').style.display = '';
  document.getElementById('hmSummary').innerHTML = [
    { label: '🌍 Destination', val: dest },
    { label: '✈️ Departing', val: depart || '—' },
    { label: '🏠 Return', val: ret || '—' },
    { label: '🌙 Nights', val: nights },
    { label: '💰 Budget', val: '$' + budget.toLocaleString() },
    { label: '🏨 Accommodation', val: accom },
    { label: '🎒 Travel Style', val: style },
  ].map(item => `
    <div class="hm-item">
      <div class="hm-item-label">${item.label}</div>
      <div class="hm-item-val">${item.val}</div>
    </div>
  `).join('') + (notes ? `<div class="hm-item" style="grid-column:1/-1"><div class="hm-item-label">🌟 Dream Experiences</div><div class="hm-item-val" style="font-size:15px;font-family:DM Sans">${notes}</div></div>` : '');
}

function addPackItem() {
  const val = document.getElementById('packItem').value.trim();
  if (!val) return;
  state.packItems.push({ id: Date.now(), text: val, checked: false });
  document.getElementById('packItem').value = '';
  renderPackList();
}

function togglePackItem(id) {
  const item = state.packItems.find(p => p.id === id);
  if (item) { item.checked = !item.checked; renderPackList(); }
}

function deletePackItem(id) {
  state.packItems = state.packItems.filter(p => p.id !== id);
  renderPackList();
}

function renderPackList() {
  const wrap = document.getElementById('packList');
  wrap.innerHTML = state.packItems.map(item => `
    <div class="pack-item ${item.checked ? 'checked' : ''}">
      <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="togglePackItem(${item.id})"/>
      <span class="pack-item-label">${item.text}</span>
      <button class="btn-danger" onclick="deletePackItem(${item.id})">✕</button>
    </div>
  `).join('');
}

function renderPackPresets() {
  document.getElementById('presetChips').innerHTML = packPresets.map(p => `
    <span class="preset-chip" onclick="addPresetItem('${p}')">${p}</span>
  `).join('');
}

function addPresetItem(text) {
  if (!state.packItems.find(p => p.text === text)) {
    state.packItems.push({ id: Date.now(), text, checked: false });
    renderPackList();
  }
}
