const form = document.getElementById('form');
const nameEl = document.getElementById('name');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const descEl = document.getElementById('desc');
const errorEl = document.getElementById('error');
const listEl = document.getElementById('list');
const submitBtn = document.getElementById('submit');
const cancelBtn = document.getElementById('cancel');

const store = chrome.storage.local;
let editingId = null;

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// A time only makes sense with a date, so the time field is off until one is picked.
function syncTime() {
  timeEl.disabled = !dateEl.value;
  if (!dateEl.value) timeEl.value = '';
}
dateEl.addEventListener('input', syncTime);

async function getTasks() {
  const { tasks } = await store.get('tasks');
  return Array.isArray(tasks) ? tasks : [];
}

async function render() {
  const tasks = sortTasks(await getTasks()).filter(t => !t.done); // open tasks only; completed ones live on the new tab
  listEl.textContent = '';
  for (const t of tasks) {
    const row = document.createElement('div');
    row.className = 'item' + (t.id === editingId ? ' editing' : '');

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = t.name;
    name.title = t.name;

    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = t.deadline ? t.deadline + (t.time ? ' ' + t.time : '') : 'no deadline';

    const edit = document.createElement('button');
    edit.className = 'edit';
    edit.textContent = '✎';
    edit.title = 'Edit task';
    edit.addEventListener('click', () => startEdit(t));

    const del = document.createElement('button');
    del.textContent = '×';
    del.title = 'Delete task';
    del.addEventListener('click', async () => {
      const next = (await getTasks()).filter(x => x.id !== t.id);
      await store.set({ tasks: next });
      await logEvent('delete', 'popup', t, { data: { deadline: t.deadline || '', time: t.time || '' } });
      if (editingId === t.id) resetForm();
      else render();
    });

    row.append(name, date, edit, del);
    listEl.appendChild(row);
  }
}

function startEdit(t) {
  editingId = t.id;
  nameEl.value = t.name;
  dateEl.value = t.deadline || '';
  syncTime();
  timeEl.value = t.deadline ? (t.time || '') : '';
  descEl.value = t.description || '';
  submitBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;
  errorEl.textContent = '';
  nameEl.focus();
  render();
}

function resetForm() {
  editingId = null;
  nameEl.value = '';
  dateEl.value = todayISO();
  timeEl.value = '';
  syncTime();
  descEl.value = '';
  submitBtn.textContent = 'Add Task';
  cancelBtn.hidden = true;
  errorEl.textContent = '';
  nameEl.focus();
  render();
}

cancelBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameEl.value.trim();
  const deadline = dateEl.value; // '' = no deadline yet
  const time = deadline ? timeEl.value : ''; // '' = no time, date only
  const description = descEl.value.trim();
  if (!name) {
    errorEl.textContent = 'Enter a task name.';
    return;
  }
  const tasks = await getTasks();
  const idx = editingId ? tasks.findIndex(x => x.id === editingId) : -1;
  let entry = null; // what to write to the activity log
  if (idx >= 0) {
    const before = tasks[idx];
    tasks[idx] = { ...before, name, deadline, time, description }; // edit in place, keep position
    const changes = diffTask(before, tasks[idx]);
    if (Object.keys(changes).length) entry = ['edit', tasks[idx], { changes }];
  } else {
    const created = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, deadline, time, description };
    tasks.push(created);
    entry = ['add', created, { data: { deadline, time, description: logShort(description) } }];
  }
  await store.set({ tasks: sortTasks(tasks) });
  if (entry) await logEvent(entry[0], 'popup', entry[1], entry[2]);
  resetForm();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.tasks) render();
  if (changes.log) updateLogButtons();
});

// ---- Activity log: download as JSON, or clear ----
const dlLogBtn = document.getElementById('dl-log');
const clearLogBtn = document.getElementById('clear-log');

async function getLog() {
  const { log } = await store.get('log');
  return Array.isArray(log) ? log : [];
}

async function updateLogButtons() {
  const n = (await getLog()).length;
  dlLogBtn.textContent = `Download log (${n})`;
  dlLogBtn.disabled = n === 0;
  clearLogBtn.disabled = n === 0;
}

dlLogBtn.addEventListener('click', async () => {
  const entries = await getLog();
  const payload = {
    app: 'd4te',
    version: chrome.runtime.getManifest().version,
    exportedAt: new Date().toISOString(),
    count: entries.length,
    entries
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `d4te-log-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Two clicks to clear, so a stray click can't wipe the log.
let clearTimer = null;
clearLogBtn.addEventListener('click', async () => {
  if (!clearTimer) {
    clearLogBtn.textContent = 'Click again to clear';
    clearTimer = setTimeout(() => { clearTimer = null; clearLogBtn.textContent = 'Clear'; }, 3000);
    return;
  }
  clearTimeout(clearTimer);
  clearTimer = null;
  clearLogBtn.textContent = 'Clear';
  await store.set({ log: [] });
});

// Git repo link
const REPO_URL = 'https://github.com/muhaiminulfahim/d4te';
const repoEl = document.getElementById('repo');
repoEl.href = REPO_URL;
repoEl.textContent = 'github/d4te';

dateEl.value = todayISO();
syncTime();
nameEl.focus();
render();
updateLogButtons();
startAutoSync(); // also mirror changes to the JSON file from here
