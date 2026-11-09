export const statuses = ['Ungraded', 'Graded', 'Missing', 'Excused'];

export function validate(record) {
  for (const key of ['id', 'course', 'title', 'source']) {
    if (typeof record?.[key] !== 'string' || !record[key].trim()) {
      throw new Error('Record is missing ' + key + '.');
    }
  }
  if (!statuses.includes(record.status) || typeof record.done !== 'boolean') {
    throw new Error('Choose a valid grade and completion status.');
  }
  if (record.status === 'Graded') {
    if (!Number.isFinite(record.score) || record.score < 0 || record.score > 100) {
      throw new Error('Score must be between 0 and 100.');
    }
  } else if (record.score !== null) {
    throw new Error('A score requires graded status.');
  }
  if (typeof record.due !== 'string' || (record.due && (!/^\d{4}-\d{2}-\d{2}$/.test(record.due) ||
      new Date(record.due).toISOString().slice(0,10) !== record.due))) {
    throw new Error('Enter a valid due date.');
  }
  return record;
}

export function unpack(text) {
  const data = JSON.parse(text);
  if (data.version !== 1 || !Array.isArray(data.records)) throw new Error('Choose a Compass version 1 backup.');
  return data.records.map(validate);
}


export function schoolDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}

export function matchesFilters(record, filters, today) {
  if (filters.course && record.course !== filters.course) return false;
  if (filters.work === 'open' && record.done) return false;
  if (filters.work === 'done' && !record.done) return false;
  if (filters.work === 'overdue' && (record.done || !record.due || record.due >= today)) return false;
  return (record.title + ' ' + record.course).toLowerCase().includes(filters.query.trim().toLowerCase());
}

export function courseSummaries(records) {
  return [...new Set(records.map(record => record.course))].sort().map(course => {
    const items = records.filter(record => record.course === course);
    const scores = items.filter(record => record.status === 'Graded').map(record => record.score);
    return {course, open:items.filter(record => !record.done).length,
      graded:scores.length, low:Math.min(...scores), high:Math.max(...scores)};
  });
}
