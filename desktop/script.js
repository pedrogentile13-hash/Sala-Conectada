/* ═══════════════════════════════════════════════
   Sala Conectada — Desktop
   script.js
   Banco zerado: sem dados de exemplo.
   Pronto para integração com backend.
═══════════════════════════════════════════════ */

// ─────────────────────────────────────────────
// ESTADO DA APLICAÇÃO (banco zerado)
// ─────────────────────────────────────────────
const db = {
  calendario: [],   // { titulo, data, categoria }
  tarefas:    [],   // { id, materia, titulo, entrega, status }
  avisos:     [],   // { titulo, autor, data, desc, importante }
  eventos:    [],   // { nome, data, hora, local, desc }
  sugestoes:  [],   // { titulo, categoria, desc, status }
};

let filtroTarefas = "todas";
let nextTaskId    = 1;

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hoje() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2800);
}

// ─────────────────────────────────────────────
// NAVEGAÇÃO
// ─────────────────────────────────────────────
const landing  = $("#landing");
const appShell = $("#app");

const PAGE_TITLES = {
  dashboard:  "Início",
  calendario: "Calendário",
  tarefas:    "Tarefas",
  avisos:     "Avisos",
  eventos:    "Eventos",
  sugestoes:  "Sugestões",
  perfil:     "Perfil",
};

function goApp(view) {
  landing.classList.remove("show");
  appShell.classList.add("show");
  navigateTo(view || "dashboard");
}

function goLanding() {
  appShell.classList.remove("show");
  landing.classList.add("show");
  window.scrollTo(0, 0);
}

function navigateTo(view) {
  $$(".view").forEach(v => v.classList.toggle("show", v.dataset.view === view));
  $$(".sb-item").forEach(b => b.classList.toggle("active", b.dataset.nav === view));
  $$(".topbar-avatar[data-nav]").forEach(b => b.classList.toggle("active", b.dataset.nav === view));
  const title = PAGE_TITLES[view] || view;
  $("#topbar-title").textContent = title;
  $(".views-container").scrollTop = 0;
}

// ─── Bind: botões [data-go] ───
$$("[data-go]").forEach(el => {
  el.addEventListener("click", () => {
    const target = el.dataset.go;
    target === "landing" ? goLanding() : goApp(target);
  });
});

// ─── Bind: nav items ───
$$("[data-nav]").forEach(el => {
  el.addEventListener("click", () => navigateTo(el.dataset.nav));
});

// ─── Sidebar collapse ───
let collapsed = false;
const sidebar = $("#sidebar");
const sbToggle = $("#sb-toggle");

sbToggle.addEventListener("click", () => {
  collapsed = !collapsed;
  sidebar.classList.toggle("collapsed", collapsed);
});

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function updateDashboard() {
  const provas    = db.calendario.filter(c => c.categoria === "Prova").length;
  const pendentes = db.tarefas.filter(t => t.status !== "Concluída").length;
  const impAvisos = db.avisos.filter(a => a.importante).length;
  const concluidas = db.tarefas.filter(t => t.status === "Concluída").length;
  const total = db.tarefas.length;
  const org = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  $("#stat-provas").textContent  = provas;
  $("#stat-tarefas").textContent = pendentes;
  $("#stat-avisos").textContent  = impAvisos;
  $("#stat-eventos").textContent = db.eventos.length;

  $("#mini-conc").textContent = concluidas;
  $("#mini-pend").textContent = pendentes;
  $("#mini-sug").textContent  = db.sugestoes.length;

  // Badge de avisos na sidebar
  const badge = $("#badge-avisos");
  if (impAvisos > 0) {
    badge.textContent = impAvisos;
    badge.style.display = "block";
  } else {
    badge.style.display = "none";
  }

  // Donut de organização
  const circumference = 314.16;
  const offset = circumference - (org / 100) * circumference;
  const arc = $("#org-arc");
  if (arc) arc.style.strokeDashoffset = offset;
  $("#org-pct").textContent = org + "%";

  // Activity feed
  renderActivityFeed(provas, concluidas, total, impAvisos);

  // Data
  const dateEl = $("#dash-date");
  if (dateEl) dateEl.textContent = "Hoje é " + hoje() + ".";
}

