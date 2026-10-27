<p align="center">
  <img src="icons/icon128.png" alt="d4te icon" width="96" height="96">
</p>

<h1 align="center">d4te</h1>

A tiny, local-first deadline tracker that replaces your new tab with a clean dashboard of tasks, each with a car-style fuel gauge showing how much time is left.

No login. No servers. No tracking. Everything stays in your browser.

> **Download:** d4te v1.0.0 is listed on [GitHub Releases](https://github.com/muhaiminulfahim/d4te/releases). Grab the latest build there.

## Features

- **New tab dashboard:** a centered clock, date, and all your tasks in the order you choose.
- **Fuel gauge:** each task shows a 10-block gauge and the exact days left.
- **Right-click to add:** select text on any webpage, right-click, and send it straight to d4te as a task.
- **Descriptions:** add a short note to any task, from the popup or directly on the new tab.
- **Deadlines on the tab:** set, change or clear a deadline right on the new tab. Tasks can start with no deadline.
- **Quick add:** click the extension icon, enter a task name (and optionally a deadline and note), done.
- **Edit anytime:** change a task's name, deadline or description from the popup without deleting it.
- **Drag-and-drop ordering:** reorder tasks on the new tab; your order is saved.
- **Instant sync:** the new tab updates the moment you add, edit, reorder or delete a task.
- **Private:** data lives in `chrome.storage.local` on your device only.
- **Works everywhere Chromium does:** Chrome, Brave, Edge, Opera (Manifest V3).
- **Light and dark:** follows your system theme.

## Color rules

| Days left | Gauge |
|-----------|-------|
| 7 or more | 🟩 Green |
| 3 to 6 | 🟨 Yellow |
| 2 or fewer, due today, or overdue | 🟥 Red |
| No deadline set | ⬜ Empty |

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
- **From the popup:** click the d4te icon, enter a **task name**, optionally a **deadline** and **description**, then click **Add Task**.
- **From any webpage:** select some text, right-click, and choose **Add "…" to d4te**. The toolbar icon flashes a ✓. Selections longer than 120 characters are shortened for the task name, and the full text is kept in the description.

### On the new tab
- **Set or change a deadline:** click **+ Set deadline** (or the existing date) and pick a day. Clear the date in the picker to remove it.
- **Add or edit a note:** hover a task and click **+ note**, or click the existing note. Press `Ctrl/Cmd + Enter` or click away to save, and `Esc` to cancel.
- **Reorder:** drag a task card and drop it above or below another. A line shows where it will land.
- **Delete:** click the **×** button.

### Edit from the popup
Click the **✎** button next to a task, change its name, deadline or description, then click **Save changes** (or **Cancel**). The task keeps its position.

## Project structure

```
d4te/
├── manifest.json   # Manifest V3: popup, new tab override, background worker
├── background.js   # Right-click "Add to d4te" context menu
├── popup.html      # Task input UI
├── popup.js        # Add/edit/delete logic for the popup
├── newtab.html     # Dashboard markup
├── newtab.css      # Dashboard styling
├── newtab.js       # Days-left calculation, gauge, inline editing, drag-and-drop
├── icons/          # Extension icons (16, 32, 48, 128, 512)
├── LICENSE
└── README.md
```

## Permissions

- `storage`: saves your tasks locally via `chrome.storage.local`.
- `contextMenus`: adds the right-click "Add to d4te" option for selected text.

d4te makes no network requests and collects no data.

## Notes

- **The footer strip on the new tab** ("Customize Chrome" and the extension name) is added by Chrome to any extension-controlled new tab. Extensions can't remove or restyle it. Brave, Edge and Opera don't show it.
- Tasks are **not** auto-sorted by deadline. New tasks are added to the bottom, and the order you drag them into is the order saved.
- Days left are counted in whole calendar days using your local time zone, and refresh automatically at midnight.

## Contributing

Issues and pull requests are welcome. The project is plain HTML, CSS and JavaScript with no build step: edit the files, then reload the extension from your browser's extensions page.

## License

Released under the [MIT License](LICENSE).

## Author

Made by [Muhaiminul Islam Khan (Fahim)](https://github.com/muhaiminulfahim/).
