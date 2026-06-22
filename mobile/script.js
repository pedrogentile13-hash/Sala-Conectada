/* ═══════════════════════════════════════════════
   Sala Conectada — Mobile
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

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hojeShort() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short"
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
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}

// ─────────────────────────────────────────────
// NAVEGAÇÃO: Onboarding ↔ App
// ─────────────────────────────────────────────
const onboarding = $("#onboarding");
const appShell   = $("#app");

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
  onboarding.classList.remove("show");
  appShell.classList.add("show");
  navigateTo(view || "dashboard");
}

function goOnboarding() {
  appShell.classList.remove("show");
  onboarding.classList.add("show");
  window.scrollTo(0, 0);
}

function navigateTo(view) {
  // Views
  $$(".view").forEach(v => v.classList.toggle("show", v.dataset.view === view));

  // Bottom nav
  $$(".bn-item").forEach(b => b.classList.toggle("active", b.dataset.nav === view));

  // Topbar
  const titleEl = $("#topbar-title");
  if (titleEl) titleEl.textContent = PAGE_TITLES[view] || view;

  // Scroll topo
  const container = $("#views-container");
  if (container) container.scrollTop = 0;
}

// Bind botões [data-go]
$$("[data-go]").forEach(el => {
  el.addEventListener("click", () => {
    const target = el.dataset.go;
    if (target === "onboarding") goOnboarding();
    else goApp(target);
  });
});

// Bind navegação [data-nav]
$$("[data-nav]").forEach(el => {
  el.addEventListener("click", () => navigateTo(el.dataset.nav));
});

// ─────────────────────────────────────────────
// ABAS DE SUGESTÕES
// ─────────────────────────────────────────────
$$(".sug-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    $$(".sug-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    $$("#sug-tab-form, #sug-tab-list").forEach(p => p.classList.remove("show"));
    $(`#sug-tab-${target}`).classList.add("show");
  });
});

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function updateDashboard() {
  const provas     = db.calendario.filter(c => c.categoria === "Prova").length;
  const pendentes  = db.tarefas.filter(t => t.status !== "Concluída").length;
  const impAvisos  = db.avisos.filter(a => a.importante).length;
  const concluidas = db.tarefas.filter(t => t.status === "Concluída").length;
  const total      = db.tarefas.length;
  const org        = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  // Stats
  $("#stat-provas").textContent  = provas;
  $("#stat-tarefas").textContent = pendentes;
  $("#stat-avisos").textContent  = impAvisos;
  $("#stat-eventos").textContent = db.eventos.length;

  // Mini stats
  $("#mini-conc").textContent = concluidas;
  $("#mini-pend").textContent = pendentes;
  $("#mini-sug").textContent  = db.sugestoes.length;

  // Org pill + progress
  const pctEl = $("#dash-org-pct");
  if (pctEl) pctEl.textContent = org + "%";

  const fillEl = $("#org-fill");
  if (fillEl) fillEl.style.width = org + "%";

  const pctBigEl = $("#org-pct");
  if (pctBigEl) pctBigEl.textContent = org + "%";

  const labelEl = $("#org-label");
  if (labelEl) {
    labelEl.textContent = total === 0
      ? "Aguardando dados"
      : org >= 80 ? "Ótima organização! 🎯"
      : org >= 50 ? "Bom progresso! 💪"
      : "Continue assim! 📚";
  }

  // Data
  const dateEl = $("#dash-date");
  if (dateEl) dateEl.textContent = hojeShort();

  // Feed
  renderActivityFeed(provas, concluidas, total, impAvisos);
}

function renderActivityFeed(provas, conc, total, avisos) {
  const feed = $("#activity-feed");
  const items = [];

  if (total > 0)   items.push(`📝 ${conc} de ${total} tarefas concluídas`);
  if (provas > 0)  items.push(`📅 ${provas} prova${provas > 1 ? "s" : ""} no calendário`);
  if (avisos > 0)  items.push(`📣 ${avisos} aviso${avisos > 1 ? "s" : ""} importante${avisos > 1 ? "s" : ""}`);
  if (db.eventos.length > 0) items.push(`🎉 ${db.eventos.length} evento${db.eventos.length > 1 ? "s" : ""} próximo${db.eventos.length > 1 ? "s" : ""}`);
  if (db.sugestoes.length > 0) items.push(`💬 ${db.sugestoes.length} sugestão${db.sugestoes.length > 1 ? "ões" : ""} enviada${db.sugestoes.length > 1 ? "s" : ""}`);

  if (items.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📋</div>
        <p>Nenhuma atividade registrada ainda.</p>
      </div>`;
    return;
  }

  feed.innerHTML = items.map(t => `
    <div class="activity-row">
      <div class="act-dot"></div>
      <span>${esc(t)}</span>
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
  const c = $("#calendar-list");
  if (db.calendario.length === 0) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📅</div>
        <h4>Nenhuma data cadastrada</h4>
        <p>Datas de provas, trabalhos e eventos vão aparecer aqui.</p>
      </div>`;
    return;
  }
  c.innerHTML = db.calendario.map(item => `
    <div class="list-item">
      <div class="li-body">
        <h4>${esc(item.titulo)}</h4>
      </div>
      <div class="li-footer">
        <span class="li-date">📅 ${esc(item.data)}</span>
        <span class="tag ${CAT_TAG[item.categoria] || "tag-cat"}">${esc(item.categoria)}</span>
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

  const c = $("#task-list");

  if (lista.length === 0) {
    const msg = filtroTarefas === "todas"
      ? "Nenhuma tarefa cadastrada ainda."
      : `Nenhuma tarefa "${filtroTarefas}".`;
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">✅</div>
        <h4>${msg}</h4>
        <p>As tarefas aparecerão aqui quando forem adicionadas.</p>
      </div>`;
    return;
  }

  c.innerHTML = lista.map(t => `
    <div class="list-item task-item ${t.status === "Concluída" ? "done" : ""}">
      <div class="li-body">
        <span class="subject-pill">${esc(t.materia)}</span>
        <h4>${esc(t.titulo)}</h4>
        <p>Entrega: ${esc(t.entrega)}</p>
      </div>
      <div class="li-footer">
        <span class="tag ${STATUS_TAG[t.status] || ""}">${esc(t.status)}</span>
        <button
          class="task-done-btn ${t.status === "Concluída" ? "done" : ""}"
          data-task="${t.id}"
          ${t.status === "Concluída" ? "disabled" : ""}>
          ${t.status === "Concluída" ? "✓ Feita" : "Concluir"}
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
    showToast("✅ Tarefa concluída! Arrasou!");
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
  const c = $("#notice-list");
  if (db.avisos.length === 0) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📣</div>
        <h4>Nenhum aviso publicado</h4>
        <p>Comunicados da escola e da coordenação vão aparecer aqui.</p>
      </div>`;
    return;
  }
  c.innerHTML = db.avisos.map(a => `
    <div class="list-item ${a.importante ? "important" : ""}">
      <div class="li-body">
        <h4>
          ${esc(a.titulo)}
          ${a.importante ? `<span class="notice-imp-badge">IMPORTANTE</span>` : ""}
        </h4>
        <p>${esc(a.desc)}</p>
        <p style="margin-top:4px;font-size:12px;color:var(--muted)">✍️ ${esc(a.autor)}</p>
      </div>
      <div class="li-footer">
        <span class="li-date">📅 ${esc(a.data)}</span>
      </div>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// EVENTOS
// ─────────────────────────────────────────────
function renderEvents() {
  const c = $("#event-list");
  if (db.eventos.length === 0) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🎉</div>
        <h4>Nenhum evento agendado</h4>
        <p>Eventos, feiras e palestras vão aparecer aqui quando forem adicionados.</p>
      </div>`;
    return;
  }
  c.innerHTML = db.eventos.map(e => `
    <div class="list-item">
      <div class="li-body">
        <h4>🎉 ${esc(e.nome)}</h4>
        <p>${esc(e.desc)}</p>
        <p class="event-meta">📍 ${esc(e.local)} &nbsp;•&nbsp; ⏰ ${esc(e.hora)}</p>
      </div>
      <div class="li-footer">
        <span class="li-date">📅 ${esc(e.data)}</span>
      </div>
    </div>`).join("");
}

// ─────────────────────────────────────────────
// SUGESTÕES
// ─────────────────────────────────────────────
function renderSuggestions() {
  const c      = $("#suggest-list");
  const countEl = $("#sug-count");
  if (countEl) countEl.textContent = db.sugestoes.length;

  if (db.sugestoes.length === 0) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">💬</div>
        <h4>Nenhuma sugestão ainda</h4>
        <p>Seja o primeiro a enviar uma ideia para melhorar a escola!</p>
      </div>`;
    return;
  }
  c.innerHTML = db.sugestoes.map(s => `
    <div class="list-item">
      <div class="li-body">
        <h4>${esc(s.titulo)}</h4>
        <p>${esc(s.desc)}</p>
      </div>
      <div class="li-footer">
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

  // Muda para aba da lista
  const listTab = $('[data-tab="list"]');
  if (listTab) listTab.click();

  showToast("💬 Sugestão enviada! Obrigado!");
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

  renderAchievements(conc);
}

function renderAchievements(conc) {
  const list = [
    {
      icon: "🔥",
      title: "Sequência de 7 dias",
      desc: "Organize tarefas por 7 dias seguidos",
      unlocked: false,
    },
    {
      icon: "⭐",
      title: "5 no prazo",
      desc: "Entregue 5 trabalhos no prazo",
      unlocked: conc >= 5,
    },
    {
      icon: "💬",
      title: "Primeira sugestão",
      desc: "Envie sua primeira sugestão",
      unlocked: db.sugestoes.length >= 1,
    },
    {
      icon: "📅",
      title: "Nunca perdeu uma prova",
      desc: "Consulte o calendário regularmente",
      unlocked: false,
    },
  ];

  const el = $("#achievements-list");
  if (!el) return;
  el.innerHTML = list.map(a => `
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
