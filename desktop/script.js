/* ════════════════════════════════════════
   Sala Conectada — Desktop
   Banco zerado · pronto para backend
════════════════════════════════════════ */

const db = {
  calendario: [],
  tarefas:    [],
  avisos:     [],
  eventos:    [],
  sugestoes:  [],
};

let filtroTarefas = "todas";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

/* ── DATA ── */
function dataHoje() {
  return new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" });
}
function dataHojeShort() {
  const d = new Date();
  const dia = d.toLocaleDateString("pt-BR", { weekday:"short" });
  const num = d.getDate();
  const mes = d.toLocaleDateString("pt-BR", { month:"long" });
  return `${dia.charAt(0).toUpperCase()+dia.slice(1)}, ${num} de ${mes}`;
}

/* ── TOAST ── */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2800);
}

/* ── NAVEGAÇÃO ── */
const landing = $("#landing");
const appEl   = $("#app");

const TITLES = {
  dashboard: ["Dashboard", "Resumo da sua semana escolar"],
  calendario:["Calendário", "Datas importantes do bimestre"],
  tarefas:   ["Tarefas", "Acompanhe seus trabalhos e prazos"],
  avisos:    ["Avisos", "Comunicados da escola e da coordenação"],
  eventos:   ["Eventos", "Tudo que vai acontecer na escola"],
  sugestoes: ["Sugestões", "Contribua com ideias para melhorar a escola"],
  perfil:    ["Meu Perfil", "Seu desempenho e conquistas"],
};

function goApp(view) {
  landing.classList.remove("show");
  appEl.classList.add("show");
  navigateTo(view || "dashboard");
}

function goLanding() {
  appEl.classList.remove("show");
  landing.classList.add("show");
  window.scrollTo(0, 0);
}

function navigateTo(view) {
  $$(".view").forEach(v => v.classList.toggle("show", v.dataset.view === view));
  $$(".sb-item").forEach(b => b.classList.toggle("active", b.dataset.nav === view));
  const [title, sub] = TITLES[view] || [view, ""];
  $("#topbar-title").textContent = title;
  $("#topbar-sub").textContent   = sub;
  $(".view-container").scrollTop = 0;
}

$$("[data-go]").forEach(el =>
  el.addEventListener("click", () => {
    el.dataset.go === "landing" ? goLanding() : goApp(el.dataset.go);
  })
);
$$("[data-nav]").forEach(el =>
  el.addEventListener("click", () => navigateTo(el.dataset.nav))
);

/* ── DASHBOARD ── */
function updateDashboard() {
  const provas    = db.calendario.filter(c => c.categoria === "Prova").length;
  const pendentes = db.tarefas.filter(t => t.status !== "Concluída").length;
  const impAvisos = db.avisos.filter(a => a.importante).length;
  const concluidas= db.tarefas.filter(t => t.status === "Concluída").length;
  const total     = db.tarefas.length;
  const org       = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  $("#stat-provas").textContent  = provas;
  $("#stat-tarefas").textContent = pendentes;
  $("#stat-avisos").textContent  = impAvisos;
  $("#stat-eventos").textContent = db.eventos.length;
  $("#mini-conc").textContent    = concluidas;
  $("#mini-pend").textContent    = pendentes;
  $("#mini-sug").textContent     = db.sugestoes.length;

  const arc = $("#org-arc");
  if (arc) arc.style.strokeDashoffset = 314.16 - (org / 100) * 314.16;
  $("#org-pct").textContent = org + "%";

  const badge = $("#badge-tarefas");
  if (pendentes > 0) { badge.textContent = pendentes; badge.style.display = ""; }
  else               { badge.style.display = "none"; }

  const dateEl = $("#topbar-date-text");
  if (dateEl) dateEl.textContent = dataHojeShort();

  const feed = $("#activity-feed");
  const items = [];
  if (total > 0)            items.push(`${concluidas} de ${total} tarefas concluídas`);
  if (provas > 0)           items.push(`${provas} prova${provas>1?"s":""} marcada${provas>1?"s":""} no calendário`);
  if (impAvisos > 0)        items.push(`${impAvisos} aviso${impAvisos>1?"s":""} importante${impAvisos>1?"s":""}`);
  if (db.eventos.length > 0) items.push(`${db.eventos.length} evento${db.eventos.length>1?"s":""} próximo${db.eventos.length>1?"s":""}`);

  feed.innerHTML = items.length
    ? items.map(t => `<div class="activity-item"><div class="act-dot"></div><span>${esc(t)}</span></div>`).join("")
    : `<div class="empty-state"><div class="es-icon">📋</div><h4>Nenhuma atividade ainda</h4><p>Os dados vão aparecer aqui quando cadastrados.</p></div>`;
}

