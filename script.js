/* ─────────────────────────────────────────
   Ever After Planner — script.js v3
   Grouped checklist, pretty empty donut
───────────────────────────────────────── */

const state = {
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
  checklist: [],
  packItems: [],
  starRating: 0,
  honeymoon: null
};

// Checklist grouped by phase
const checklistGroups = [
  {
    title: 'Foundation',
    items: [
      { id: 1, text: 'Set your wedding date', done: false },
      { id: 2, text: 'Create your guest list', done: false },
      { id: 3, text: 'Set your budget', done: false },
      { id: 4, text: 'Book your venue', done: false },
      { id: 5, text: 'Choose your wedding party', done: false },
    ]
  },
  {
    title: 'Vendors & Services',
    items: [
      { id: 6, text: 'Book photographer & videographer', done: false },
      { id: 7, text: 'Hire a caterer', done: false },
      { id: 8, text: 'Book hair & makeup', done: false },
      { id: 9, text: 'Book florist', done: false },
      { id: 10, text: 'Book music / DJ / band', done: false },
      { id: 11, text: 'Order wedding cake', done: false },
    ]
  },
  {
    title: 'Attire & Details',
    items: [
      { id: 12, text: 'Find your wedding dress / attire', done: false },
      { id: 13, text: 'Buy rings', done: false },
      { id: 14, text: 'Send invitations', done: false },
      { id: 15, text: 'Arrange transport', done: false },
    ]
  },
  {
    title: 'Final Touches',
    items: [
      { id: 16, text: 'Plan honeymoon', done: false },
      { id: 17, text: 'Plan rehearsal dinner', done: false },
      { id: 18, text: 'Finalize seating chart', done: false },
    ]
  }
];

const styleOptions = [
  'Romantic', 'Rustic', 'Bohemian', 'Modern & Minimal', 'Classic & Elegant',
  'Garden Party', 'Vintage', 'Beach', 'Black Tie', 'Whimsical', 'Tropical', 'Cottagecore'
];

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
  { name: "Baby's Breath", emoji: '🤍' },
  { name: 'Lilies', emoji: '⚘' },
];

const packPresets = [
  'Passport', 'Tickets', 'Travel Insurance', 'Sunscreen', 'Swimwear',
  'Camera', 'Adaptor', 'Toiletries', 'Medications', 'Cash',
  'Wedding Certificate', 'Honeymoon outfits', 'Chargers'
];

const chartColors = [
  '#8fac82','#f0b89a','#d4e8d0','#f7d8c5','#c5d4b0',
  '#faf3e8','#a3b898','#fcefe6','#7a9970','#d4b8a8',
  '#6a8f5f','#c09884'
];

const RING_CIRCUMFERENCE = 2 * Math.PI * 85;

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Flatten checklist for quick lookup
  state.checklist = checklistGroups.flatMap(g => g.items.map(i => ({ ...i, group: g.title })));
  initTabs();
  initOverview();
  renderChecklist();
  initMoodBoard();
  initHoneymoon();
  initStarRating();
  updateOverviewStats();
  renderRsvpRing();
});

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

function initOverview() {
  ['partner1','partner2','weddingDate','weddingLocation','totalBudget','expectedGuests'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateOverviewStats);
  });
}

function updateOverviewStats() {
  const dateVal = document.getElementById('weddingDate').value;
  let daysLeft = 0;
  if (dateVal) {
    const diff = Math.ceil((new Date(dateVal) - new Date()) / (1000*60*60*24));
    daysLeft = diff;
    document.getElementById('daysLeft').textContent = diff > 0 ? diff.toLocaleString() : '🎉';
  } else {
    document.getElementById('daysLeft').textContent = '—';
  }
  const countdownPct = dateVal ? Math.min(Math.max(daysLeft/365, 0), 1) : 0;
  document.getElementById('countdownFill').style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - countdownPct);

  const done = state.checklist.filter(c => c.done).length;
  const total = state.checklist.length;
  const pct = total ? done / total : 0;
  document.getElementById('tasksPercent').textContent = Math.round(pct * 100) + '%';
  document.getElementById('tasksCount').textContent = `${done} / ${total}`;
  document.getElementById('tasksFill').style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct);

  const total$ = parseFloat(document.getElementById('totalBudget').value) || 0;
  const spent$ = state.expenses.reduce((s, e) => s + e.amount, 0);
  updateBudgetDisplay(total$, spent$);

  renderRsvpRing();
  drawDonut();
}

