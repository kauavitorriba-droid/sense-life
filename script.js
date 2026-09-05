// ESTADO DA APLICAÇÃO (LocalStorage)
let appState = JSON.parse(localStorage.getItem('my_ultimate_organizer')) || {
  projects: [],
  classes: [],
  events: [],
  journal: [],
  theme: 'light'
};

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-theme', appState.theme || 'light');
  updateThemeLabel();
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDateDisplay').innerText = now.toLocaleDateString('pt-BR', options);
  renderAll();
});

function saveState() {
  localStorage.setItem('my_ultimate_organizer', JSON.stringify(appState));
  renderAll();
}

function switchTab(tabId, btnElement) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btnElement.classList.add('active');
  
  const titles = {
    dashboard: 'Visão Geral',
    projetos: 'Projetos & Arquivos de Trabalho',
    horarios: 'Horário de Aulas Semanal',
    compromissos: 'Agenda & Compromissos',
    diario: 'Diário Pessoal & Reflexões'
  };
  document.getElementById('pageTitle').innerText = titles[tabId] || 'Painel';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  appState.theme = newTheme;
  localStorage.setItem('my_ultimate_organizer', JSON.stringify(appState));
  updateThemeLabel();
}

function updateThemeLabel() {
  const theme = document.documentElement.getAttribute('data-theme');
  document.getElementById('themeLabel').innerText = theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro';
}

/* 1. MÓDULO DE PROJETOS */
function addProject(e) {
  e.preventDefault();
  const title = document.getElementById('projTitle').value.trim();
  const category = document.getElementById('projCategory').value;
  const deadline = document.getElementById('projDeadline').value;
  const description = document.getElementById('projDescription').value.trim();

  appState.projects.push({
    id: Date.now(),
    title,
    category,
    deadline,
    description,
    tasks: []
  });

  e.target.reset();
  saveState();
}

function deleteProject(id) {
  if (confirm('Tem certeza de que deseja excluir este projeto?')) {
    appState.projects = appState.projects.filter(p => p.id !== id);
    saveState();
  }
}

function addSubTask(projId) {
  const taskText = prompt("Nova tarefa/etapa para este projeto:");
  if (taskText && taskText.trim()) {
    const proj = appState.projects.find(p => p.id === projId);
    proj.tasks.push({ id: Date.now(), text: taskText.trim(), done: false });
    saveState();
  }
}

function toggleSubTask(projId, taskId) {
  const proj = appState.projects.find(p => p.id === projId);
  const task = proj.tasks.find(t => t.id === taskId);
  task.done = !task.done;
  saveState();
}

function deleteSubTask(projId, taskId) {
  const proj = appState.projects.find(p => p.id === projId);
  proj.tasks = proj.tasks.filter(t => t.id !== taskId);
  saveState();
}

/* 2. MÓDULO DE HORÁRIOS */
function addClass(e) {
  e.preventDefault();
  const day = document.getElementById('classDay').value;
  const time = document.getElementById('classTime').value.trim();
  const name = document.getElementById('className').value.trim();
  const location = document.getElementById('classLocation').value.trim();

  appState.classes.push({ id: Date.now(), day, time, name, location });
  e.target.reset();
  saveState();
}

function deleteClass(id) {
  appState.classes = appState.classes.filter(c => c.id !== id);
  saveState();
}

/* 3. MÓDULO DE AGENDA */
function addEvent(e) {
  e.preventDefault();
  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;
  const priority = document.getElementById('eventPriority').value;
  const type = document.getElementById('eventType').value;

  appState.events.push({ id: Date.now(), title, date, priority, type, done: false });
  e.target.reset();
  saveState();
}

function toggleEvent(id) {
  const ev = appState.events.find(e => e.id === id);
  ev.done = !ev.done;
  saveState();
}

function deleteEvent(id) {
  appState.events = appState.events.filter(e => e.id !== id);
  saveState();
}

/* 4. MÓDULO DE DIÁRIO */
function addJournalEntry(e) {
  e.preventDefault();
  const title = document.getElementById('journalTitle').value.trim();
  const mood = document.getElementById('journalMood').value;
  const text = document.getElementById('journalText').value.trim();
  const date = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  appState.journal.unshift({ id: Date.now(), date, title, mood, text });
  e.target.reset();
  saveState();
}

function deleteJournal(id) {
  if (confirm('Excluir este registro do diário?')) {
    appState.journal = appState.journal.filter(j => j.id !== id);
    saveState();
  }
}

