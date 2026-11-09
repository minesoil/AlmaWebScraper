export const statuses = ['Ungraded', 'Graded', 'Missing', 'Excused'];

export function validate(record) {
  for (const key of ['id', 'course', 'title', 'source']) {
    if (typeof record?.[key] !== 'string' || !record[key].trim()) {
      throw new Error('Missing ' + key + '.');
    }
  }
  if (!statuses.includes(record.status) || typeof record.done !== 'boolean') {
    throw new Error('Invalid grade or completion status.');
  }
  if (record.status === 'Graded') {
    if (!Number.isFinite(record.score) || record.score < 0 || record.score > 100) {
      throw new Error('Enter a score from 0 to 100.');
    }
  } else if (record.score !== null) {
    throw new Error('Only graded work can have a score.');
  }
  if (typeof record.due !== 'string' || (record.due && (!/^\d{4}-\d{2}-\d{2}$/.test(record.due) ||
      new Date(record.due).toISOString().slice(0,10) !== record.due))) {
    throw new Error('Invalid due date.');
  }
  return record;
}

export function unpack(text) {
  const data = JSON.parse(text);
  if (data.version !== 1 || !Array.isArray(data.records)) throw new Error('Expected a Compass version 1 backup.');
  return data.records.map(validate);
}