/* ── CALENDÁRIO ── */
const CAT_TAG = { Prova:"tag-prova", Trabalho:"tag-trabalho", Evento:"tag-evento", Reunião:"tag-reuniao" };

function renderCalendar() {
  const c = $("#calendar-list");
  if (!db.calendario.length) {
    c.innerHTML = `<div class="empty-state"><div class="es-icon">📅</div><h4>Nenhuma data cadastrada</h4><p>Datas de provas, trabalhos e eventos vão aparecer aqui.</p></div>`;
    return;
  }
  c.innerHTML = db.calendario.map(i => `
    <div class="list-item">
      <div class="li-body"><h4>${esc(i.titulo)}</h4></div>
      <div class="li-aside">
        <span class="tag ${CAT_TAG[i.categoria]||"tag-cat"}">${esc(i.categoria)}</span>
        <span class="li-date">📅 ${esc(i.data)}</span>
      </div>
    </div>`).join("");
}

/* ── TAREFAS ── */
const ST_TAG = { "Pendente":"tag-pendente","Em andamento":"tag-andamento","Concluída":"tag-concluida" };

function renderTasks() {
  const lista = filtroTarefas === "todas" ? db.tarefas : db.tarefas.filter(t => t.status === filtroTarefas);
  const c = $("#task-list");
  if (!lista.length) {
    c.innerHTML = `<div class="empty-state"><div class="es-icon">✅</div><h4>${filtroTarefas==="todas"?"Nenhuma tarefa cadastrada":`Sem tarefas "${filtroTarefas}"`}</h4><p>As tarefas aparecerão aqui quando adicionadas.</p></div>`;
    return;
  }
  c.innerHTML = lista.map(t => `
    <div class="list-item ${t.status==="Concluída"?"task-done":""}">
      <div class="li-body">
        <span class="subj">${esc(t.materia)}</span>
        <h4>${esc(t.titulo)}</h4>
        <p>Entrega: ${esc(t.entrega)}</p>
      </div>
      <div class="li-aside">
        <span class="tag ${ST_TAG[t.status]||""}">${esc(t.status)}</span>
        <button class="btn-done ${t.status==="Concluída"?"done":""}" data-task="${t.id}" ${t.status==="Concluída"?"disabled":""}>
          ${t.status==="Concluída"?"✓ Feita":"Concluir"}
        </button>
      </div>
    </div>`).join("");
  $$("[data-task]").forEach(btn => btn.addEventListener("click", () => completeTask(+btn.dataset.task)));
}

function completeTask(id) {
  const t = db.tarefas.find(t => t.id === id);
  if (t && t.status !== "Concluída") {
    t.status = "Concluída";
    renderTasks(); updateDashboard(); updateProfile();
    toast("✅ Tarefa concluída!");
  }
}