function renderActivityFeed(provas, conc, total, avisos) {
  const feed = $("#activity-feed");
  const items = [];

  if (total > 0)   items.push(`📝 ${conc} de ${total} tarefas concluídas`);
  if (provas > 0)  items.push(`📅 ${provas} prova${provas > 1 ? "s" : ""} marcada${provas > 1 ? "s" : ""} no calendário`);
  if (avisos > 0)  items.push(`📣 ${avisos} aviso${avisos > 1 ? "s" : ""} importante${avisos > 1 ? "s" : ""} da coordenação`);
  if (db.eventos.length > 0) items.push(`🎉 ${db.eventos.length} evento${db.eventos.length > 1 ? "s" : ""} próximo${db.eventos.length > 1 ? "s" : ""}`);
  if (db.sugestoes.length > 0) items.push(`💬 ${db.sugestoes.length} sugestão${db.sugestoes.length > 1 ? "ões" : ""} enviada${db.sugestoes.length > 1 ? "s" : ""}`);

  if (items.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📋</div>
        <h4>Nenhuma atividade ainda</h4>
        <p>O resumo da semana aparecerá aqui quando houver dados cadastrados na plataforma.</p>
      </div>`;
    return;
  }

  feed.innerHTML = items.map(text => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <span class="activity-text">${esc(text)}</span>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// CALENDÁRIO
// ─────────────────────────────────────────────
const CAT_TAG = {
  Prova:    "tag-prova",
  Trabalho: "tag-trabalho",
  Evento:   "tag-evento",
  Reunião:  "tag-reuniao",
};

function renderCalendar() {
  const container = $("#calendar-list");
  if (db.calendario.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📅</div>
        <h4>Nenhuma data cadastrada</h4>
        <p>Datas de provas, trabalhos, eventos e reuniões aparecerão aqui quando forem adicionadas.</p>
      </div>`;
    return;
  }
  container.innerHTML = db.calendario.map(c => `
    <div class="list-item">
      <div class="item-body">
        <h4>${esc(c.titulo)}</h4>
      </div>
      <div class="item-aside">
        <span class="tag ${CAT_TAG[c.categoria] || "tag-cat"}">${esc(c.categoria)}</span>
        <span class="item-date">📅 ${esc(c.data)}</span>
      </div>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// TAREFAS
// ─────────────────────────────────────────────
const STATUS_TAG = {
  "Pendente":     "tag-pendente",
  "Em andamento": "tag-andamento",
  "Concluída":    "tag-concluida",
};

function renderTasks() {
  const lista = filtroTarefas === "todas"
    ? db.tarefas
    : db.tarefas.filter(t => t.status === filtroTarefas);

  const container = $("#task-list");

  if (lista.length === 0) {
    const msg = filtroTarefas === "todas"
      ? "Nenhuma tarefa cadastrada ainda."
      : `Nenhuma tarefa com status "${filtroTarefas}".`;
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">✅</div>
        <h4>${msg}</h4>
        <p>As tarefas vão aparecer aqui quando forem adicionadas à plataforma.</p>
      </div>`;
    return;
  }

  container.innerHTML = lista.map(t => `
    <div class="list-item task-item ${t.status === "Concluída" ? "done" : ""}">
      <div class="item-body">
        <span class="subject-pill">${esc(t.materia)}</span>
        <h4>${esc(t.titulo)}</h4>
        <p>Entrega: ${esc(t.entrega)}</p>
      </div>
      <div class="item-aside">
        <span class="tag ${STATUS_TAG[t.status] || ""}">${esc(t.status)}</span>
        <button
          class="btn-done ${t.status === "Concluída" ? "done" : ""}"
          data-task="${t.id}"
          ${t.status === "Concluída" ? "disabled" : ""}>
          ${t.status === "Concluída" ? "✓ Concluída" : "Marcar concluída"}
        </button>
      </div>
    </div>`).join("");

  $$("[data-task]").forEach(btn =>
    btn.addEventListener("click", () => completeTask(+btn.dataset.task))
  );
}

function completeTask(id) {
  const task = db.tarefas.find(t => t.id === id);
  if (task && task.status !== "Concluída") {
    task.status = "Concluída";
    renderTasks();
    updateDashboard();
    updateProfile();
    showToast("✅ Tarefa marcada como concluída!");
  }
}

// Filtros
$$("#task-filters .chip").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("#task-filters .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    filtroTarefas = chip.dataset.filter;
    renderTasks();
  });
});

