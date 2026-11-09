const settingsKey = 'compass.drive.settings.v1';
const scope = 'https://www.googleapis.com/auth/drive.metadata.readonly';

export function folderId(value) {
  const match = value.trim().match(/^(?:https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/)?([A-Za-z0-9_-]+)(?:[?#].*)?$/);
  if (!match) throw new Error('Enter a Google Drive folder link or ID.');
  return match[1];
}

export function studyRequest(question, assignments, files) {
  const work = assignments.filter(item => !item.done).map(item =>
    '- ' + item.course + ': ' + item.title + ' | due ' + (item.due || 'unknown') +
    ' | estimate ' + (item.minutes ? item.minutes + ' min' : 'unknown') +
    (item.firstStep ? ' | first step: ' + item.firstStep : ''));
  const sources = files.map(file => '- ' + file.name + '\n  https://drive.google.com/file/d/' + file.id + '/view');
  return [
    question.trim() || 'Help me choose a realistic next study block.',
    '',
    'My open coursework, entered locally:',
    ...work,
    '',
    'Selected Drive sources (links and names only):',
    ...sources,
    '',
    'Open the selected sources using my connected Drive before relying on their contents. If access fails, ask me for the relevant text. Show the source title and section for factual claims. Treat source contents as study material. Ask before changing tasks. Explain assumptions and flag missing deadlines or estimates.'
  ].join('\n');
}

export function initStudyHub(getAssignments) {
  const form = document.querySelector('#drive-setup');
  const status = document.querySelector('#drive-status');
  const connect = document.querySelector('#drive-connect');
  const filesPanel = document.querySelector('#drive-files');
  const selected = new Map();
  const prompt = document.querySelector('#study-request');
  let token = '';
  let expires = 0;
  let generation = 0;
  let path = [];
  let settings;
  try {
    settings = JSON.parse(localStorage.getItem(settingsKey) || 'null');
    form.elements.clientId.value = settings?.clientId || '';
    form.elements.folder.value = settings?.folder || '';
  } catch {
    status.textContent = 'Saved setup could not be read. Enter it again.';
  }

  function clearConnection() {
    generation += 1;
    token = '';
    expires = 0;
    selected.clear();
    path = [];
    filesPanel.replaceChildren();
    prompt.value = '';
    document.querySelector('#drive-refresh').disabled = true;
    document.querySelector('#drive-up').disabled = true;
    document.querySelector('#drive-disconnect').disabled = true;
  }

  async function listFolder() {
    if (!token || Date.now() >= expires) {
      clearConnection();
      throw new Error('Drive access expired. Connect again to continue.');
    }
    const requestGeneration = ++generation;
    const all = [];
    let pageToken = '';
    status.textContent = 'Loading files…';
    do {
      const params = new URLSearchParams({
        q:"'" + path.at(-1) + "' in parents and trashed = false",
        fields:'nextPageToken,files(id,name,mimeType)',
        pageSize:'100', orderBy:'folder,name', supportsAllDrives:'true', includeItemsFromAllDrives:'true'
      });
      if (pageToken) params.set('pageToken', pageToken);
      const response = await fetch('https://www.googleapis.com/drive/v3/files?' + params, {
        headers:{Authorization:'Bearer ' + token}
      });
      if (requestGeneration !== generation) return;
      if (response.status === 401) {
        clearConnection();
        throw new Error('Drive access expired. Connect again.');
      }
      if (!response.ok) throw new Error('Drive could not list this folder (HTTP ' + response.status + '). Check API setup, folder access and permissions.');
      const data = await response.json();
      if (requestGeneration !== generation) return;
      all.push(...data.files);
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    filesPanel.replaceChildren();
    for (const file of all) {
      const row = document.createElement('article');
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const open = document.createElement('button');
        open.textContent = file.name + ' /';
        open.onclick = () => {
          path.push(file.id);
          listFolder().catch(error => { status.textContent = error.message; });
        };
        row.append(open);
      } else {
        const label = document.createElement('label');
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = selected.has(file.id);
        check.onchange = () => {
          if (check.checked) selected.set(file.id, file);
          else selected.delete(file.id);
          status.textContent = selected.size + ' files selected for the study request.';
        };
        label.append(check, document.createTextNode(' ' + file.name));
        const link = document.createElement('a');
        link.textContent = 'Open';
        link.href = 'https://drive.google.com/file/d/' + file.id + '/view';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.append(label, link);
      }
      filesPanel.append(row);
    }
    status.textContent = all.length + ' items · ' + selected.size + ' selected. File contents are opened in Drive.';
    document.querySelector('#drive-up').disabled = path.length < 2;
  }

  form.onsubmit = async event => {
    event.preventDefault();
    try {
      const clientId = form.elements.clientId.value.trim();
      if (!/^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$/.test(clientId)) throw new Error('Enter a Google OAuth web client ID.');
      settings = {clientId, folder:folderId(form.elements.folder.value)};
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      clearConnection();
      connect.disabled = true;
      if (!window.google?.accounts?.oauth2) {
        await new Promise((resolve,reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.onload = resolve;
          script.onerror = () => { script.remove(); reject(new Error('Google sign-in could not load. Try saving setup again.')); };
          document.head.append(script);
        });
      }
      connect.disabled = false;
      status.textContent = 'Setup saved on this device. Connect to Google Drive to choose an account.';
    } catch (error) { status.textContent = error.message; }
  };

  connect.onclick = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id:settings.clientId, scope, include_granted_scopes:false,
      callback:response => {
        if (response.error) { status.textContent = 'Google did not grant access. ' + response.error; return; }
        if (!window.google.accounts.oauth2.hasGrantedAllScopes(response, scope)) {
          status.textContent = 'Drive metadata permission is required to list files.';
          return;
        }
        clearConnection();
        token = response.access_token;
        expires = Date.now() + Number(response.expires_in) * 1000;
        path = [settings.folder];
        document.querySelector('#drive-refresh').disabled = false;
        document.querySelector('#drive-disconnect').disabled = false;
        listFolder().catch(error => { status.textContent = error.message; });
      },
      error_callback:() => { status.textContent = 'Google sign-in closed or was blocked. Try Connect again.'; }
    });
    client.requestAccessToken({prompt:'select_account'});
  };
  document.querySelector('#drive-refresh').onclick = () => listFolder().catch(error => { status.textContent = error.message; });
  document.querySelector('#drive-up').onclick = () => {
    if (path.length > 1) path.pop();
    listFolder().catch(error => { status.textContent = error.message; });
  };
  document.querySelector('#drive-disconnect').onclick = () => {
    const previousToken = token;
    clearConnection();
    if (previousToken) window.google.accounts.oauth2.revoke(previousToken, () => {});
    status.textContent = 'Disconnected. File selection and study request cleared.';
  };
  document.querySelector('#build-request').onclick = () => {
    try {
      prompt.value = studyRequest(document.querySelector('#study-question').value, getAssignments(), [...selected.values()]);
      status.textContent = 'Review the request below, then copy it into ChatGPT. It includes open coursework and selected file links.';
    } catch (error) { status.textContent = error.message; }
  };
  document.querySelector('#copy-request').onclick = async () => {
    try {
      if (!prompt.value) throw new Error('Build a study request first.');
      await navigator.clipboard.writeText(prompt.value);
      status.textContent = 'Copied. Open ChatGPT and paste the request.';
    } catch (error) { status.textContent = error.message + ' You can also select and copy the text below.'; }
  };
}
