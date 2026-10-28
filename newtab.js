const BLOCKS = 10;           // number of gauge segments
const store = chrome.storage.local;

const tasksEl = document.getElementById('tasks');
const clockEl = document.getElementById('clock');
const todayEl = document.getElementById('today');

let dragId = null;
let dragGroup = null;
let hasTimed = false; // any task with a time set? then refresh every minute

// Whole calendar days between today (local) and the deadline (local midnight).
function daysLeft(deadlineISO) {
  const [y, m, d] = deadlineISO.split('-').map(Number);
  const deadline = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((deadline - today) / 86400000);
}

// Deadline as a Date, using the optional time of day (date only = start of that day).
function deadlineAt(t) {
  const [y, m, d] = t.deadline.split('-').map(Number);
  const [hh, mm] = t.time ? t.time.split(':').map(Number) : [0, 0];
  return new Date(y, m - 1, d, hh, mm);
}

// A task with a time set and less than a day to go (or less than a day overdue)
// counts hours and minutes instead of days. Returns null otherwise.
function hoursInfo(t) {
  if (!t.deadline || !t.time) return null;
  const ms = deadlineAt(t) - new Date();
  if (Math.abs(ms) >= 86400000) return null;
  const mins = Math.floor(Math.abs(ms) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const num = h ? (m ? `${h}h ${m}m` : `${h}h`) : (mins ? `${m}m` : '<1m');
  return { num, unit: ms >= 0 ? 'left' : 'overdue', overdue: ms < 0 };
}

function prettyTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Green >= 7, Yellow 3..6, Red < 3 (incl. overdue), none = no deadline set
function level(days) {
  if (days === null) return 'none';
  if (days >= 7) return 'green';
  if (days >= 3) return 'yellow';
  return 'red';
}

function filledBlocks(days) {
  return Math.max(0, Math.min(BLOCKS, days));
}

function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

function daysLabel(days) {
  if (days === null) return { num: '—', unit: 'no deadline' };
  if (days < 0) return { num: String(Math.abs(days)), unit: Math.abs(days) === 1 ? 'day overdue' : 'days overdue' };
  if (days === 0) return { num: '0', unit: 'due today' };
  return { num: String(days), unit: days === 1 ? 'day left' : 'days left' };
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

async function updateTask(id, patch) {
  const cur = (await store.get('tasks')).tasks || [];
  await store.set({ tasks: sortTasks(cur.map(x => (x.id === id ? { ...x, ...patch } : x))) });
}

// Move item `dragId` before/after `targetId`.
function reorder(list, dragId, targetId, after) {
  const from = list.findIndex(t => t.id === dragId);
  if (from < 0) return list;
  const [item] = list.splice(from, 1);
  const to = list.findIndex(t => t.id === targetId);
  if (to < 0) { list.push(item); return list; }
  list.splice(after ? to + 1 : to, 0, item);
  return list;
}

function clearMarks() {
  tasksEl.querySelectorAll('.drop-before, .drop-after').forEach(n => n.classList.remove('drop-before', 'drop-after'));
}

// Tasks are sorted by deadline, so they can only be reordered among tasks
// that share the same deadline (groupKey).
function attachDrag(card, t, groupKey) {
  card.draggable = true;

  card.addEventListener('dragstart', (e) => {
    dragId = t.id;
    dragGroup = groupKey;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', t.id);
    // let the browser snapshot the card before dimming it
    requestAnimationFrame(() => card.classList.add('dragging'));
  });

  card.addEventListener('dragover', (e) => {
    if (!dragId || dragId === t.id || dragGroup !== groupKey) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const r = card.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    clearMarks();
    card.classList.add(after ? 'drop-after' : 'drop-before');
  });

  card.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (!dragId || dragId === t.id || dragGroup !== groupKey) return;
    const r = card.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    const id = dragId;
    dragId = null;
    clearMarks();
    const cur = (await store.get('tasks')).tasks || [];
    await store.set({ tasks: sortTasks(reorder(cur.slice(), id, t.id, after)) });
    // storage.onChanged re-renders the list
  });

  card.addEventListener('dragend', () => {
    dragId = null;
    dragGroup = null;
    card.classList.remove('dragging');
    clearMarks();
  });
}

// Click the date (or "+ Set deadline") to pick or change the deadline and time
// right on the tab. Enter or the ✓ button saves, Esc or a click elsewhere cancels.
function editDeadline(t, card, trigger) {
  card.draggable = false; // lets the fields behave normally inside the card

  const wrap = el('span', 'editor');
  const dateInp = document.createElement('input');
  dateInp.type = 'date';
  dateInp.className = 'dateinput';
  dateInp.value = t.deadline || '';
  const timeInp = document.createElement('input');
  timeInp.type = 'time';
  timeInp.className = 'timeinput';
  timeInp.title = 'Time (optional)';
  timeInp.value = t.deadline ? (t.time || '') : '';
  timeInp.disabled = !dateInp.value;
  const ok = el('button', 'savebtn', '✓');
  ok.type = 'button';
  ok.title = 'Save';
  wrap.append(dateInp, timeInp, ok);
  trigger.replaceWith(wrap);
  dateInp.focus();
  try { dateInp.showPicker(); } catch (_) { /* older browsers: field is still usable */ }

  let done = false;
  const finish = async (save) => {
    if (done) return;
    done = true;
    document.removeEventListener('mousedown', outside, true);
    if (save) {
      const deadline = dateInp.value;
      const time = deadline ? timeInp.value : '';
      if (deadline !== (t.deadline || '') || time !== (t.time || '')) await updateTask(t.id, { deadline, time });
    }
    render();
  };
  // Clicks inside the native picker popups don't reach the document,
  // so a click anywhere outside the editor means "cancel".
  const outside = (e) => { if (!wrap.contains(e.target)) finish(false); };
  document.addEventListener('mousedown', outside, true);

  dateInp.addEventListener('input', () => {
    timeInp.disabled = !dateInp.value;
    if (!dateInp.value) timeInp.value = '';
  });
  dateInp.addEventListener('change', () => { if (dateInp.value) timeInp.focus(); });
  ok.addEventListener('click', () => finish(true));
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') finish(false);
    else if (e.key === 'Enter') { e.preventDefault(); finish(true); }
  });
}

