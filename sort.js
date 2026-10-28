// Shared sorting logic, loaded by the popup, the new tab and the background worker.
//
// Tasks are kept ordered by deadline: soonest first (lowest days left, most overdue
// at the top), tasks with no deadline last. On the same day, tasks with a time come
// in time order, and a date-only task counts as due at the end of that day.
// Keys look like YYYY-MM-DDTHH:MM, so plain string comparison sorts them correctly.
// Array.prototype.sort is stable, so tasks with an identical deadline keep whatever
// order they were dragged into.
function deadlineKey(t) {
  return t.deadline ? t.deadline + 'T' + (t.time || '23:59') : '';
}

function sortTasks(list) {
  return list.slice().sort((a, b) => {
    const ka = deadlineKey(a);
    const kb = deadlineKey(b);
    if (!ka && !kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}