// ─────────────────────────────────────────────
// AVISOS
// ─────────────────────────────────────────────
function renderNotices() {
  const container = $("#notice-list");
  if (db.avisos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📣</div>
        <h4>Nenhum aviso publicado</h4>
        <p>Comunicados da escola e da coordenação aparecerão aqui quando forem publicados.</p>
      </div>`;
    return;
  }
  container.innerHTML = db.avisos.map(a => `
    <div class="list-item ${a.importante ? "important" : ""}">
      <div class="item-body">
        <h4>
          ${esc(a.titulo)}
          ${a.importante ? `<span class="notice-badge">IMPORTANTE</span>` : ""}
        </h4>
        <p>${esc(a.desc)}</p>
        <p style="margin-top:6px;font-size:12px;color:var(--muted)">✍️ ${esc(a.autor)}</p>
      </div>
      <div class="item-aside">
        <span class="item-date">📅 ${esc(a.data)}</span>
      </div>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// EVENTOS
// ─────────────────────────────────────────────
function renderEvents() {
  const container = $("#event-list");
  if (db.eventos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🎉</div>
        <h4>Nenhum evento agendado</h4>
        <p>Eventos, feiras, torneios e palestras aparecerão aqui quando forem adicionados.</p>
      </div>`;
    return;
  }
  container.innerHTML = db.eventos.map(e => `
    <div class="list-item">
      <div class="item-body">
        <h4>🎉 ${esc(e.nome)}</h4>
        <p>${esc(e.desc)}</p>
        <p class="event-location">📍 ${esc(e.local)} &nbsp;•&nbsp; ⏰ ${esc(e.hora)}</p>
      </div>
      <div class="item-aside">
        <span class="item-date">📅 ${esc(e.data)}</span>
      </div>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// SUGESTÕES
// ─────────────────────────────────────────────
function renderSuggestions() {
  const container = $("#suggest-list");
  const count     = $("#sug-count");

  count.textContent = db.sugestoes.length;

  if (db.sugestoes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">💬</div>
        <h4>Nenhuma sugestão ainda</h4>
        <p>Seja o primeiro a enviar uma ideia para melhorar a escola!</p>
      </div>`;
    return;
  }

  container.innerHTML = db.sugestoes.map(s => `
    <div class="list-item">
      <div class="item-body">
        <h4>${esc(s.titulo)}</h4>
        <p>${esc(s.desc)}</p>
      </div>
      <div class="item-aside">
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
  renderSuggestions();
  updateDashboard();
  updateProfile();
  e.target.reset();
  showToast("💬 Sugestão enviada! Obrigado por contribuir.");
});

// ─────────────────────────────────────────────
// PERFIL
// ─────────────────────────────────────────────
function updateProfile() {
  const conc  = db.tarefas.filter(t => t.status === "Concluída").length;
  const total = db.tarefas.length;
  const org   = total > 0 ? Math.round((conc / total) * 100) : 0;

  $("#prof-conc").textContent = conc;
  $("#prof-sug").textContent  = db.sugestoes.length;
  $("#prof-org").textContent  = org + "%";

  updateAchievements(conc);
}

function updateAchievements(conc) {
  const achievements = [
    {
      id: "streak",
      icon: "🔥",
      title: "Sequência de 7 dias",
      desc: "Organize tarefas por 7 dias seguidos",
      unlocked: false, // lógica futura com backend
    },
    {
      id: "five-on-time",
      icon: "⭐",
      title: "5 no prazo",
      desc: "Entregue 5 trabalhos antes do prazo",
      unlocked: conc >= 5,
    },
    {
      id: "first-sug",
      icon: "💬",
      title: "Primeira sugestão",
      desc: "Envie sua primeira sugestão para a escola",
      unlocked: db.sugestoes.length >= 1,
    },
    {
      id: "calendar",
      icon: "📅",
      title: "Nunca perdeu uma prova",
      desc: "Consulte o calendário regularmente",
      unlocked: false, // lógica futura
    },
  ];

  $("#achievements-list").innerHTML = achievements.map(a => `
    <div class="achievement ${a.unlocked ? "unlocked" : "locked"}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-info">
        <strong>${esc(a.title)}</strong>
        <small>${esc(a.desc)}</small>
      </div>
      <div class="ach-lock">${a.unlocked ? "✅" : "🔒"}</div>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────
function init() {
  renderCalendar();
  renderTasks();
  renderNotices();
  renderEvents();
  renderSuggestions();
  updateDashboard();
  updateProfile();
}

init();