// Click the note (or "+ note") to write or edit the description on the tab.
function editDescription(t, card, info, existing) {
  card.draggable = false;
  const ta = document.createElement('textarea');
  ta.className = 'descinput';
  ta.rows = 3;
  ta.maxLength = 2000;
  ta.placeholder = 'Notes, links, details…';
  ta.value = t.description || '';
  if (existing) existing.replaceWith(ta); else info.appendChild(ta);
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  let done = false;
  const finish = async () => {
    if (done) return;
    done = true;
    const v = ta.value.trim();
    if (v !== (t.description || '')) await updateTask(t.id, { description: v });
    render();
  };
  ta.addEventListener('blur', finish);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { ta.value = t.description || ''; ta.blur(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ta.blur();
  });
}

async function render() {
  const { tasks } = await store.get('tasks');
  const list = sortTasks(Array.isArray(tasks) ? tasks : []); // soonest deadline first

  tasksEl.textContent = '';
  hasTimed = false;

  for (const t of list) {
    const hasDeadline = !!t.deadline;
    const days = hasDeadline ? daysLeft(t.deadline) : null;
    const lvl = level(days);
    const hrs = hoursInfo(t);
    const lbl = hrs || daysLabel(days);
    if (hasDeadline && t.time) hasTimed = true;

    const card = el('article', `task ${lvl}`);

    const info = el('div', 'info');
    const titleRow = el('div', 'titlerow');
    const grip = el('span', 'grip', '⋮⋮');
    grip.setAttribute('aria-hidden', 'true');
    const name = el('div', 'name', t.name);
    name.title = t.name;
    titleRow.append(grip, name);

    const due = el('div', 'due');
    const dueBtn = el('button', 'linkbtn' + (hasDeadline ? '' : ' accent'), hasDeadline ? prettyDate(t.deadline) + (t.time ? ' · ' + prettyTime(t.time) : '') : '+ Set deadline');
    dueBtn.title = hasDeadline ? 'Change deadline' : 'Set a deadline';
    dueBtn.addEventListener('click', () => editDeadline(t, card, dueBtn));
    due.appendChild(dueBtn);

    info.append(titleRow, due);

    if (t.description) {
      const desc = el('div', 'desc', t.description);
      desc.title = 'Click to edit';
      desc.addEventListener('click', () => editDescription(t, card, info, desc));
      info.appendChild(desc);
    } else {
      const addNote = el('button', 'linkbtn faint', '+ note');
      addNote.title = 'Add a description';
      addNote.addEventListener('click', () => editDescription(t, card, info, null));
      due.appendChild(addNote);
    }

    const gaugeWrap = el('div', 'gauge-wrap');
    const gauge = el('div', `gauge ${lvl}`);
    gauge.setAttribute('role', 'img');
    gauge.setAttribute('aria-label', `${lbl.num} ${lbl.unit}`);
    const on = hasDeadline ? filledBlocks(days) : 0;
    for (let i = 0; i < BLOCKS; i++) {
      gauge.appendChild(el('i', i < on ? 'on' : ''));
    }
    // Overdue / due today: show the whole gauge as a red warning
    if (hasDeadline && (days <= 0 || (hrs && hrs.overdue))) {
      gauge.querySelectorAll('i').forEach(b => b.classList.add('on'));
      gauge.classList.add('red');
    }

    const daysEl = el('div', 'days');
    daysEl.append(el('b', '', lbl.num), el('span', '', lbl.unit));

    const del = el('button', 'del', '×');
    del.title = 'Delete task';
    del.addEventListener('click', async () => {
      const cur = (await store.get('tasks')).tasks || [];
      await store.set({ tasks: cur.filter(x => x.id !== t.id) });
    });

    gaugeWrap.append(gauge, daysEl, del);
    card.append(info, gaugeWrap);
    attachDrag(card, t, (t.deadline || '') + '|' + (t.time || ''));
    tasksEl.appendChild(card);
  }
}

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  todayEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

// Live updates when the popup or right-click menu adds/edits/deletes tasks
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tasks) render();
});

let lastDay = new Date().getDate();
let lastMinute = new Date().getMinutes();
setInterval(() => {
  tick();
  const now = new Date();
  const d = now.getDate();
  const m = now.getMinutes();
  const dayChanged = d !== lastDay;
  const minuteChanged = m !== lastMinute;
  lastDay = d;
  lastMinute = m;
  if (dayChanged) render(); // new day -> recompute
  else if (minuteChanged && hasTimed && !dragId && !tasksEl.querySelector('.editor, .descinput')) {
    render(); // keep the hours/minutes countdown fresh, but never interrupt an edit
  }
}, 1000);

tick();
render();
