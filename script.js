/* =====================================================
   Sala Conectada — script.js
   Navegação + dados mockados + interações
   ===================================================== */

// ---------- DADOS MOCKADOS ----------
const calendario = [
  { titulo: "Prova de Matemática", data: "12/06/2026", categoria: "Prova" },
  { titulo: "Entrega do Trabalho de Ciências", data: "15/06/2026", categoria: "Trabalho" },
  { titulo: "Feira Cultural", data: "20/06/2026", categoria: "Evento" },
  { titulo: "Reunião de Pais e Mestres", data: "25/06/2026", categoria: "Reunião" },
  { titulo: "Prova de História", data: "27/06/2026", categoria: "Prova" },
  { titulo: "Festa Junina da Escola", data: "28/06/2026", categoria: "Evento" },
];

let tarefas = [
  { id: 1, materia: "Matemática", titulo: "Lista de exercícios — equações", entrega: "11/06/2026", status: "Pendente" },
  { id: 2, materia: "Português", titulo: "Resumo do livro 'Dom Casmurro'", entrega: "13/06/2026", status: "Em andamento" },
  { id: 3, materia: "Ciências", titulo: "Maquete do sistema solar", entrega: "15/06/2026", status: "Pendente" },
  { id: 4, materia: "Geografia", titulo: "Mapa das regiões do Brasil", entrega: "09/06/2026", status: "Concluída" },
  { id: 5, materia: "Inglês", titulo: "Vocabulário — unidade 4", entrega: "10/06/2026", status: "Concluída" },
  { id: 6, materia: "Artes", titulo: "Desenho com perspectiva", entrega: "18/06/2026", status: "Em andamento" },
];

const avisos = [
  { titulo: "Mudança no horário do recreio", autor: "Coordenação", data: "08/06/2026", desc: "A partir desta semana o recreio será às 10h.", importante: true },
  { titulo: "Campanha do agasalho", autor: "Grêmio Estudantil", data: "07/06/2026", desc: "Traga roupas em bom estado para doação até dia 20/06.", importante: false },
  { titulo: "Provas do bimestre", autor: "Secretaria", data: "06/06/2026", desc: "As provas começam dia 12/06. Confira o calendário.", importante: true },
  { titulo: "Biblioteca com novos livros", autor: "Profª. Helena", data: "05/06/2026", desc: "Novos títulos disponíveis para empréstimo.", importante: false },
];

const eventos = [
  { nome: "Feira Cultural", data: "20/06/2026", hora: "09h00", local: "Quadra coberta", desc: "Apresentações dos projetos de cada turma." },
  { nome: "Festa Junina", data: "28/06/2026", hora: "18h00", local: "Pátio da escola", desc: "Comidas típicas, quadrilha e brincadeiras." },
  { nome: "Torneio de Vôlei", data: "22/06/2026", hora: "14h00", local: "Ginásio", desc: "Disputa entre as turmas do 9º ano." },
  { nome: "Palestra: Profissões do Futuro", data: "24/06/2026", hora: "10h00", local: "Auditório", desc: "Convidados falam sobre carreiras e mercado de trabalho." },
];

let sugestoes = [
  { titulo: "Mais opções veganas na cantina", categoria: "Infraestrutura", desc: "Seria ótimo ter lanches sem ingredientes de origem animal.", status: "Em análise" },
  { titulo: "Clube de leitura", categoria: "Estudos", desc: "Um encontro semanal para discutir livros.", status: "Em análise" },
];

// ---------- NAVEGAÇÃO ----------
const landing = document.getElementById("landing");
const app = document.getElementById("app");

function showApp(view) {
  landing.classList.remove("active-view");
  app.classList.add("active-view");
  navigate(view || "dashboard");
  window.scrollTo(0, 0);
}
function showLanding() {
  app.classList.remove("active-view");
  landing.classList.add("active-view");
  window.scrollTo(0, 0);
}

function navigate(view) {
  document.querySelectorAll(".view").forEach(v =>
    v.classList.toggle("active-view", v.dataset.view === view)
  );
  document.querySelectorAll(".nav-item, .bn-item").forEach(b =>
    b.classList.toggle("active", b.dataset.nav === view)
  );
  document.querySelector(".content").scrollTo?.(0, 0);
}

document.querySelectorAll("[data-go]").forEach(el =>
  el.addEventListener("click", () => {
    const target = el.dataset.go;
    target === "landing" ? showLanding() : showApp(target);
  })
);
document.querySelectorAll("[data-nav]").forEach(el =>
  el.addEventListener("click", () => navigate(el.dataset.nav))
);

// ---------- TOAST ----------
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ---------- RENDER: CALENDÁRIO ----------
function tagClass(cat) {
  return {
    Prova: "tag-prova", Trabalho: "tag-trabalho",
    Evento: "tag-evento", Reunião: "tag-reuniao"
  }[cat] || "tag-cat";
}
function renderCalendar() {
  document.getElementById("calendar-list").innerHTML = calendario.map(c => `
    <div class="item">
      <div class="item-main"><h4>${c.titulo}</h4></div>
      <div class="item-meta">
        <span class="tag ${tagClass(c.categoria)}">${c.categoria}</span>
        <span class="item-date">📅 ${c.data}</span>
      </div>
    </div>`).join("");
}

