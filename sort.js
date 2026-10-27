// Shared sorting logic, loaded by the popup, the new tab and the background worker.
//
// Tasks are kept ordered by deadline: soonest first (lowest days left, most overdue
// at the top), tasks with no deadline last. Date strings are YYYY-MM-DD, so plain
// string comparison sorts them correctly. Array.prototype.sort is stable, so tasks
// that share a deadline keep whatever order they were dragged into.
function sortTasks(list) {
  return list.slice().sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
  });
}
