import {validate, unpack} from './records.js';

const key = 'compass.coursework.v1';
const form = document.querySelector('#entry');
const fields = form.elements;
const message = document.querySelector('#message');
let editing = null;
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
  if (!records.length) list.textContent = 'I haven’t added any assignments yet.';
  for (const item of records.sort((a,b)=>(a.due || 'z').localeCompare(b.due || 'z'))) {
    const row = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const detail = document.createElement('small');
    const grade = item.status === 'Graded' ? item.score + '%' : item.status;
    detail.textContent = [item.course, item.due || 'No due date', grade, item.done ? 'Complete' : 'Open', item.source].join(' · ');
    title.append(detail);
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.onclick = () => {
      editing = item.id;
      for (const name of ['title','course','due','status','score']) fields[name].value = item[name] ?? '';
      fields.done.checked = item.done;
      fields.score.disabled = item.status !== 'Graded';
      document.querySelector('#editor').textContent = 'Edit my assignment';
      fields.title.focus();
    };
    row.append(title, edit);
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
  document.querySelector('#editor').textContent = 'Add my assignment';
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
      status:fields.status.value, score:fields.score.disabled ? null : fields.score.valueAsNumber, done:fields.done.checked});
    save([...records.filter(row => row.id !== item.id), item]);
    form.reset();
    message.textContent = 'My assignment is saved on this device.';
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
    const incoming = unpack(await input.files[0].text());
    const records = read();
    const seen = new Set(records.map(item => item.id));
    const added = incoming.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    if (added.length && !confirm('Add ' + added.length + ' assignments to my coursework?')) return;
    save([...records,...added]);
    message.textContent =  'My import added ' + added.length + ' records and skipped ' + (incoming.length-added.length) + ' existing IDs.';
  } catch (error) { message.textContent = error.message; }
  finally { input.value = ''; }
};
window.addEventListener('storage', refresh);
refresh();