// ---------- RENDER: TAREFAS ----------
let filtroAtual = "todas";
function statusTag(s) {
  return s === "Concluída" ? "tag-concluida" : s === "Em andamento" ? "tag-andamento" : "tag-pendente";
}
function renderTasks() {
  const lista = tarefas.filter(t => filtroAtual === "todas" || t.status === filtroAtual);
  document.getElementById("task-list").innerHTML = lista.length ? lista.map(t => `
    <div class="item task ${t.status === "Concluída" ? "done" : ""}">
      <div class="item-main">
        <span class="subject-pill">${t.materia}</span>
        <h4>${t.titulo}</h4>
        <p>Entrega: ${t.entrega}</p>
      </div>
      <div class="item-meta">
        <span class="tag ${statusTag(t.status)}">${t.status}</span>
        <button class="btn-done ${t.status === "Concluída" ? "is-done" : ""}"
          ${t.status === "Concluída" ? "disabled" : ""} data-task="${t.id}">
          ${t.status === "Concluída" ? "✓ Concluída" : "Marcar como concluída"}
        </button>
      </div>
    </div>`).join("") : `<p class="muted">Nenhuma tarefa nesta categoria. 🎉</p>`;

  document.querySelectorAll("[data-task]").forEach(btn =>
    btn.addEventListener("click", () => concluirTarefa(+btn.dataset.task))
  );
}
function concluirTarefa(id) {
  const t = tarefas.find(t => t.id === id);
  if (t && t.status !== "Concluída") {
    t.status = "Concluída";
    renderTasks();
    updateDashboard();
    updateProfile();
    toast("✅ Tarefa concluída! Mandou bem!");
  }
}
document.querySelectorAll("#task-filters .chip").forEach(chip =>
  chip.addEventListener("click", () => {
    document.querySelectorAll("#task-filters .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    filtroAtual = chip.dataset.filter;
    renderTasks();
  })
);

// ---------- RENDER: AVISOS ----------
function renderNotices() {
  document.getElementById("notice-list").innerHTML = avisos.map(a => `
    <div class="item ${a.importante ? "important" : ""}">
      <div class="item-main">
        <h4>${a.titulo} ${a.importante ? '<span class="badge-important">IMPORTANTE</span>' : ""}</h4>
        <p>${a.desc}</p>
        <p class="muted" style="margin-top:6px">✍️ ${a.autor}</p>
      </div>
      <div class="item-meta"><span class="item-date">📅 ${a.data}</span></div>
    </div>`).join("");
}

// ---------- RENDER: EVENTOS ----------
function renderEvents() {
  document.getElementById("event-list").innerHTML = eventos.map(e => `
    <div class="item">
      <div class="item-main">
        <h4>🎉 ${e.nome}</h4>
        <p>${e.desc}</p>
        <p class="muted" style="margin-top:6px">📍 ${e.local} • ⏰ ${e.hora}</p>
      </div>
      <div class="item-meta"><span class="item-date">📅 ${e.data}</span></div>
    </div>`).join("");
}

// ---------- RENDER: SUGESTÕES ----------
function renderSuggestions() {
  document.getElementById("suggest-list").innerHTML = sugestoes.map(s => `
    <div class="item">
      <div class="item-main">
        <h4>${s.titulo}</h4>
        <p>${s.desc}</p>
      </div>
      <div class="item-meta">
        <span class="tag tag-cat">${s.categoria}</span>
        <span class="tag tag-analise">${s.status}</span>
      </div>
    </div>`).join("");
}
document.getElementById("suggest-form").addEventListener("submit", e => {
  e.preventDefault();
  const titulo = document.getElementById("sug-title").value.trim();
  const categoria = document.getElementById("sug-cat").value;
  const desc = document.getElementById("sug-desc").value.trim();
  if (!titulo || !desc) return;
  sugestoes.unshift({ titulo, categoria, desc, status: "Em análise" });
  renderSuggestions();
  updateProfile();
  updateDashboard();
  e.target.reset();
  toast("💬 Sugestão enviada! Obrigado por contribuir.");
});

// ---------- DASHBOARD ----------
function updateDashboard() {
  const provas = calendario.filter(c => c.categoria === "Prova").length;
  const pendentes = tarefas.filter(t => t.status !== "Concluída").length;
  const avisosImp = avisos.filter(a => a.importante).length;
  const concluidas = tarefas.filter(t => t.status === "Concluída").length;

  document.getElementById("stat-provas").textContent = provas;
  document.getElementById("stat-tarefas").textContent = pendentes;
  document.getElementById("stat-avisos").textContent = avisosImp;
  document.getElementById("stat-eventos").textContent = eventos.length;

  document.getElementById("mini-conc").textContent = concluidas;
  document.getElementById("mini-pend").textContent = pendentes;
  document.getElementById("mini-sug").textContent = sugestoes.length;

  // nível de organização = % de tarefas concluídas (mín. 40 para visual)
  const org = Math.round((concluidas / tarefas.length) * 100);
  const orgShow = Math.max(org, 0);
  document.getElementById("org-fill").style.width = orgShow + "%";
  document.getElementById("org-percent").textContent = orgShow + "%";

  document.getElementById("summary-list").innerHTML = `
    <li>📝 ${provas} provas marcadas para os próximos dias</li>
    <li>✅ ${concluidas} de ${tarefas.length} tarefas concluídas</li>
    <li>📣 ${avisosImp} avisos importantes da coordenação</li>
    <li>🎉 ${eventos.length} eventos acontecendo na escola</li>
    <li>💬 ${sugestoes.length} sugestões enviadas pela turma</li>`;
}

// ---------- PERFIL ----------
function updateProfile() {
  const concluidas = tarefas.filter(t => t.status === "Concluída").length;
  const org = Math.round((concluidas / tarefas.length) * 100);
  document.getElementById("prof-tarefas").textContent = concluidas;
  document.getElementById("prof-sug").textContent = sugestoes.length;
  document.getElementById("prof-org").textContent = org + "%";
}

// ---------- INIT ----------
renderCalendar();
renderTasks();
renderNotices();
renderEvents();
renderSuggestions();
updateDashboard();
updateProfile();
