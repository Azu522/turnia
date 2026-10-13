const KEY = 'fila-turnos-v1';
const SOUND_KEY = 'fila-turnos-audio-v1';
const initial = {
  next: 26,
  served: 15,
  counters: [
    { id: 1, ticket: 'A016', customer: 'Roberto Méndez', service: 'Atención general' },
    { id: 2, ticket: 'A017', customer: 'Lucía Herrera', service: 'Pagos y facturación' },
    { id: 3, ticket: 'A018', customer: 'Javier Cruz', service: 'Información' },
    { id: 4, ticket: 'A019', customer: 'Ana Sofía López', service: 'Atención general' }
  ],
  queue: [
    { ticket: 'A020', customer: 'María Fernanda', service: 'Atención general', time: '13:02' },
    { ticket: 'A021', customer: 'Carlos Ramírez', service: 'Pagos y facturación', time: '13:10' },
    { ticket: 'A022', customer: 'Gabriela Torres', service: 'Información', time: '14:57' },
    { ticket: 'A023', customer: 'Daniela Ríos', service: 'Atención general', time: '14:57' },
    { ticket: 'A024', customer: 'Óscar Pineda', service: 'Trámites', time: '14:57' },
    { ticket: 'A025', customer: 'Elena Martínez', service: 'Atención general', time: '14:57' }
  ],
  current: { ticket: 'A019', counter: 4, customer: 'Ana Sofía López', service: 'Atención general' },
  activity: [
    { text: 'A019 · Llamado a Mesa 4', time: '14:58' },
    { text: 'A018 · Llamado a Mesa 3', time: '14:58' },
    { text: 'A017 · Llamado a Mesa 2', time: '14:58' },
    { text: 'A016 · Llamado a Mesa 1', time: '14:58' },
    { text: 'A015 · Atención finalizada', time: '13:11', done: true }
  ]
};
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(initial); } catch { return structuredClone(initial); } };
let data = load();
let activeCount = data.counters.filter(c => c.ticket).length;
let soundEnabled = localStorage.getItem(SOUND_KEY) === 'true';
let lastAnnouncementId = data.announcement?.id || null;
const save = () => { activeCount = data.counters.filter(c => c.ticket).length; localStorage.setItem(KEY, JSON.stringify(data)); render(); };
const timeNow = () => new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const route = new URLSearchParams(location.search).get('vista') || 'operacion';
const screenLink = '?vista=pantalla';
const kioskLink = '?vista=kiosco';

function speak(text) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const spanishVoice = window.speechSynthesis.getVoices().find(voice => /^es(-|_)(MX|US|ES)/i.test(voice.lang));
  if (spanishVoice) utterance.voice = spanishVoice;
  window.speechSynthesis.speak(utterance);
  return true;
}

function publishAnnouncement(text) {
  data.announcement = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text };
  lastAnnouncementId = data.announcement.id;
  save();
}

function render() {
  if (route === 'pantalla') return renderPublic();
  if (route === 'kiosco') return renderKiosk();
  renderAdmin();
}

