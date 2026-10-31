importScripts('sort.js', 'log.js', 'backup.js', 'sync.js');

startAutoSync(); // mirror every change to the JSON file (once a folder is connected)

const MENU_ID = 'd4te-add-selection';
const NAME_MAX = 120;
const DESC_MAX = 2000;

function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Add "%s" to d4te',
      contexts: ['selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenu);
chrome.runtime.onStartup.addListener(createMenu);

function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1800);
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;

  const text = (info.selectionText || '').replace(/\s+/g, ' ').trim();
  if (!text) return;

  // Short selections become the task name. Long ones are truncated for the
  // name, and the full text is kept in the description.
  const long = text.length > NAME_MAX;
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: long ? text.slice(0, NAME_MAX - 1).trimEnd() + '…' : text,
    deadline: '',
    time: '',
    description: long ? text.slice(0, DESC_MAX) : ''
  };

  const { tasks } = await chrome.storage.local.get('tasks');
  const list = Array.isArray(tasks) ? tasks : [];
  list.push(task);
  await chrome.storage.local.set({ tasks: sortTasks(list) });
  await logEvent('add', 'context-menu', task, { data: { deadline: '', time: '', description: logShort(task.description) } });

  flashBadge('✓', '#22c55e');
});
