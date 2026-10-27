const form = document.getElementById('form');
const nameEl = document.getElementById('name');
const dateEl = document.getElementById('date');
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

async function getTasks() {
  const { tasks } = await store.get('tasks');
  return Array.isArray(tasks) ? tasks : [];
}

async function render() {
  const tasks = await getTasks(); // stored order = order shown on the new tab
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
    date.textContent = t.deadline || 'no deadline';

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
  const description = descEl.value.trim();
  if (!name) {
    errorEl.textContent = 'Enter a task name.';
    return;
  }
  const tasks = await getTasks();
  const idx = editingId ? tasks.findIndex(x => x.id === editingId) : -1;
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], name, deadline, description }; // edit in place, keep position
  } else {
    tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, deadline, description });
  }
  await store.set({ tasks });
  resetForm();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tasks) render();
});

// Git repo link
const REPO_URL = 'https://github.com/muhaiminulfahim/d4te';
const repoEl = document.getElementById('repo');
repoEl.href = REPO_URL;
repoEl.textContent = 'github/d4te';

dateEl.value = todayISO();
nameEl.focus();
render();