function renderAdmin() {
  const current = data.current;
  const queueRows = data.queue.slice(0, 6).map(item => `<div class="queue-row"><span class="queue-no">${escapeHtml(item.ticket)}</span><div><div class="queue-name">${escapeHtml(item.customer)}</div><div class="queue-service">${escapeHtml(item.service)}</div></div><span class="queue-time">${escapeHtml(item.time)}</span><span class="queue-wait">En espera</span></div>`).join('') || '<div class="empty-queue">La fila está tranquila. Agrega un turno para comenzar.</div>';
  const counterCards = data.counters.map(counter => `<div class="counter ${counter.ticket ? 'busy' : ''}"><div class="counter-top"><span class="counter-title">Puesto ${String(counter.id).padStart(2,'0')}</span><span class="counter-light"></span></div><div class="counter-ticket">${counter.ticket ? escapeHtml(counter.ticket) : '—'}</div><div class="counter-bottom"><span class="counter-state">${counter.ticket ? `Atendiendo a ${escapeHtml(counter.customer || 'cliente')}` : 'Disponible para atender'}</span><button aria-label="${counter.ticket ? 'Finalizar turno' : 'Llamar siguiente'}" data-counter="${counter.id}" ${counter.ticket ? 'data-finish="true"' : 'data-call="true"'}>${counter.ticket ? '✓' : '↗'}</button></div></div>`).join('');
  const activity = data.activity.slice(0, 5).map(item => `<div class="activity-item"><span class="activity-symbol">${item.done ? '✓' : '↗'}</span><span>${escapeHtml(item.text)}</span><span class="activity-time">${escapeHtml(item.time)}</span></div>`).join('');
  document.title = 'Turnia · Atención en orden';
  document.getElementById('app').innerHTML = `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="./"><span class="brand-mark">↗</span><span>turnia<span class="brand-period">.</span></span></a>
        <nav class="main-nav"><a class="nav-item active" href="./">Resumen</a><a class="nav-item" href="${kioskLink}">Emitir turno</a><a class="nav-item" href="${screenLink}" target="_blank">Pantalla de sala <span class="external">↗</span></a></nav>
        <div class="top-actions"><span class="online"><i class="dot"></i> Operación activa</span><span class="date">${new Intl.DateTimeFormat('es-MX',{weekday:'short',day:'numeric',month:'short'}).format(new Date())}</span><div class="profile"><div class="avatar">AM</div><span>Andrea</span><span class="chevron">⌄</span></div></div>
      </header>
      <main class="main">
        <header class="header"><div><span class="eyebrow">CENTRO DE ATENCIÓN <span class="crumb-dot">·</span> SUCURSAL CENTRO</span><h1>Hola, Andrea <span class="wave">✳</span></h1><p>Tu equipo está atendiendo con ritmo. Aquí tienes el pulso de hoy.</p></div><button class="button button-primary" id="new-ticket">＋ <span>Crear turno</span></button></header>
        <section class="stat-grid">
          <article class="stat stat-main"><div class="stat-head">Personas en espera <span class="stat-icon">◷</span></div><div class="stat-number">${data.queue.length}<small> turnos</small></div><div class="stat-foot">${data.queue.length ? `Sigue el turno ${escapeHtml(data.queue[0].ticket)}` : 'La fila está vacía'}</div></article>
          <article class="stat"><div class="stat-head">Atendidas hoy <span class="stat-icon">✳</span></div><div class="stat-number">${data.served}</div><div class="stat-foot"><span class="trend">↑</span> Buen trabajo del equipo</div></article>
          <article class="stat"><div class="stat-head">Puestos ocupados <span class="stat-icon">⌑</span></div><div class="stat-number">${activeCount}<small> / ${data.counters.length}</small></div><div class="stat-foot">${data.counters.length-activeCount} puestos disponibles</div></article>
          <article class="stat stat-time"><div class="stat-head">Hora local <span class="stat-icon">☼</span></div><div class="stat-number">${new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit'}).format(new Date())}</div><div class="stat-foot">Sucursal abierta</div></article>
        </section>
        <section class="now-card"><div class="now-copy"><span class="now-label"><i></i> TURNO LLAMADO</span><div class="now-message">${current ? `Es momento de atender a <b>${escapeHtml(current.customer)}</b>.` : 'Listos para recibir a la siguiente persona.'}</div><div class="now-detail">${current ? `${escapeHtml(current.service)} <span>·</span> Puesto ${current.counter}` : 'Asigna una persona a un puesto disponible.'}</div><div class="now-buttons"><button class="call-card" id="call-next">Llamar siguiente <span>↗</span></button>${current ? '<button class="skip-card" id="finish-current">Finalizar atención</button>' : ''}</div></div><div class="hero-ticket"><span>${current ? 'PASE AL PUESTO ' + current.counter : 'PRÓXIMO TURNO'}</span><b>${current ? escapeHtml(current.ticket) : (data.queue[0] ? escapeHtml(data.queue[0].ticket) : '—')}</b><i>✳</i></div><div class="hero-orbit"></div></section>
        <section class="desk-section"><div class="section-heading"><div><span class="eyebrow">EL EQUIPO</span><h2>Puestos de atención</h2></div><span class="section-note">${activeCount} en servicio <i></i></span></div><div class="counter-grid">${counterCards}</div></section>
        <section class="content-grid"><div class="panel queue-panel"><div class="panel-title"><div><span class="eyebrow">LA FILA</span><h2>Personas por atender</h2><p>${data.queue.length} ${data.queue.length === 1 ? 'persona espera' : 'personas esperan'} su turno</p></div><button class="button button-light" id="add-queue">＋ Agregar</button></div><div class="queue-head"><span>TURNO / CLIENTE</span><span>HORA</span><span>ESTADO</span></div><div class="queue">${queueRows}</div>${data.queue.length>6?`<div class="queue-more">Y ${data.queue.length-6} personas más en espera</div>`:''}</div>
          <aside class="side-column"><section class="panel"><div class="panel-title"><div><span class="eyebrow">EN VIVO</span><h2>Actividad reciente</h2></div><span class="live-mark"><i></i> LIVE</span></div>${activity||'<div class="empty-queue">Todavía no hay actividad.</div>'}</section><div class="quick-tip"><div class="tip-icon">✳</div><div><strong>Atención en orden</strong><span>Llama el siguiente turno disponible y libera el puesto al terminar.</span></div></div><div class="view-links"><a href="${kioskLink}">Abrir kiosco de turnos <span>↗</span></a><a href="${screenLink}" target="_blank">Ver pantalla de sala <span>↗</span></a></div></aside>
        </section>
        <footer class="sync-footer"><span><i class="dot"></i> Todo al día</span><span>TURNIA <b>·</b> Atención más sencilla</span></footer>
      </main>
    </div>`;
  document.getElementById('new-ticket').onclick = openDialog;
  document.getElementById('add-queue').onclick = openDialog;
  document.getElementById('call-next').onclick = () => callNext();
  document.getElementById('finish-current')?.addEventListener('click', () => finish(data.current.counter));
  document.querySelectorAll('[data-call]').forEach(button => button.addEventListener('click', () => callNext(Number(button.dataset.counter))));
  document.querySelectorAll('[data-finish]').forEach(button => button.addEventListener('click', () => finish(Number(button.dataset.counter))));
}