// ── Grouped Checklist ──
function renderChecklist() {
  const container = document.getElementById('checklistGrouped');
  container.innerHTML = checklistGroups.map(group => {
    const items = state.checklist.filter(i => i.group === group.title);
    const doneCount = items.filter(i => i.done).length;
    return `
      <div class="checklist-group">
        <div class="checklist-group-title">
          ${group.title}
          <span class="count">${doneCount} / ${items.length}</span>
        </div>
        <div class="checklist">
          ${items.map(item => `
            <div class="check-item ${item.done ? 'done' : ''}" onclick="toggleCheck(${item.id})">
              <div class="check-box">${item.done ? '✓' : ''}</div>
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
  const item = state.checklist.find(c => c.id === id);
  if (item) { item.done = !item.done; renderChecklist(); }
}

// ── RSVP Ring ──
function renderRsvpRing() {
  const confirmed = state.guests.filter(g => g.rsvp === 'Confirmed').length;
  const declined  = state.guests.filter(g => g.rsvp === 'Declined').length;
  const pending   = state.guests.filter(g => g.rsvp === 'Pending').length;
  const total = state.guests.length;

  document.getElementById('rsvpCount').textContent = confirmed;
  document.getElementById('legConfirmed').textContent = confirmed;
  document.getElementById('legDeclined').textContent  = declined;
  document.getElementById('legPending').textContent   = pending;

  const svg = document.getElementById('rsvpSvg');
  svg.querySelectorAll('.rsvp-segment').forEach(el => el.remove());
  if (total === 0) return;

  const C = RING_CIRCUMFERENCE;
  const segments = [
    { val: confirmed, color: '#8fac82' },
    { val: declined,  color: '#f0b89a' },
    { val: pending,   color: '#d4b896' }
  ];
  const ns = 'http://www.w3.org/2000/svg';
  let offset = 0;
  segments.forEach(seg => {
    if (seg.val === 0) return;
    const length = (seg.val / total) * C;
    const gap = C - length;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', '100');
    c.setAttribute('cy', '100');
    c.setAttribute('r', '85');
    c.setAttribute('class', 'rsvp-segment');
    c.setAttribute('stroke', seg.color);
    c.setAttribute('stroke-dasharray', `${length} ${gap}`);
    c.setAttribute('stroke-dashoffset', -offset);
    svg.appendChild(c);
    offset += length;
  });
}

// ── Donut: pretty empty state ──
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
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="donut-frame">
      <canvas id="donutChart" width="220" height="220"></canvas>
    </div>
    <div class="donut-legend" id="donutLegend"></div>
  `;

  const canvas = document.getElementById('donutChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, r = 80, inner = 50;

  let angle = -Math.PI/2;
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

  ctx.fillStyle = '#2c3d33';
  ctx.font = 'bold 15px DM Sans';
  ctx.textAlign = 'center';
  ctx.fillText('$' + total.toLocaleString(), cx, cy + 5);

  document.getElementById('donutLegend').innerHTML = entries.map(([cat, val], i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${chartColors[i % chartColors.length]}"></div>
      <span>${cat}: <strong>$${val.toLocaleString()}</strong></span>
    </div>
  `).join('');
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
  const bt = document.getElementById('bTotal');
  if (bt) bt.textContent = '$' + total.toLocaleString();
  const bs = document.getElementById('bSpent');
  if (bs) bs.textContent = '$' + spent.toLocaleString();
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
      <div class="bar-outer">
        <div class="bar-inner" style="width:${(val/max)*100}%;background:${chartColors[i % chartColors.length]}"></div>
      </div>
      <span class="bar-val">$${val.toLocaleString()}</span>
    </div>
  `).join('');
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

// ── Seating ──
function addTable() {
  const name = document.getElementById('tableName').value.trim() || `Table ${state.tables.length + 1}`;
  const seats = parseInt(document.getElementById('tableSeats').value) || 8;
  state.tables.push({ id: Date.now(), name, seats, assignments: Array(seats).fill(null) });
  document.getElementById('tableName').value = '';
  renderSeating();
}

function renderSeating() {
  const grid = document.getElementById('seatingGrid');
  if (!grid) return;
  if (state.tables.length === 0) {
    grid.innerHTML = '<p class="empty-msg">🪑 No tables yet. Create a table above to get started!</p>';
    return;
  }
  const confirmedGuests = state.guests.filter(g => g.rsvp === 'Confirmed');
  grid.innerHTML = state.tables.map(table => `
    <div class="table-card">
      <div class="table-card-header">
        <span class="table-card-title">${table.name}</span>
        <span class="seat-capacity">${table.assignments.filter(Boolean).length} / ${table.seats}</span>
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
        <span class="venue-chip">👥 Up to ${v.capacity || '?'} guests</span>
        <span class="venue-chip">💰 $${v.price.toLocaleString()}</span>
        <span class="venue-chip">${v.type === 'Indoor' ? '🏠' : v.type === 'Outdoor' ? '🌿' : '🌤'} ${v.type}</span>
        <span class="venue-chip">🍽 Catering: ${v.catering}</span>
      </div>
      ${v.notes ? `<div class="venue-notes">"${v.notes}"</div>` : ''}
    </div>
  `).join('');
}

// ── Mood Board ──
function initMoodBoard() {
  renderSwatches();
  renderPaletteHero();
  renderStyleGrid();
  renderFlowerGrid();
  const vn = document.getElementById('visionNote');
  if (vn) vn.addEventListener('input', extractKeywords);
}

function addColor() {
  const hex = document.getElementById('colorPicker').value;
  const name = document.getElementById('colorName').value.trim() || hex;
  state.colors.push({ hex, name });
  document.getElementById('colorName').value = '';
  renderSwatches();
  renderPaletteHero();
}

function renderSwatches() {
  document.getElementById('paletteSwatches').innerHTML = state.colors.map((c, i) => `
    <div class="swatch" style="background:${c.hex}" title="${c.name} — click to remove" onclick="removeSwatch(${i})">
      <span class="swatch-label">${c.name}</span>
    </div>
  `).join('');
}

function removeSwatch(i) {
  if (state.colors.length > 1) { state.colors.splice(i, 1); renderSwatches(); renderPaletteHero(); }
}

function renderPaletteHero() {
  document.getElementById('paletteHeroStrip').innerHTML =
    state.colors.map(c => `<div style="background:${c.hex}" title="${c.name}"></div>`).join('');
  document.getElementById('paletteHeroNames').innerHTML =
    state.colors.map(c => `<span class="palette-hero-name"><span class="mini-swatch" style="background:${c.hex}"></span>${c.name}</span>`).join('');
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
  const kwRaw = ['romantic','garden','rustic','vintage','bohemian','modern','elegant','floral','candlelit','outdoor','sunset','golden','linen','intimate','wildflower','eucalyptus','arch','canopy','fairy lights','marquee','beach','mountains','forest','minimalist','luxe','opulent'];
  const found = kwRaw.filter(kw => text.toLowerCase().includes(kw));
  document.getElementById('moodKeywords').innerHTML = found.map(kw => `<span class="mood-kw">${kw}</span>`).join('');
}

// ── Honeymoon ──
function initHoneymoon() { renderPackPresets(); }

function saveHoneymoon() {
  const dest = document.getElementById('hmDest').value.trim();
  const depart = document.getElementById('hmDepart').value;
  const ret = document.getElementById('hmReturn').value;
  const budget = parseFloat(document.getElementById('hmBudget').value) || 0;
  const accom = document.getElementById('hmAccom').value;
  const style = document.getElementById('hmStyle').value;
  const notes = document.getElementById('hmNotes').value.trim();
  if (!dest) { alert('Please enter a destination!'); return; }
  let nights = '—';
  if (depart && ret) nights = Math.max(0, Math.ceil((new Date(ret) - new Date(depart)) / (1000*60*60*24)));
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
  document.getElementById('packList').innerHTML = state.packItems.map(item => `
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