$$("#task-filters .filter-chip").forEach(chip =>
  chip.addEventListener("click", () => {
    $$("#task-filters .filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    filtroTarefas = chip.dataset.filter;
    renderTasks();
  })
);

/* ── AVISOS ── */
function renderNotices() {
  const c = $("#notice-list");
  if (!db.avisos.length) {
    c.innerHTML = `<div class="empty-state"><div class="es-icon">📣</div><h4>Nenhum aviso publicado</h4><p>Comunicados da escola aparecerão aqui.</p></div>`;
    return;
  }
  c.innerHTML = db.avisos.map(a => `
    <div class="list-item ${a.importante?"notice-imp":""}">
      <div class="li-body">
        <h4>${esc(a.titulo)}${a.importante?`<span class="notice-imp-badge">IMPORTANTE</span>`:""}</h4>
        <p>${esc(a.desc)}</p>
        <p style="margin-top:5px;font-size:12px;color:var(--muted)">✍️ ${esc(a.autor)}</p>
      </div>
      <div class="li-aside"><span class="li-date">📅 ${esc(a.data)}</span></div>
    </div>`).join("");
}

/* ── EVENTOS ── */
function renderEvents() {
  const c = $("#event-list");
  if (!db.eventos.length) {
    c.innerHTML = `<div class="empty-state"><div class="es-icon">🎉</div><h4>Nenhum evento agendado</h4><p>Eventos, palestras e atividades aparecerão aqui.</p></div>`;
    return;
  }
  c.innerHTML = db.eventos.map(e => `
    <div class="list-item">
      <div class="li-body">
        <h4>${esc(e.nome)}</h4>
        <p>${esc(e.desc)}</p>
        <p style="margin-top:5px;font-size:12px;color:var(--muted)">📍 ${esc(e.local)} · ⏰ ${esc(e.hora)}</p>
      </div>
      <div class="li-aside"><span class="li-date">📅 ${esc(e.data)}</span></div>
    </div>`).join("");
}

/* ── SUGESTÕES ── */
function renderSuggestions() {
  const c = $("#suggest-list");
  const badge = $("#sug-count");
  if (badge) badge.textContent = db.sugestoes.length;
  if (!db.sugestoes.length) {
    c.innerHTML = `<div class="empty-state"><div class="es-icon">💬</div><h4>Nenhuma sugestão ainda</h4><p>Seja o primeiro a contribuir!</p></div>`;
    return;
  }
  c.innerHTML = db.sugestoes.map(s => `
    <div class="list-item">
      <div class="li-body"><h4>${esc(s.titulo)}</h4><p>${esc(s.desc)}</p></div>
      <div class="li-aside">
        <span class="tag tag-cat">${esc(s.categoria)}</span>
        <span class="tag tag-analise">${esc(s.status)}</span>
      </div>
    </div>`).join("");
}

$("#suggest-form").addEventListener("submit", e => {
  e.preventDefault();
  const titulo = $("#sug-title").value.trim();
  const cat    = $("#sug-cat").value;
  const desc   = $("#sug-desc").value.trim();
  if (!titulo || !desc) return;
  db.sugestoes.unshift({ titulo, categoria: cat, desc, status: "Em análise" });
  renderSuggestions(); updateDashboard(); updateProfile();
  e.target.reset();
  toast("💬 Sugestão enviada! Obrigado.");
});

/* ── PERFIL ── */
function updateProfile() {
  const conc  = db.tarefas.filter(t => t.status === "Concluída").length;
  const total = db.tarefas.length;
  const org   = total > 0 ? Math.round((conc / total) * 100) : 0;
  $("#prof-conc").textContent = conc;
  $("#prof-sug").textContent  = db.sugestoes.length;
  $("#prof-org").textContent  = org + "%";
  renderAchievements(conc);
}

function renderAchievements(conc) {
  const list = [
    { icon:"🔥", title:"Sequência de 7 dias",      desc:"Organize tarefas por 7 dias seguidos",   unlocked: false },
    { icon:"⭐", title:"5 no prazo",                desc:"Entregue 5 trabalhos no prazo",           unlocked: conc >= 5 },
    { icon:"💬", title:"Primeira sugestão",         desc:"Envie sua primeira sugestão",             unlocked: db.sugestoes.length >= 1 },
    { icon:"📅", title:"Nunca perdeu uma prova",    desc:"Consulte o calendário regularmente",      unlocked: false },
  ];
  $("#achievements-list").innerHTML = list.map(a => `
    <div class="achievement ${a.unlocked?"":"locked"}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-info"><strong>${esc(a.title)}</strong><small>${esc(a.desc)}</small></div>
      <div class="ach-lock">${a.unlocked?"✅":"🔒"}</div>
    </div>`).join("");
}

/* ── INIT ── */
(function init() {
  const dateEl = $("#topbar-date-text");
  if (dateEl) dateEl.textContent = dataHojeShort();
  renderCalendar(); renderTasks(); renderNotices();
  renderEvents(); renderSuggestions();
  updateDashboard(); updateProfile();
})();