function issueTicket(customer, service) {
  const ticket = `A${String(data.next++).padStart(3, '0')}`;
  data.queue.push({ ticket, customer: customer || 'Cliente', service, time: timeNow() });
  data.activity.unshift({ text: `${ticket} · Turno creado`, time: timeNow() });
  data.activity = data.activity.slice(0, 12);
  save();
  return ticket;
}
function callNext(counterId) {
  if (!data.queue.length) return toast('No hay turnos en espera.');
  const counter = counterId ? data.counters.find(c => c.id === counterId) : data.counters.find(c => !c.ticket);
  if (!counter) return toast(counterId ? 'Esa mesa ya está ocupada.' : 'No hay mesas disponibles.');
  const item = data.queue.shift();
  counter.ticket = item.ticket;
  counter.customer = item.customer;
  counter.service = item.service;
  data.current = { ticket: item.ticket, counter: counter.id, customer: item.customer, service: item.service };
  data.activity.unshift({ text: `${item.ticket} · Llamado a Mesa ${counter.id}`, time: timeNow() });
  data.activity = data.activity.slice(0, 12);
  publishAnnouncement(`Atención, ${item.customer}. Tiene el turno ${item.ticket}. Favor de pasar a la mesa ${counter.id} para ${item.service}.`);
  toast(`${item.customer}, turno ${item.ticket}: favor de pasar a Mesa ${counter.id}`);
}
function finish(counterId) {
  const counter = data.counters.find(c => c.id === counterId);
  if (!counter || !counter.ticket) return;
  const ticket = counter.ticket;
  data.activity.unshift({ text: `${ticket} · Atención finalizada`, time: timeNow(), done: true });
  data.activity = data.activity.slice(0, 12);
  data.served++;
  counter.ticket = null; counter.customer = null; counter.service = null;
  if (data.current?.counter === counterId) data.current = data.counters.find(c => c.ticket) ? { ...data.counters.find(c => c.ticket), counter: data.counters.find(c => c.ticket).id } : null;
  save(); toast(`Atención de ${ticket} finalizada.`);
}
function openDialog() { document.getElementById('new-ticket-dialog').showModal(); }
function renderPublic() {
  document.title = 'Turnia · Pantalla de sala';
  const current = data.current;
  const supportsSpeech = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  document.getElementById('app').innerHTML = `<a class="public-back" href="./">← Volver al panel</a><main class="public-view"><div class="public-inner"><div class="public-brand"><span class="brand-mark">↗</span> turnia.</div><button class="public-audio" id="toggle-audio" ${supportsSpeech ? '' : 'disabled'} aria-pressed="${soundEnabled}">${supportsSpeech ? (soundEnabled ? '🔊 Avisos de voz activados' : '🔈 Activar avisos de voz') : 'Audio no disponible'}</button><div class="public-kicker">${current ? 'FAVOR DE PASAR A' : 'EN UN MOMENTO LLAMAREMOS AL SIGUIENTE TURNO'}</div><div class="public-number">${current ? escapeHtml(current.ticket) : '—'}</div><div class="public-customer">${current ? escapeHtml(current.customer || 'Cliente') : 'Estamos preparando el siguiente turno'}</div><div class="public-desk">${current ? `Favor de pasar al puesto ${current.counter}` : 'Gracias por su paciencia'}</div><div class="public-bottom"><section><b>${data.queue.length}</b><small>PERSONAS EN ESPERA</small></section><section><b>${activeCount}/${data.counters.length}</b><small>PUESTOS EN SERVICIO</small></section><section><b>${new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit'}).format(new Date())}</b><small>HORA LOCAL</small></section></div><div class="public-queue">${data.queue.slice(0,5).map(q=>`<span>${escapeHtml(q.ticket)}</span>`).join('')}</div></div></main>`;
  document.getElementById('toggle-audio').addEventListener('click', event => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
    if (soundEnabled) {
      const message = current
        ? `Avisos de voz activados. Turno ${current.ticket}, ${current.customer}. Favor de pasar al puesto ${current.counter}.`
        : 'Avisos de voz activados. En un momento llamaremos al siguiente turno.';
      speak(message);
    } else if (supportsSpeech) {
      window.speechSynthesis.cancel();
    }
    renderPublic();
  });
}
function renderKiosk() {
  document.title = 'Turnia · Solicitar turno';
  document.getElementById('app').innerHTML = `<main class="kiosk"><section class="kiosk-card"><div class="kiosk-logo"><span class="brand-mark">↗</span>turnia<span class="brand-period">.</span></div><h1>Solicita tu turno</h1><p>Completa tus datos y espera a que te llamemos.</p><form id="kiosk-form"><label>Nombre<input name="name" placeholder="¿Cómo te llamas?" maxlength="45" required autocomplete="name" /></label><label>Tipo de atención<select name="service"><option>Atención general</option><option>Pagos y facturación</option><option>Información</option><option>Trámites</option></select></label><button class="button button-primary kiosk-submit">Obtener mi turno <span>→</span></button></form><a class="back-link" href="./">Volver al panel de atención</a></section></main>`;
  document.getElementById('kiosk-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ticket = issueTicket(String(form.get('name')).trim(), String(form.get('service')));
    document.querySelector('.kiosk-card').innerHTML = `<div class="kiosk-logo"><span class="brand-mark">↗</span>turnia<span class="brand-period">.</span></div><div class="issued"><span class="eyebrow">TU TURNO</span><div class="issued-no">${escapeHtml(ticket)}</div><h1>¡Listo, ${escapeHtml(String(form.get('name')).trim())}!</h1><p>Te avisaremos en la pantalla cuando sea tu turno.</p><button class="button button-primary" id="another-ticket">Solicitar otro turno</button></div><a class="back-link" href="./">Volver al panel de atención</a>`;
    speak(`Tu turno es ${ticket}. ${String(form.get('name')).trim()}, espera a que te llamemos.`);
    document.getElementById('another-ticket').onclick = renderKiosk;
  });
}
function toast(message) { const node=document.getElementById('toast'); node.textContent=message; node.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>node.classList.remove('show'),2600); }
document.getElementById('ticket-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  issueTicket(String(form.get('name')).trim(), String(form.get('service')));
  event.currentTarget.reset();
  document.getElementById('new-ticket-dialog').close();
  toast('Turno agregado a la fila.');
});
window.addEventListener('storage', event => {
  if (event.key !== KEY || !event.newValue) return;
  try {
    const updated = JSON.parse(event.newValue);
    activeCount = updated.counters.filter(counter => counter.ticket).length;
    const announcement = updated.announcement;
    const shouldAnnounce = route === 'pantalla' && soundEnabled && announcement?.id && announcement.id !== lastAnnouncementId;
    data = updated;
    lastAnnouncementId = announcement?.id || lastAnnouncementId;
    render();
    if (shouldAnnounce) speak(announcement.text);
  } catch (error) {
    console.error('No se pudo actualizar la fila de turnos.', error);
  }
});
render();

