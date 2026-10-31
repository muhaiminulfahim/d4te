<p align="center">
  <img src="icons/icon128.png" alt="d4te icon" width="96" height="96">
</p>

<h1 align="center">d4te</h1>

Chromium-based browser extension aid for ADHD time-blind people. To make your deadlines visible, accessible, color-coded.

No login. Fully offline. Everything stays in your browser.

> **Download:** d4te v1.0.3 is listed on [GitHub Releases](https://github.com/muhaiminulfahim/d4te/releases). Grab the latest build there.

## Features

- **New tab dashboard:** a centered clock, date, and all your tasks.
- **Sorted by days left:** tasks are ordered automatically from the lowest days left (most overdue) to the highest. Tasks with no deadline go last.
- **Fuel gauge:** each task shows a 10-block gauge and the exact days left.
- **Optional time:** give a deadline a time of day. Tasks due the same day are ordered by time.
- **Hours countdown:** when a task has a time and less than a day is left, d4te counts hours and minutes (like `3h 20m left`) instead of days. It also shows `overdue` the same way for the first day after the deadline passes.
- **Right-click to add:** select text on any webpage, right-click, and send it straight to d4te as a task.
- **Descriptions:** add a short note to any task, from the popup or directly on the new tab.
- **Deadlines on the tab:** set, change or clear a deadline right on the new tab. Tasks can start with no deadline.
- **Quick add:** click the extension icon, enter a task name (and optionally a deadline, time and note), done.
- **Edit anytime:** change a task's name, deadline or description from the popup without deleting it.
- **Drag-and-drop ordering:** reorder tasks that share the same deadline; your order is saved.
- **Mark as done:** tick the circle next to a task to complete it. Open **Completed (n)** at the bottom of the new tab to review finished tasks, bring one back with ↺, or delete it for good.
- **JSON file backup:** your tasks are mirrored to a JSON file in a folder you choose, so a reinstall, a new browser profile or a new computer never loses them. See [Data & backup](#data--backup).
- **One file per browser profile:** every browser profile gets its own JSON file, so profiles never overwrite each other, even in the same folder.
- **Instant sync:** the new tab updates the moment you add, edit, reorder, complete or delete a task.
- **Private:** data stays on your device, in the browser and in the folder you pick.
- **Works everywhere Chromium does:** Chrome, Brave, Edge, Opera (Manifest V3).
- **Light and dark:** follows your system theme.

## Color rules

| Days left                         | Gauge     |
| --------------------------------- | --------- |
| 7 or more                         | 🟩 Green  |
| 3 to 6                            | 🟨 Yellow |
| 2 or fewer, due today, or overdue | 🟥 Red    |
| No deadline set                   | ⬜ Empty  |

The gauge fills one block per day, up to 10. Overdue and due-today tasks show a full red gauge.

## Install (unpacked)

1. Download the latest build from [GitHub Releases](https://github.com/muhaiminulfahim/d4te/releases) and unzip it, or clone this repository:
   ```
   git clone https://github.com/muhaiminulfahim/d4te.git
   ```
2. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).
5. Pin d4te from the extensions menu, then open a new tab.

If Chrome asks "Change back to Google?", choose **Keep it**. Only one extension can control the new tab at a time, so disable any other new-tab extension.

## Usage

### Add a task

- **From the popup:** click the d4te icon, enter a **task name**, optionally a **deadline**, a **time** (available once a date is set) and a **description**, then click **Add Task**.
- **From any webpage:** select some text, right-click, and choose **Add "…" to d4te**. The toolbar icon flashes a ✓. Selections longer than 120 characters are shortened for the task name, and the full text is kept in the description.

### On the new tab

- **Set or change a deadline:** click **+ Set deadline** (or the existing date), pick a day, optionally a time, then press `Enter` or click **✓**. `Esc` or a click elsewhere cancels. Clear the date to remove the deadline and its time.
- **Add or edit a note:** hover a task and click **+ note**, or click the existing note. Press `Ctrl/Cmd + Enter` or click away to save, and `Esc` to cancel.
- **Reorder:** drag a task card and drop it above or below another task with the same deadline. A line shows where it will land. Tasks with different deadlines are kept in deadline order automatically.
- **Complete:** click the circle next to the task name. Completed tasks move to **Completed (n)** at the bottom, newest first.
- **Delete:** click the **×** button.

### Edit from the popup

Click the **✎** button next to a task, change its name, deadline, time or description, then click **Save changes** (or **Cancel**). The task keeps its position.

## Data & backup

Tasks are kept in the browser's extension storage and also mirrored to a JSON file you control.

**Set it up once per browser profile**
1. Click the d4te icon, then **Data & backup** (or use the link at the bottom of the new tab).
2. Click **Choose folder** and pick or create a folder such as `Documents/d4te`. Browsers don't allow Desktop, Documents or Downloads themselves.
3. From then on every change is saved automatically to `d4te-<profile>-<id>.json` in that folder, and the previous version is kept as `...prev.json`.

**Moving to a new browser, profile or computer**
1. Install d4te and open **Data & backup**.
2. Choose the same folder (sync or copy it across machines with your cloud drive if you like).
3. Pick the backup to **Restore**. Your tasks, completed tasks and profile come back, and d4te keeps updating that same file. Restoring twice never creates duplicates.

**Good to know**
- Nothing is written until setup is finished, so a fresh install can never overwrite a good backup with an empty list.
- Browsers can ask for folder permission again after a restart. d4te shows a small **Reconnect** link on the new tab when that happens, and saving resumes after one click.
- Each browser profile has its own id and file. Rename a profile on the Data page (the file name doesn't change).
- You can also **Export** and **Import** a `.json` by hand from the same page. Import only adds tasks, it never overwrites.
- The file is plain JSON:
  ```json
  { "format": "d4te-backup", "version": 2, "exportedAt": "…",
    "profile": { "id": "…", "name": "…", "file": "…" },
    "tasks": [ { "id": "…", "name": "…", "deadline": "2026-11-02", "time": "09:00",
                 "description": "", "done": false, "completedAt": "" } ] }
  ```

## Project structure

```
d4te/
├── manifest.json   # Manifest V3: popup, new tab override, background worker
├── background.js   # Right-click "Add to d4te" context menu, background auto-save
├── sort.js         # Shared deadline sorting, soonest first
├── log.js          # Activity log (add, edit, reorder, complete, delete)
├── backup.js       # JSON backup format: build, parse, merge
├── sync.js         # Folder connection and per-profile auto-save
├── data.html       # Data & backup page (choose folder, restore, export/import)
├── data.js         # Logic for the Data & backup page
├── popup.html      # Task input UI
├── popup.js        # Add/edit/delete logic for the popup
├── newtab.html     # Dashboard markup
├── newtab.css      # Dashboard styling
├── newtab.js       # Days-left calculation, gauge, inline editing, drag-and-drop, completed list
├── icons/          # Extension icons (16, 32, 48, 128, 512)
├── LICENSE
└── README.md
```

## Permissions

- `storage`: saves your tasks locally via `chrome.storage.local`.
- `contextMenus`: adds the right-click "Add to d4te" option for selected text.

The JSON backup uses the browser's folder picker, which needs no extra permission: d4te can only touch the one folder you choose.

d4te makes no network requests and collects no data.

## Notes

- **The footer strip on the new tab** ("Customize Chrome" and the extension name) is added by Chrome to any extension-controlled new tab. Extensions can't remove or restyle it. Brave, Edge and Opera don't show it.
- Sorting is applied whenever tasks are saved (from the popup, the right-click menu, or the new tab), using a shared `sort.js`. Tasks with the same deadline keep the order you gave them, and new tasks go below the others with that deadline.
- Days left are counted in whole calendar days using your local time zone, and refresh automatically at midnight.
- Tasks with a time refresh every minute so the hours countdown stays current. A date-only deadline counts as due at the end of that day when sorting.
- Drag-and-drop works among tasks with the same deadline and time.

## Contributing

Issues and pull requests are welcome. The project is plain HTML, CSS and JavaScript with no build step: edit the files, then reload the extension from your browser's extensions page.

## License

Released under the [MIT License](LICENSE).

## Author

Made by [Muhaiminul Islam Khan](https://github.com/muhaiminulfahim/).