/* BACKUP */
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `backup-organizador-${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/* RENDERIZAÇÃO */
function renderAll() {
  renderDashboard();
  renderProjects();
  renderTimetable();
  renderEvents();
  renderJournal();
}

function renderDashboard() {
  document.getElementById('dashProjCount').innerText = appState.projects.length;
  
  let totalPending = 0;
  appState.projects.forEach(p => totalPending += p.tasks.filter(t => !t.done).length);
  totalPending += appState.events.filter(e => !e.done).length;
  document.getElementById('dashPendingCount').innerText = totalPending;
  document.getElementById('dashClassCount').innerText = appState.classes.length;
  document.getElementById('dashJournalCount').innerText = appState.journal.length;

  const upcoming = [...appState.events].filter(e => !e.done).slice(0, 4);
  const dashEvContainer = document.getElementById('dashUpcomingEvents');
  if (upcoming.length === 0) {
    dashEvContainer.innerHTML = '<p style="color: var(--text-muted); font-size:0.875rem;">Sem compromissos pendentes.</p>';
  } else {
    dashEvContainer.innerHTML = upcoming.map(ev => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom:8px;">
        <div>
          <strong>${ev.title}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${ev.date || 'Sem data'}</div>
        </div>
        <span class="badge badge-primary">${ev.type}</span>
      </div>
    `).join('');
  }

  const dashProjContainer = document.getElementById('dashProjectsSummary');
  if (appState.projects.length === 0) {
    dashProjContainer.innerHTML = '<p style="color: var(--text-muted); font-size:0.875rem;">Nenhum projeto em andamento.</p>';
  } else {
    dashProjContainer.innerHTML = appState.projects.slice(0, 3).map(p => {
      const doneTasks = p.tasks.filter(t => t.done).length;
      const pct = p.tasks.length > 0 ? Math.round((doneTasks / p.tasks.length) * 100) : 0;
      return `
        <div style="margin-bottom: 12px;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
            <strong>${p.title}</strong>
            <span>${pct}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '';
  if (appState.projects.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1;">Nenhum projeto cadastrado ainda.</p>';
    return;
  }
  appState.projects.forEach(p => {
    const doneTasks = p.tasks.filter(t => t.done).length;
    const totalTasks = p.tasks.length;
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="badge badge-primary">${p.category}</span>
          <h3 style="font-size:1.1rem; margin-top:6px;">${p.title}</h3>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="deleteProject(${p.id})">🗑️</button>
      </div>
      ${p.deadline ? `<div style="font-size:0.8rem; color:var(--text-muted);">📅 Prazo: ${p.deadline}</div>` : ''}
      ${p.description ? `<div style="font-size:0.85rem; background:var(--bg-input); padding:10px; border-radius:var(--radius-sm); white-space:pre-wrap;">${p.description}</div>` : ''}
      <div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px; font-weight:600;">
          <span>Progresso (${doneTasks}/${totalTasks})</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.85rem;">Sub-tarefas:</strong>
          <button class="btn btn-secondary btn-sm" onclick="addSubTask(${p.id})">+ Adicionar</button>
        </div>
        <ul class="subtask-list">
          ${p.tasks.map(t => `
            <li class="subtask-item ${t.done ? 'done' : ''}">
              <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleSubTask(${p.id}, ${t.id})">
              <span style="flex:1;">${t.text}</span>
              <button style="background:none; border:none; cursor:pointer; font-size:12px;" onclick="deleteSubTask(${p.id}, ${t.id})">✕</button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderTimetable() {
  const tbody = document.getElementById('timetableBody');
  tbody.innerHTML = '';
  if (appState.classes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Nenhuma aula cadastrada na grade.</td></tr>';
    return;
  }
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  days.forEach(day => {
    const dayClasses = appState.classes.filter(c => c.day === day);
    if (dayClasses.length > 0) {
      dayClasses.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${c.time}</strong></td>
          ${days.map(d => d === day ? `
            <td style="background: var(--primary-light); color: var(--primary-text); font-weight:600;">
              <div>${c.name}</div>
              <div style="font-size:0.75rem; font-weight:normal; opacity:0.8;">${c.location || ''}</div>
              <button class="btn btn-secondary btn-sm" style="margin-top:4px; padding:2px 6px; font-size:10px;" onclick="deleteClass(${c.id})">Excluir</button>
            </td>
          ` : '<td>-</td>').join('')}
        `;
        tbody.appendChild(tr);
      });
    }
  });
}

function renderEvents() {
  const container = document.getElementById('eventsContainer');
  container.innerHTML = '';
  if (appState.events.length === 0) {
    container.innerHTML = '<div class="card"><p style="color:var(--text-muted);">Nenhum compromisso agendado.</p></div>';
    return;
  }
  appState.events.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'agenda-item';
    item.style.opacity = ev.done ? '0.6' : '1';
    const priorityBadges = {
      'Alta': 'badge-danger',
      'Média': 'badge-warning',
      'Baixa': 'badge-success'
    };
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:14px;">
        <input type="checkbox" ${ev.done ? 'checked' : ''} onchange="toggleEvent(${ev.id})" style="transform:scale(1.2);">
        <div>
          <strong style="${ev.done ? 'text-decoration:line-through;' : ''}">${ev.title}</strong>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
            📅 ${ev.date || 'Sem data'} &nbsp;|&nbsp; Tag: ${ev.type}
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="badge ${priorityBadges[ev.priority] || 'badge-primary'}">${ev.priority}</span>
        <button class="btn btn-secondary btn-sm" onclick="deleteEvent(${ev.id})">🗑️ Excluir</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderJournal() {
  const list = document.getElementById('journalEntriesList');
  list.innerHTML = '';
  if (appState.journal.length === 0) {
    list.innerHTML = '<div class="card"><p style="color:var(--text-muted);">Nenhum registro no diário ainda.</p></div>';
    return;
  }
  appState.journal.forEach(j => {
    const card = document.createElement('div');
    card.className = 'journal-card';
    card.innerHTML = `
      <div class="journal-header">
        <div>
          <h4 style="font-size:1.1rem;">${j.title}</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">${j.date} &nbsp;•&nbsp; Humor: ${j.mood}</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="deleteJournal(${j.id})">🗑️ Excluir</button>
      </div>
      <div class="journal-body">${j.text}</div>
    `;
    list.appendChild(card);
  });
}

function handleGlobalSearch() {
  const query = document.getElementById('globalSearch').value.toLowerCase();
  if (!query) {
    renderAll();
    return;
  }
  document.querySelectorAll('.project-card').forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(query) ? 'flex' : 'none';
  });
  document.querySelectorAll('.agenda-item').forEach(item => {
    item.style.display = item.innerText.toLowerCase().includes(query) ? 'flex' : 'none';
  });
  document.querySelectorAll('.journal-card').forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(query) ? 'block' : 'none';
  });
}