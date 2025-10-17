(() => {
  const SELECTORS = {
    views: {
      dashboard: document.getElementById('view-dashboard'),
      children: document.getElementById('view-children'),
      schedule: document.getElementById('view-schedule'),
      reports: document.getElementById('view-reports'),
      settings: document.getElementById('view-settings'),
      assistant: document.getElementById('view-assistant')
    },
    navButtons: Array.from(document.querySelectorAll('.nav-btn')),
    stats: {
      children: document.getElementById('stat-children'),
      dueWeek: document.getElementById('stat-due-week'),
      overdue: document.getElementById('stat-overdue')
    },
    upcomingTableBody: document.querySelector('#table-upcoming tbody'),
    childForm: document.getElementById('form-child'),
    childFields: {
      id: document.getElementById('child-id'),
      name: document.getElementById('child-name'),
      dob: document.getElementById('child-dob'),
      guardian: document.getElementById('child-guardian'),
      contact: document.getElementById('child-contact')
    },
    childrenTableBody: document.querySelector('#table-children tbody'),
    scheduleList: document.getElementById('schedule-list'),
    exportCsv: document.getElementById('btn-export-csv'),
    reportTbody: document.querySelector('#table-report tbody'),
    settings: {
      dark: document.getElementById('setting-dark'),
      reminders: document.getElementById('setting-reminders'),
      api: document.getElementById('setting-api')
    }
  };

  const STORAGE_KEYS = {
    children: 'cvm_children',
    vaccinations: 'cvm_vaccinations',
    settings: 'cvm_settings',
    queue: 'cvm_sync_queue'
  };

  const DEFAULT_SCHEDULE = [
    { code: 'BCG', name: 'BCG', atWeeks: 0 },
    { code: 'HepB1', name: 'Hepatitis B (Birth)', atWeeks: 0 },
    { code: 'OPV1', name: 'OPV-1', atWeeks: 6 },
    { code: 'DPT1', name: 'DPT-1', atWeeks: 6 },
    { code: 'HepB2', name: 'Hepatitis B-2', atWeeks: 6 },
    { code: 'OPV2', name: 'OPV-2', atWeeks: 10 },
    { code: 'DPT2', name: 'DPT-2', atWeeks: 10 },
    { code: 'OPV3', name: 'OPV-3', atWeeks: 14 },
    { code: 'DPT3', name: 'DPT-3', atWeeks: 14 },
    { code: 'Measles1', name: 'Measles-1', atWeeks: 36 }
  ];

  // Per-view background images
  const VIEW_BACKGROUNDS = {
    dashboard: 'https://media.istockphoto.com/vectors/vaccination-vector-id842461774?k=20&m=842461774&s=612x612&w=0&h=Nk0Fvogz57yJ2SReQ_1DYVMDqm8oro1ScRdYozwg3qQ=',
    children: 'https://media.istockphoto.com/id/1372347922/vector/national-infant-immunization-awareness-week-vector.jpg?s=612x612&w=0&k=20&c=S_4q9DqNxha8zH6NVcsZ2HkNlwkHmuyu5Sc82zgEPtI=',
    schedule: 'https://media.istockphoto.com/vectors/vaccination-vector-id842461774?k=20&m=842461774&s=612x612&w=0&h=Nk0Fvogz57yJ2SReQ_1DYVMDqm8oro1ScRdYozwg3qQ=',
    reports: 'https://media.istockphoto.com/id/1372347922/vector/national-infant-immunization-awareness-week-vector.jpg?s=612x612&w=0&k=20&c=S_4q9DqNxha8zH6NVcsZ2HkNlwkHmuyu5Sc82zgEPtI=',
    assistant: 'https://media.istockphoto.com/vectors/vaccination-vector-id842461774?k=20&m=842461774&s=612x612&w=0&h=Nk0Fvogz57yJ2SReQ_1DYVMDqm8oro1ScRdYozwg3qQ=',
    settings: 'https://media.istockphoto.com/id/1372347922/vector/national-infant-immunization-awareness-week-vector.jpg?s=612x612&w=0&k=20&c=S_4q9DqNxha8zH6NVcsZ2HkNlwkHmuyu5Sc82zgEPtI='
  };

  function setBackgroundForView(view){
    const customBg = state.settings.bg && state.settings.bg.trim();
    const url = customBg || VIEW_BACKGROUNDS[view] || '';
    if(url){
      document.body.style.backgroundImage = `linear-gradient(rgba(10,15,20,.75), rgba(10,15,20,.85)), url('${url}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    }
  }

  function readStore(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const state = {
    children: readStore(STORAGE_KEYS.children, []),
    vaccinations: readStore(STORAGE_KEYS.vaccinations, {}),
    settings: readStore(STORAGE_KEYS.settings, { dark: false, reminders: true, api: '', bg: '' }),
    queue: readStore(STORAGE_KEYS.queue, [])
  };

  function apiBase(){
    const configured = state.settings.api && state.settings.api.trim();
    if(configured){
      return configured.replace(/\/$/,'');
    }
    // Default to same-origin backend (works when UI is served by backend)
    return window.location.origin.replace(/\/$/,'');
  }

  async function apiFetch(path, options){
    const base = apiBase();
    if(!base){
      // offline/local-only mode
      throw new Error('No API configured');
    }
    const url = base + path;
    let resp;
    try{
      resp = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    }catch(networkErr){
      throw new Error(`Network error contacting API at ${url}`);
    }
    if(!resp.ok){
      // Try to extract a helpful message from the response
      let message = `API error ${resp.status}`;
      try{
        const data = await resp.json();
        if(data && (data.error || data.message)){
          message = String(data.error || data.message);
        }
      }catch(_){
        try{
          const text = await resp.text();
          if(text) message = text.slice(0, 200);
        }catch(__){}
      }
      throw new Error(message);
    }
    return resp.json();
  }

  function enqueue(operation){
    state.queue.push({ id: crypto.randomUUID(), ...operation });
    writeStore(STORAGE_KEYS.queue, state.queue);
  }

  async function trySync(){
    if(!navigator.onLine) return;
    if(!apiBase()) return;
    const pending = [...state.queue];
    for(const op of pending){
      try{
        if(op.type === 'create-child'){
          await apiFetch('/api/children', { method: 'POST', body: JSON.stringify(op.payload) });
        } else if(op.type === 'update-child'){
          await apiFetch(`/api/children/${op.payload.id}`, { method: 'PUT', body: JSON.stringify(op.payload) });
        } else if(op.type === 'delete-child'){
          await apiFetch(`/api/children/${op.payload.id}`, { method: 'DELETE' });
        } else if(op.type === 'mark-vaccination'){
          await apiFetch('/api/vaccinations/mark', { method: 'POST', body: JSON.stringify(op.payload) });
        }
        state.queue = state.queue.filter(q => q.id !== op.id);
        writeStore(STORAGE_KEYS.queue, state.queue);
      }catch(_){ /* keep in queue */ }
    }
  }

  async function syncAllChildrenIfBackendEmpty(){
    try{
      const base = apiBase();
      if(!base) return;
      const resp = await fetch(base + '/api/children');
      const serverChildren = await resp.json();
      if((serverChildren || []).length === 0 && state.children.length > 0){
        for(const c of state.children){
          enqueue({ type: 'create-child', payload: { id: c.id, name: c.name, dob: c.dob, guardian_name: c.guardian, contact: c.contact } });
        }
        await trySync();
      }
    }catch(_){/* ignore */}
  }

  // View switching
  function switchView(view) {
    Object.entries(SELECTORS.views).forEach(([key, el]) => {
      const active = key === view;
      if (!el) return;
      el.hidden = !active;
    });
    SELECTORS.navButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.view === view));
    });
    document.getElementById('app')?.focus();
    setBackgroundForView(view);
    // Show voice assistant only on dashboard
    const va = document.getElementById('voice-assist') || document.getElementById('vaxi-assistant');
    if(va){ va.hidden = view !== 'dashboard'; }
  }

  // Child CRUD
  function upsertChild(child) {
    const index = state.children.findIndex((c) => c.id === child.id);
    if (index >= 0) state.children[index] = child; else state.children.push(child);
    writeStore(STORAGE_KEYS.children, state.children);
    renderChildrenTable();
    renderStats();
    // enqueue remote
    enqueue({ type: index >= 0 ? 'update-child' : 'create-child', payload: child });
    trySync();
  }

  function deleteChild(childId) {
    state.children = state.children.filter((c) => c.id !== childId);
    delete state.vaccinations[childId];
    writeStore(STORAGE_KEYS.children, state.children);
    writeStore(STORAGE_KEYS.vaccinations, state.vaccinations);
    renderChildrenTable();
    renderStats();
    enqueue({ type: 'delete-child', payload: { id: childId } });
    trySync();
  }

  // Vaccination records
  function getChildVaccines(childId) {
    return state.vaccinations[childId] || {};
  }

  function setChildVaccine(childId, code, status, date) {
    if (!state.vaccinations[childId]) state.vaccinations[childId] = {};
    state.vaccinations[childId][code] = { status, date };
    writeStore(STORAGE_KEYS.vaccinations, state.vaccinations);
    renderUpcoming();
    // enqueue sync to backend if available
    enqueue({ type: 'mark-vaccination', payload: { child_id: childId, code, name: code, status, done_date: date } });
    trySync();
  }

  function calculateDueDate(dob, atWeeks) {
    const ms = new Date(dob).getTime() + atWeeks * 7 * 24 * 60 * 60 * 1000;
    return new Date(ms);
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  // Rendering
  function renderStats() {
    SELECTORS.stats.children.textContent = String(state.children.length);
    const { due, overdue } = computeDueAndOverdue(14);
    SELECTORS.stats.dueWeek.textContent = String(due.length);
    SELECTORS.stats.overdue.textContent = String(overdue.length);

    // Reports summary cards
    const repChildren = document.getElementById('rep-total-children');
    const repDone = document.getElementById('rep-done');
    const repPending = document.getElementById('rep-pending');
    const repOverdue = document.getElementById('rep-overdue');
    if(repChildren){
      repChildren.textContent = String(state.children.length);
      let done=0, pending=0;
      for(const c of state.children){
        const recs = getChildVaccines(c.id);
        for(const s of DEFAULT_SCHEDULE){ const r=recs[s.code]; if(r?.status==='done') done++; else pending++; }
      }
      repDone.textContent = String(done);
      repPending.textContent = String(pending);
      repOverdue.textContent = String(overdue.length);

      // draw simple chart
      renderReportChart({ done, pending, overdue: overdue.length });
    }
  }

  function renderReportChart({ done, pending, overdue }){
    const canvas = document.getElementById('report-chart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.clientWidth || 600;
    const H = canvas.height = canvas.clientHeight || 120;
    ctx.clearRect(0,0,W,H);
    // background grid
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let y=H; y>0; y-=20){ ctx.fillRect(0,y-1,W,1); }
    const labels = ['Done','Pending','Overdue'];
    const values = [done,pending,overdue];
    const colors = ['#22c55e','#60a5fa','#ef4444'];
    const max = Math.max(1, ...values);
    const barW = Math.min(100, Math.floor(W/(labels.length*2)));
    const gap = barW;
    const startX = (W - (labels.length*barW + (labels.length-1)*gap))/2;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((lab, i)=>{
      const v = values[i];
      const h = Math.round((v/max)*(H-40));
      const x = startX + i*(barW+gap);
      const y = H-20-h;
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(String(v), x+barW/2, y-16);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(lab, x+barW/2, H-18);
    });
  }

  function computeDueAndOverdue(windowDays) {
    const today = new Date();
    const end = new Date(today.getTime() + windowDays * 24 * 60 * 60 * 1000);
    const due = [];
    const overdue = [];
    for (const child of state.children) {
      for (const item of DEFAULT_SCHEDULE) {
        const rec = getChildVaccines(child.id)[item.code];
        if (rec?.status === 'done') continue;
        const dueDate = calculateDueDate(child.dob, item.atWeeks);
        if (dueDate < today) {
          overdue.push({ child, item, dueDate });
        } else if (dueDate <= end) {
          due.push({ child, item, dueDate });
        }
      }
    }
    due.sort((a, b) => a.dueDate - b.dueDate);
    overdue.sort((a, b) => a.dueDate - b.dueDate);
    return { due, overdue };
  }

  function renderUpcoming() {
    const { due } = computeDueAndOverdue(14);
    SELECTORS.upcomingTableBody.innerHTML = due
      .map(({ child, item, dueDate }) => {
        return `<tr>
          <td>${escapeHtml(child.name)}</td>
          <td>${escapeHtml(item.name)}</td>
          <td><span class="tag">${formatDate(dueDate)}</span></td>
          <td>
            <button class="btn" data-action="mark-done" data-child="${child.id}" data-code="${item.code}">Mark done</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function renderChildrenTable() {
    SELECTORS.childrenTableBody.innerHTML = state.children
      .map((c) => {
        return `<tr>
          <td>${escapeHtml(c.name)}</td>
          <td><code style="font-size:12px">${c.id}</code> <button class="btn" data-action="copy-id" data-id="${c.id}">Copy</button></td>
          <td>${formatDate(c.dob)}</td>
          <td>${escapeHtml(c.guardian || '')}</td>
          <td>${escapeHtml(c.contact || '')}</td>
          <td>
            <button class="btn" data-action="edit" data-id="${c.id}">Edit</button>
            <button class="btn" data-action="sms" data-id="${c.id}" data-contact="${c.contact || ''}">Send SMS</button>
            <button class="btn danger" data-action="delete" data-id="${c.id}">Delete</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function renderSchedule(childId) {
    const filterId = (document.getElementById('schedule-child-id')?.value || '').trim();
    const child = state.children.find((c) => c.id === (filterId || childId)) || state.children[0];
    if (!child) {
      SELECTORS.scheduleList.innerHTML = '<p>No children yet. Add one in Children tab.</p>';
      return;
    }
    const records = getChildVaccines(child.id);
    const filterCode = (document.getElementById('schedule-filter-code')?.value || '').trim().toUpperCase();
    const list = DEFAULT_SCHEDULE.filter(s => !filterCode || s.code.toUpperCase().includes(filterCode));
    SELECTORS.scheduleList.innerHTML = list.map((item) => {
      const due = calculateDueDate(child.dob, item.atWeeks);
      const rec = records[item.code];
      const status = rec?.status === 'done' ? 'Done' : 'Pending';
      const doneAtExact = rec?.date ? new Date(rec.date).toLocaleString() : '';
      const dueExact = due.toLocaleString();
      const statusTag = rec?.status === 'done'
        ? `<span class="tag">Done ${doneAtExact}</span>`
        : `<span class="tag" data-countdown="${due.toISOString()}" title="${dueExact}">Due ${formatDate(due)} ${due.toTimeString().slice(0,5)}</span>`;
      const doneAt = rec?.date ? `<div class="muted">Completed at ${doneAtExact}</div>` : '';
      return `<div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="muted">Recommended at ${item.atWeeks} weeks</div>
            <div class="muted">Child ID: <code style="font-size:12px">${child.id}</code></div>
            ${doneAt}
          </div>
          <div>${statusTag}</div>
        </div>
        <div class="actions" style="margin-top:8px">
          <button class="btn" data-action="mark-done" data-child="${child.id}" data-code="${item.code}">Mark done</button>
        </div>
      </div>`;
    }).join('');

    // start live countdown updates
    startCountdownTicks();
  }

  let countdownTimer;
  function startCountdownTicks(){
    if(countdownTimer) return; // one timer
    const tick = ()=>{
      const els = document.querySelectorAll('[data-countdown]');
      els.forEach(el=>{
        const iso = el.getAttribute('data-countdown');
        const due = new Date(iso);
        const now = new Date();
        const ms = due - now;
        if(Number.isFinite(ms)){
          const sign = ms>=0 ? '' : '-';
          const abs = Math.abs(ms);
          const d = Math.floor(abs/(24*3600e3));
          const h = Math.floor((abs%(24*3600e3))/3600e3);
          const m = Math.floor((abs%3600e3)/60e3);
          el.textContent = (sign? 'Overdue ':'Due in ') + `${d}d ${h}h ${m}m`;
        }
      });
    };
    tick();
    countdownTimer = setInterval(tick, 60*1000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Sample data seeding
  function createSampleChild() {
    const id = crypto.randomUUID();
    const weeksAgo = 10; // DOB ~10 weeks ago so some vaccines are due
    const dobDate = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
    const child = {
      id,
      name: 'Demo Child',
      dob: formatDate(dobDate),
      guardian: 'Demo Guardian',
      contact: '+1 555-0100'
    };
    return child;
  }

  function loadSampleData() {
    if (state.children.length > 0) return; // avoid duplicates
    const child = createSampleChild();
    upsertChild(child);
    // Mark a couple of vaccinations as done and leave others pending
    setChildVaccine(child.id, 'BCG', 'done', formatDate(new Date(child.dob)));
    setChildVaccine(child.id, 'HepB1', 'done', formatDate(new Date(new Date(child.dob).getTime() + 1 * 24 * 60 * 60 * 1000)));
    // pending ones will render as upcoming/overdue depending on DOB
    renderSchedule(child.id);
    renderUpcoming();
    renderStats();
  }

  function seedOnFirstRunIfEmpty() {
    if (state.children.length === 0) {
      loadSampleData();
    }
  }

  function exportCsv() {
    const rows = [['Child','DOB','Vaccine','Status','Date','Recorded At']];
    for (const child of state.children) {
      const records = getChildVaccines(child.id);
      for (const item of DEFAULT_SCHEDULE) {
        const rec = records[item.code];
        rows.push([
          child.name,
          formatDate(child.dob),
          item.name,
          rec?.status === 'done' ? 'Done' : 'Pending',
          rec?.date ? formatDate(rec.date) : '',
          rec?.date ? new Date(rec.date).toLocaleString() : ''
        ]);
      }
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaccination_report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleNavClick(e) {
    const target = e.target.closest('.nav-btn');
    if (!target) return;
    switchView(target.dataset.view);
  }

  function handleChildSubmit(e) {
    e.preventDefault();
    const id = SELECTORS.childFields.id.value || crypto.randomUUID();
    const child = {
      id,
      name: SELECTORS.childFields.name.value.trim(),
      dob: SELECTORS.childFields.dob.value,
      guardian: SELECTORS.childFields.guardian.value.trim(),
      contact: SELECTORS.childFields.contact.value.trim()
    };
    upsertChild(child);
    e.target.reset();
  }

  function handleChildrenTableClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') {
      const child = state.children.find((c) => c.id === id);
      if (!child) return;
      SELECTORS.childFields.id.value = child.id;
      const ro = document.getElementById('child-id-readonly');
      if(ro){ ro.value = child.id; }
      SELECTORS.childFields.name.value = child.name;
      SELECTORS.childFields.dob.value = formatDate(child.dob);
      SELECTORS.childFields.guardian.value = child.guardian || '';
      SELECTORS.childFields.contact.value = child.contact || '';
      switchView('children');
    } else if (btn.dataset.action === 'delete') {
      if (confirm('Delete child and all records?')) {
        deleteChild(id);
      }
    } else if (btn.dataset.action === 'copy-id') {
      navigator.clipboard.writeText(id).then(()=>{
        btn.textContent = 'Copied';
        setTimeout(()=>{ btn.textContent = 'Copy'; }, 1000);
      });
    } else if (btn.dataset.action === 'sms') {
      const contact = btn.dataset.contact;
      document.getElementById('sms-child-id').value = id;
      if(contact) {
        document.getElementById('sms-phone').value = contact;
      }
      switchView('dashboard');
      // Focus on SMS form
      setTimeout(() => {
        document.getElementById('sms-message').focus();
      }, 100);
    }
  }

  function handleMarkDoneClick(e) {
    const btn = e.target.closest('button[data-action="mark-done"]');
    if (!btn) return;
    const childId = btn.dataset.child;
    const code = btn.dataset.code;
    const date = formatDate(new Date());
    setChildVaccine(childId, code, 'done', date);
    renderSchedule(childId);
    renderUpcoming();
    renderStats();
  }

  function applySettings() {
    document.documentElement.dataset.theme = state.settings.dark ? 'dark' : 'light';
    SELECTORS.settings.dark.checked = !!state.settings.dark;
    SELECTORS.settings.reminders.checked = !!state.settings.reminders;
    SELECTORS.settings.api.value = state.settings.api || '';
    const bgInput = document.getElementById('setting-bg');
    if(bgInput){ bgInput.value = state.settings.bg || ''; }
    if(state.settings.bg){ document.body.style.backgroundImage = `url('${state.settings.bg}')`; document.body.style.backgroundSize='cover'; document.body.style.backgroundAttachment='fixed'; }
  }

  function handleSettingsChange() {
    state.settings.dark = SELECTORS.settings.dark.checked;
    state.settings.reminders = SELECTORS.settings.reminders.checked;
    state.settings.api = SELECTORS.settings.api.value.trim();
    const bgInput = document.getElementById('setting-bg');
    state.settings.bg = (bgInput?.value || '').trim();
    writeStore(STORAGE_KEYS.settings, state.settings);
    applySettings();
    trySync();
  }

  // AI form
  async function handleAiSubmit(e){
    e.preventDefault();
    const q = document.getElementById('ai-question').value.trim();
    if(!q) return;
    const childId = document.getElementById('ai-child-id').value.trim();
    const lang = document.getElementById('ai-lang')?.value || 'auto';
    const chat = document.getElementById('ai-chat');
    const addBubble = (who, text) => {
      const div = document.createElement('div');
      div.className = `bubble ${who}`;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    };
    addBubble('user', q);
    document.getElementById('ai-question').value = '';
    addBubble('bot', '…');
    try{
      const data = await apiFetch('/api/ai/query', { method: 'POST', body: JSON.stringify({ question: q, child_id: childId || undefined, lang })});
      chat.lastChild.textContent = data.answer || 'No answer';
    }catch(err){
      chat.lastChild.textContent = 'Offline or API not configured.';
    }
  }

  // Voice Assistant (new)
  function initVaxiAssistant(){
    const toggle = document.getElementById('va-toggle');
    const panel = document.getElementById('va-panel');
    const closeBtn = document.getElementById('va-close');
    const backBtn = document.getElementById('va-back');
    const chat = document.getElementById('va-chat');
    const form = document.getElementById('va-form');
    const input = document.getElementById('va-input');
    const mic = document.getElementById('va-mic');
    const langSel = document.getElementById('va-lang');
    if(!toggle || !panel) return;

    const add = (who, text) => {
      const div = document.createElement('div');
      div.className = `bubble ${who}`;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    };

    const speak = (text) => {
      try{ 
        const u = new SpeechSynthesisUtterance(text);
        if(langSel && langSel.value){ u.lang = langSel.value; }
        speechSynthesis.speak(u); 
      }catch(_){/*noop*/}
    };

    function showChildInfo(child){
      const details = `${child.name}\nDOB: ${formatDate(child.dob)}\nGuardian: ${child.guardian || '-'}\nContact: ${child.contact || '-'}`;
      add('bot', details);
      speak(`${child.name}, born on ${formatDate(child.dob)}`);
    }

    // Assistant conversation state
    const historyStack = [];
    const convo = { mode: 'idle', temp: {} };

    async function ask(q){
      add('user', q);
      add('bot', '…');
      try{
        const selectedChildId = document.getElementById('ai-child-id')?.value.trim();
        const childId = selectedChildId || (state.children[0]?.id || undefined);
        const data = await apiFetch('/api/ai/query', { method:'POST', body: JSON.stringify({ question:q, child_id: childId, lang: (langSel?.value||'en-IN') }) });
        chat.lastChild.textContent = data.answer || 'No answer';
        speak(chat.lastChild.textContent);
      }catch(err){ chat.lastChild.textContent = err.message || 'Error'; }
    }

    toggle.addEventListener('click', ()=>{ 
      const nowOpen = panel.hidden; 
      panel.hidden = !panel.hidden; 
      toggle.setAttribute('aria-pressed', String(nowOpen));
      if(!panel.hidden) { input.focus(); }
    });
    closeBtn?.addEventListener('click', (e)=>{ e.preventDefault(); panel.hidden = true; convo.mode='idle'; convo.temp={}; });
    backBtn?.addEventListener('click', (e)=>{ e.preventDefault(); panel.hidden = true; convo.mode='idle'; convo.temp={}; });

    function handleAssistantInput(text){
      // Intercept special intents
      const lc = text.toLowerCase();
      // If in add-child flow
      if(convo.mode === 'add-child'){
        if(!convo.temp.name){
          convo.temp.name = text.trim();
          add('bot', 'What is the date of birth? (YYYY-MM-DD)'); speak('What is the date of birth?');
          return;
        }
        if(!convo.temp.dob){
          const v = text.trim();
          // basic YYYY-MM-DD validation
          if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){ add('bot','Please enter DOB as YYYY-MM-DD'); speak('Please enter date of birth as year dash month dash day'); return; }
          convo.temp.dob = v;
          add('bot','Guardian name?'); speak('Guardian name?');
          return;
        }
        if(!convo.temp.guardian){
          convo.temp.guardian = text.trim();
          add('bot','Contact number?'); speak('Contact number?');
          return;
        }
        if(!convo.temp.contact){
          convo.temp.contact = text.trim();
          // Create child
          const id = crypto.randomUUID();
          const child = { id, name: convo.temp.name, dob: convo.temp.dob, guardian: convo.temp.guardian, contact: convo.temp.contact };
          upsertChild(child);
          renderChildrenTable(); renderStats();
          add('bot', `Added ${child.name} (DOB ${formatDate(child.dob)}). ID ${child.id}`);
          speak(`Added ${child.name}.`);
          // set selection fields
          const childIdEl = document.getElementById('ai-child-id'); if(childIdEl){ childIdEl.value = child.id; }
          // no dropdown in new assistant
          convo.mode = 'idle'; convo.temp = {};
          return;
        }
      }

      // New flow trigger
      if(/^(add|create)\s+child/i.test(lc) || /new\s+child/i.test(lc)){
        convo.mode = 'add-child'; convo.temp = {};
        add('bot','Okay, let’s add a child. What is the full name?'); speak('Okay, let us add a child. What is the full name?');
        return;
      }

      // Quick answers client-side
      if(/^name$/.test(lc) || /what\s+is\s+(the\s+)?child\s+name/i.test(lc)){
        const selectedChildId = document.getElementById('ai-child-id')?.value.trim();
        const c = state.children.find(x=>x.id===selectedChildId) || state.children[0];
        if(c){ add('bot', c.name); speak(c.name); } else { add('bot','No child selected.'); speak('No child selected'); }
        return;
      }

      // Fallback to server QA
      ask(text);
    }

    form?.addEventListener('submit', (e)=>{ e.preventDefault(); const q = input.value.trim(); if(!q) return; historyStack.push(q); input.value=''; handleAssistantInput(q); });

    // No selector block in new assistant

    // Voice input via Web Speech API
    let recognizer;
    try{
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(SR){ recognizer = new SR(); recognizer.lang = (langSel?.value || 'en-US'); recognizer.interimResults = false; }
    }catch(_){/*noop*/}
    mic?.addEventListener('click', ()=>{ if(!recognizer){ alert('Speech not supported'); return; } if(langSel && recognizer){ recognizer.lang = langSel.value || 'en-US'; } recognizer.start(); });
    if(recognizer){ recognizer.onresult = (ev)=>{ const t = Array.from(ev.results).map(r=>r[0].transcript).join(' ').trim();
      // voice command: set child to <uuid>
      const m = t.match(/set\s+child\s+to\s+([0-9a-f-]{8,})/i);
      if(m){ const id=m[1]; const found=state.children.find(c=>c.id===id); if(found){ const childIdEl=document.getElementById('ai-child-id'); if(childIdEl){ childIdEl.value=id; } add('bot', `Selected ${found.name} (DOB ${formatDate(found.dob)})`); showChildInfo(found); return; } }
      // generic: if an UUID is spoken alone
      const m2 = t.match(/([0-9a-f]{8}-[0-9a-f-]{4,})/i);
      if(m2){ const id=m2[1]; const found=state.children.find(c=>c.id.toLowerCase().startsWith(id.toLowerCase())); if(found){ const childIdEl=document.getElementById('ai-child-id'); if(childIdEl){ childIdEl.value=found.id; } add('bot', `Selected ${found.name} (DOB ${formatDate(found.dob)})`); showChildInfo(found); return; } }
      // info <uuid>
      const infoMatch = t.match(/info\s+([0-9a-f-]{8,})/i);
      if(infoMatch){ const id=infoMatch[1]; const found=state.children.find(c=>c.id.toLowerCase().startsWith(id.toLowerCase())); if(found){ const childIdEl=document.getElementById('ai-child-id'); if(childIdEl){ childIdEl.value=found.id; } showChildInfo(found); return; } }
      // voice Q&A like "what is child name" or "who is this child"
      if(/what\s+is\s+(the\s+)?child\s+name/i.test(t)){ panel.hidden=false; ask('name'); return; }
      if(/who\s+is\s+(this\s+)?child/i.test(t)){ panel.hidden=false; ask('who is this child'); return; }
      if(/^hey (vaxi|assistant)/i.test(t)) { panel.hidden=false; const q=t.replace(/^hey (vaxi|assistant)[ ,]*/i,'').trim(); if(q) handleAssistantInput(q); else speak('Yes?'); } else { panel.hidden=false; handleAssistantInput(t); }
    }; }

    // Quick command: set child by UUID
    form?.addEventListener('submit', (e)=>{ /* handler above maintains ask */ });
    input.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter'){ const val = input.value.trim();
        // support: child id: <uuid> or just <uuid>
        const uuidOnly = val.match(/^[0-9a-f]{8}-[0-9a-f-]{4,}$/i);
        const withLabel = val.match(/^child\s+id\s*[:=]?\s*([0-9a-f-]{8,})/i);
        let uuid = null; if(withLabel){ uuid = withLabel[1]; } else if(uuidOnly){ uuid = uuidOnly[0]; }
        if(uuid){ historyStack.push(val); const found = state.children.find(c=>c.id.toLowerCase().startsWith(uuid.toLowerCase())); if(found){ const childIdEl = document.getElementById('ai-child-id'); if(childIdEl){ childIdEl.value = found.id; } add('bot', `Selected ${found.name} (DOB ${formatDate(found.dob)})`); showChildInfo(found); input.value=''; ev.preventDefault(); return; } }
        // info keyword
        const mInfo = val.match(/^info\s+([0-9a-f-]{8,})/i); 
        if(mInfo){ const id=mInfo[1]; const found=state.children.find(c=>c.id.toLowerCase().startsWith(id.toLowerCase())); if(found){ const childIdEl=document.getElementById('ai-child-id'); if(childIdEl){ childIdEl.value=found.id; } showChildInfo(found); input.value=''; ev.preventDefault(); return; } }
        // otherwise handle normal submit
      }
    });
  }

  // Health worker verify form
  async function handleVerifySubmit(e){
    e.preventDefault();
    const childId = document.getElementById('verify-child-id').value.trim() || (state.children[0]?.id || '');
    const resultEl = document.getElementById('verify-result');
    if(!childId){ resultEl.textContent = 'No child ID provided.'; return; }
    resultEl.textContent = 'Opening camera...';
    try{
      await openCamera();
      const img = captureFrame();
      const r = await apiFetch('/api/biometrics/verify', { method: 'POST', body: JSON.stringify({ child_id: childId, modality: 'face', template: img })});
      resultEl.textContent = r.matched ? 'Identity verified.' : 'No match found.';
    }catch(_){ resultEl.textContent = 'Offline or API not configured.'; }
  }

  // SMS form handler
  async function handleSmsSubmit(e){
    e.preventDefault();
    const childId = document.getElementById('sms-child-id').value.trim();
    const phone = document.getElementById('sms-phone').value.trim();
    const message = document.getElementById('sms-message').value.trim();
    const resultEl = document.getElementById('sms-result');
    
    if(!childId || !phone || !message){
      resultEl.textContent = 'Please fill all fields.';
      return;
    }
    
    resultEl.textContent = 'Sending SMS...';
    try{
      const r = await apiFetch('/api/notify', { 
        method: 'POST', 
        body: JSON.stringify({ 
          child_id: childId, 
          channel: 'sms', 
          to: phone, 
          body: message 
        })
      });
      resultEl.textContent = r.ok ? `SMS sent successfully. ID: ${r.id}` : `Failed: ${r.error}`;
    }catch(err){
      resultEl.textContent = 'Failed to send SMS: ' + err.message;
    }
  }

  // SMS template handler
  function handleSmsTemplate(e){
    e.preventDefault();
    const childId = document.getElementById('sms-child-id').value.trim();
    const child = state.children.find(c => c.id === childId);
    const childName = child ? child.name : 'Child';
    
    const template = `Dear Parent,

Your child ${childName} has an upcoming vaccination due. Please visit the health center for immunization.

Thank you,
Health Center`;

    document.getElementById('sms-message').value = template;
  }

  // Camera & biometrics
  let mediaStream;
  async function openCamera(){
    const modal = document.getElementById('camera-modal');
    modal.hidden = false;
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('camera-video');
    video.srcObject = mediaStream;
  }
  function closeCamera(){
    const modal = document.getElementById('camera-modal');
    modal.hidden = true;
    if(mediaStream){
      mediaStream.getTracks().forEach(t=>t.stop());
      mediaStream = null;
    }
  }
  function captureFrame(){
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    // Scale down to keep payload under 2MB
    const maxW = 640;
    const scale = Math.min(1, maxW / (video.videoWidth || maxW));
    const w = Math.max(1, Math.round((video.videoWidth || maxW) * scale));
    const h = Math.max(1, Math.round((video.videoHeight || maxW * 0.75) * scale));
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    // Use JPEG with moderate quality to reduce size
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    document.getElementById('capture-preview').src = dataUrl;
    return dataUrl;
  }
  async function enrollFace(){
    const img = document.getElementById('capture-preview').src;
    const formId = (document.getElementById('verify-child-id')?.value || '').trim();
    const currentId = formId || (state.children[0]?.id || '');
    if(!currentId) return alert('No child to enroll.');
    try{
      const r = await apiFetch('/api/biometrics/enroll', { method: 'POST', body: JSON.stringify({ child_id: currentId, modality: 'face', template: img, metadata: { ts: Date.now() } })});
      alert('Enrolled: ' + r.id);
    }catch(err){ alert(err?.message || 'Offline or API not configured.'); }
  }
  async function verifyFace(){
    const formId = (document.getElementById('verify-child-id')?.value || '').trim();
    const currentId = formId || (state.children[0]?.id || '');
    if(!currentId) return alert('No child to verify.');
    try{
      const img = document.getElementById('capture-preview').src || captureFrame();
      const r = await apiFetch('/api/biometrics/verify', { method: 'POST', body: JSON.stringify({ child_id: currentId, modality: 'face', template: img })});
      alert(r.matched ? 'Match' : 'No match');
    }catch(err){ alert(err?.message || 'Offline or API not configured.'); }
  }

  function init() {
    document.getElementById('year').textContent = String(new Date().getFullYear());
    document.querySelector('.top-nav').addEventListener('click', handleNavClick);
    SELECTORS.childForm.addEventListener('submit', handleChildSubmit);
    document.getElementById('table-children').addEventListener('click', handleChildrenTableClick);
    document.getElementById('view-dashboard').addEventListener('click', handleMarkDoneClick);
    document.getElementById('view-schedule').addEventListener('click', handleMarkDoneClick);
    SELECTORS.exportCsv.addEventListener('click', exportCsv);
    document.getElementById('form-settings').addEventListener('change', handleSettingsChange);
    document.getElementById('form-ai').addEventListener('submit', handleAiSubmit);
    document.getElementById('form-verify').addEventListener('submit', handleVerifySubmit);
    document.getElementById('form-sms').addEventListener('submit', handleSmsSubmit);
    document.getElementById('btn-sms-template').addEventListener('click', handleSmsTemplate);
    // camera buttons
    document.getElementById('btn-close-camera').addEventListener('click', closeCamera);
    document.getElementById('btn-back-camera').addEventListener('click', (e)=>{ e.preventDefault(); closeCamera(); });
    const copyIdBtn = document.getElementById('btn-copy-child-id');
    if(copyIdBtn){
      copyIdBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        const ro = document.getElementById('child-id-readonly');
        if(ro && ro.value){ navigator.clipboard.writeText(ro.value); copyIdBtn.textContent = 'Copied'; setTimeout(()=>copyIdBtn.textContent='Copy',1000); }
      });
    }
    document.getElementById('btn-capture').addEventListener('click', (e)=>{ e.preventDefault(); captureFrame(); });
    document.getElementById('btn-enroll').addEventListener('click', (e)=>{ e.preventDefault(); enrollFace(); });
    document.getElementById('btn-verify').addEventListener('click', (e)=>{ e.preventDefault(); verifyFace(); });
    const openCamBtn = document.getElementById('btn-open-camera');
    if(openCamBtn){ openCamBtn.addEventListener('click', (e)=>{ e.preventDefault(); openCamera(); }); }
    const openCamHw = document.getElementById('btn-open-camera-hw');
    if(openCamHw){ openCamHw.addEventListener('click', (e)=>{ e.preventDefault(); openCamera(); }); }
    const enrollCurrent = document.getElementById('btn-enroll-current');
    if(enrollCurrent){ enrollCurrent.addEventListener('click', (e)=>{ e.preventDefault(); openCamera(); }); }
    const verifyCurrent = document.getElementById('btn-verify-current');
    if(verifyCurrent){ verifyCurrent.addEventListener('click', (e)=>{ e.preventDefault(); verifyFace(); }); }
    const loadSampleBtn = document.getElementById('btn-load-sample');
    if(loadSampleBtn){ loadSampleBtn.addEventListener('click', (e)=>{ e.preventDefault(); loadSampleData(); }); }
    const copySiteBtn = document.getElementById('btn-copy-site-url');
    if(copySiteBtn){ copySiteBtn.addEventListener('click', (e)=>{ e.preventDefault(); navigator.clipboard.writeText(window.location.origin); copySiteBtn.textContent='Copied'; setTimeout(()=>copySiteBtn.textContent='Copy site URL', 1000); }); }
    const syncNowBtn = document.getElementById('btn-sync-now');
    if(syncNowBtn){ syncNowBtn.addEventListener('click', async (e)=>{ e.preventDefault(); await syncAllChildrenIfBackendEmpty(); alert('Sync attempted.'); }); }

    // open camera from schedule view header click for demo
    document.getElementById('schedule-title').addEventListener('dblclick', (e)=>{ e.preventDefault(); openCamera(); });

    applySettings();
    seedOnFirstRunIfEmpty();
    renderChildrenTable();
    renderStats();
    renderUpcoming();
    renderSchedule();
    trySync();
    syncAllChildrenIfBackendEmpty();
    // initial background for default active view (dashboard)
    setBackgroundForView('dashboard');

    // Floating AI assistant init
    initVaxiAssistant();
  }

  document.addEventListener('DOMContentLoaded', init);
})();


