export const statuses = ['Ungraded', 'Graded', 'Missing', 'Excused'];

export function validate(record) {
  for (const key of ['id', 'course', 'title', 'source']) {
    if (typeof record?.[key] !== 'string' || !record[key].trim()) {
      throw new Error('My record is missing ' + key + '.');
    }
  }
  if (!statuses.includes(record.status) || typeof record.done !== 'boolean') {
    throw new Error('My record needs a valid grade and completion status.');
  }
  if (record.status === 'Graded') {
    if (!Number.isFinite(record.score) || record.score < 0 || record.score > 100) {
      throw new Error('My score must be between 0 and 100.');
    }
  } else if (record.score !== null) {
    throw new Error('I can enter a score once I mark this work as graded.');
  }
  if (typeof record.due !== 'string' || (record.due && (!/^\d{4}-\d{2}-\d{2}$/.test(record.due) ||
      new Date(record.due).toISOString().slice(0,10) !== record.due))) {
    throw new Error('My due date must be a valid calendar date.');
  }
  return record;
}

export function unpack(text) {
  const data = JSON.parse(text);
  if (data.version !== 1 || !Array.isArray(data.records)) throw new Error('I need a Compass version 1 backup to import records.');
  return data.records.map(validate);
}
