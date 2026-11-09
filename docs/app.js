import {initStudyHub} from './study-hub.js';
import {validate, unpack, schoolDate, courseSummaries, matchesFilters, suggestWork} from './records.js';

const key = 'compass.coursework.v1';
const form = document.querySelector('#entry');
const fields = form.elements;
const message = document.querySelector('#message');
let editing = null;
let planIds = [];
function read() {
  const data = localStorage.getItem(key);
  return data === null ? [] : unpack(data);
}
function encode(records) {
  return JSON.stringify({version:1, records}, null, 2);
}
function render(records) {
  const list = document.querySelector('#records');
  list.replaceChildren();
  const courseFilter = document.querySelector('#course-filter');
  const selected = courseFilter.value;
  courseFilter.replaceChildren(new Option('All courses', ''));
  for (const course of [...new Set(records.map(item => item.course))].sort()) {
    courseFilter.add(new Option(course, course));
  }
  courseFilter.value = selected;
  document.querySelector('#course-names').replaceChildren(...[...new Set(records.map(item => item.course))].sort().map(course => new Option(course, course)));
  renderPlan(records);
  const today = schoolDate();
  const open = records.filter(item => !item.done);
  const overdue = open.filter(item => item.due && item.due < today);
  document.querySelector('#overview').textContent = open.length + ' open · ' + overdue.length + ' overdue · ' + records.filter(item => item.done).length + ' complete';
  const summaries = document.querySelector('#courses');
  summaries.replaceChildren();
  for (const summary of courseSummaries(records)) {
    const line = document.createElement('p');
    line.textContent = summary.course + ' — ' + summary.open + ' open · ' + summary.graded + ' graded' +
      (summary.graded ? ' · score range ' + summary.low + '–' + summary.high + '%' : '');
    summaries.append(line);
  }
  const filters = {course:courseFilter.value, work:document.querySelector('#work-filter').value, query:document.querySelector('#search').value};
  records = records.filter(item => matchesFilters(item, filters, today));
  if (!records.length) list.textContent = 'No assignments to show.';
  for (const item of records.sort((a,b)=>(a.due || 'z').localeCompare(b.due || 'z'))) {
    const row = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const detail = document.createElement('small');
    const grade = item.status === 'Graded' ? item.score + '%' : item.status;
    detail.textContent = [item.course, item.due ? item.due + (!item.done && item.due < today ? ' · Overdue' : '') : 'No due date', grade, item.done ? 'Complete' : 'Open', item.source, item.minutes ? item.minutes + ' min estimated' : 'No estimate', item.firstStep || ''].filter(Boolean).join(' · ');
    title.append(detail);
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.onclick = () => {
      editing = item.id;
      for (const name of ['title','course','due','status','score','minutes','firstStep']) fields[name].value = item[name] ?? '';
      fields.done.checked = item.done;
      fields.score.disabled = item.status !== 'Graded';
      fields.score.required = !fields.score.disabled;
      document.querySelector('#editor').textContent = 'Edit assignment';
      fields.title.focus();
    };
    const actions = document.createElement('div');
    actions.className = 'actions';
    const toggle = document.createElement('button');
    toggle.textContent = item.done ? 'Reopen' : 'Complete';
    toggle.onclick = () => {
      try {
        save(read().map(record => record.id === item.id ? {...record, done:!record.done} : record));
        message.textContent = item.done ? 'Assignment reopened.' : 'Assignment completed.';
      } catch (error) { message.textContent = error.message; }
    };
    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.onclick = () => {
      if (!confirm('Delete “' + item.title + '”?')) return;
      try {
        save(read().filter(record => record.id !== item.id));
        if (editing === item.id) form.reset();
        message.textContent = 'Assignment deleted.';
      } catch (error) { message.textContent = error.message; }
    };
    actions.append(toggle, edit, remove);
    row.append(title, actions);
    list.append(row);
  }
}
function refresh() {
  try { render(read()); } catch (error) { message.textContent = error.message; }
}
function save(records) {
  localStorage.setItem(key, encode(records));
  render(records);
}
form.onreset = () => {
  editing = null;
  fields.score.disabled = true;
  fields.score.required = false;
  document.querySelector('#editor').textContent = 'Add assignment';
};
fields.status.onchange = () => {
  fields.score.disabled = fields.status.value !== 'Graded';
  fields.score.required = !fields.score.disabled;
};
form.onsubmit = event => {
  event.preventDefault();
  try {
    const records = read();
    const old = records.find(item => item.id === editing);
    const item = validate({id:editing ?? crypto.randomUUID(), source:old?.source ?? 'Manual entry',
      course:fields.course.value.trim(), title:fields.title.value.trim(), due:fields.due.value,
      minutes:fields.minutes.value === '' ? null : fields.minutes.valueAsNumber, firstStep:fields.firstStep.value.trim(),
      status:fields.status.value, score:fields.score.disabled ? null : fields.score.valueAsNumber, done:fields.done.checked});
    save([...records.filter(row => row.id !== item.id), item]);
    form.reset();
    message.textContent = 'Assignment saved.';
  } catch (error) { message.textContent = error.message; }
};
document.querySelector('#export').onclick = () => {
  try {
    const url = URL.createObjectURL(new Blob([encode(read())], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compass-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { message.textContent = error.message; }
};
document.querySelector('#import').onchange = async event => {
  const input = event.target;
  try {
    if (!input.files.length) return;
    const incoming = unpack(await input.files[0].text());
    const records = read();
    const seen = new Set(records.map(item => item.id));
    const added = incoming.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    if (added.length && !confirm('Add ' + added.length + ' assignments from this backup?')) return;
    save([...records,...added]);
    message.textContent =  'Imported ' + added.length + ' records and skipped ' + (incoming.length-added.length) + ' existing IDs.';
  } catch (error) { message.textContent = error.message; }
  finally { input.value = ''; }
};
for (const id of ['course-filter', 'work-filter', 'search']) {
  document.getElementById(id).addEventListener('input', refresh);
}
window.addEventListener('storage', refresh);
refresh();


function renderPlan(records) {
  const panel = document.querySelector('#plan');
  panel.replaceChildren();
  const chosen = records.filter(item => planIds.includes(item.id) && !item.done);
  planIds = chosen.map(item => item.id);
  const total = chosen.reduce((sum, item) => sum + item.minutes, 0);
  const budget = Number(document.querySelector('#budget').value);
  const unknown = records.filter(item => !item.done && !item.minutes).length;
  const status = document.querySelector('#plan-status');
  status.textContent = total + ' / ' + budget + ' minutes selected.' +
    (total > budget ? ' Over budget — reduce the selection or adjust estimates.' : '') +
    (unknown ? ' ' + unknown + ' open assignments need estimates.' : '');
  for (const item of records.filter(item => !item.done && item.minutes)
      .sort((a,b) => (a.due || '9999').localeCompare(b.due || '9999'))) {
    const row = document.createElement('article');
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = planIds.includes(item.id);
    check.onchange = () => {
      planIds = check.checked ? [...planIds, item.id] : planIds.filter(id => id !== item.id);
      renderPlan(read());
    };
    label.append(check, document.createTextNode(' ' + item.title + ' · ' + item.minutes + ' min'));
    const reason = document.createElement('small');
    reason.textContent = item.course + ' · ' + (item.due ? 'Due ' + item.due : 'No deadline') +
      (item.firstStep ? ' · Start with ' + item.firstStep : '');
    label.append(reason);
    row.append(label);
    panel.append(row);
  }
}
document.querySelector('#suggest').onsubmit = event => {
  event.preventDefault();
  try {
    planIds = suggestWork(read(), Number(document.querySelector('#budget').value));
    renderPlan(read());
  } catch (error) { document.querySelector('#plan-status').textContent = error.message; }
};
document.querySelector('#budget').oninput = () => {
  try { renderPlan(read()); } catch (error) { message.textContent = error.message; }
};

initStudyHub(read);
