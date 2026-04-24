import { carregarProjetos, getProjetos } from "./projetos.js";
import { carregarClientes, getClientes } from "./clientes.js";

let chart;

// =========================
// INIT
// =========================
initDashboard();

async function initDashboard() {
  try {
    await carregarProjetos();
    await carregarClientes();
    await carregarPlanoAtual();
    atualizarDashboard();
    aplicarBloqueiosPorPlano();
  } catch (err) {
    console.error("Erro initDashboard:", err);
  }
}

// =========================
// USUÁRIO (HEADER)
// =========================
const nome = localStorage.getItem("nome");

if (nome) {
  const elNome = document.getElementById("userNome");
  const saudacao = document.getElementById("saudacao");

  if (elNome) elNome.innerText = nome;
  if (saudacao) saudacao.innerText = `Bom dia, ${nome} 👋`;
}

// =========================
// PLANO (SYNC BACKEND)
// =========================
async function carregarPlanoAtual() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:3000/me", {
      headers: { Authorization: token }
    });

    const user = await res.json();

    if (user?.plano?.tipo) {
      localStorage.setItem("plano", user.plano.tipo);
    }

    const planTitle = document.querySelector(".plan-box h4");

    if (planTitle) {
      planTitle.innerText =
        user.plano.tipo === "pro" ? "Plano Pro" : "Plano Free";
    }

    return user.plano.tipo;

  } catch (err) {
    console.error("Erro ao carregar plano:", err);
    return "free";
  }
}

// =========================
// BLOQUEIO DE UI (SAAS REAL)
// =========================
function aplicarBloqueiosPorPlano() {
  const plano = localStorage.getItem("plano") || "free";

  if (plano !== "pro") {
    document.querySelectorAll("[data-premium]").forEach(el => {
      el.style.opacity = "0.5";
      el.style.pointerEvents = "none";
    });
  }
}

// =========================
// MAIN DASHBOARD
// =========================
export function atualizarDashboard() {
  const projetos = getProjetos();

  if (!document.getElementById("ganhos")) return;

  atualizarCards(projetos);
  renderGrafico(projetos);
  renderPrazos(projetos);
  renderTopClientes(projetos);
  renderProjetosRecentes(projetos);
  renderClientesRecentes();
}

// =========================
// CARDS
// =========================
function atualizarCards(projetos) {
  const mesAtual = new Date().getMonth();
  const mesPassado = mesAtual - 1;

  const atual = projetos
    .filter(p => p.pago && new Date(p.criadoEm).getMonth() === mesAtual)
    .reduce((t, p) => t + Number(p.valor), 0);

  const passado = projetos
    .filter(p => p.pago && new Date(p.criadoEm).getMonth() === mesPassado)
    .reduce((t, p) => t + Number(p.valor), 0);

  const diff = passado > 0 ? ((atual - passado) / passado) * 100 : 0;

  document.getElementById("ganhos").innerHTML =
    `R$ ${atual}
     <span style="font-size:11px; margin-left:6px; color:${diff >= 0 ? "#22C55E" : "#EF4444"}">
       ${diff.toFixed(0)}%
     </span>`;

  document.getElementById("totalProjetos").innerText = projetos.length;
  document.getElementById("concluidos").innerText = projetos.filter(p => p.pago).length;
  document.getElementById("pendentes").innerText = projetos.filter(p => !p.pago).length;
}

// =========================
// PRAZOS
// =========================
function renderPrazos(projetos) {
  const lista = document.querySelector(".box-prazos ul");
  if (!lista) return;

  lista.innerHTML = "";

  const hoje = new Date();

  const proximos = projetos
    .filter(p => p.prazo && !p.pago)
    .map(p => ({
      ...p,
      prazoDate: new Date(p.prazo)
    }))
    .filter(p => !isNaN(p.prazoDate))
    .sort((a, b) => a.prazoDate - b.prazoDate)
    .slice(0, 5);

  proximos.forEach(p => {
    const dias = Math.ceil((p.prazoDate - hoje) / (1000 * 60 * 60 * 24));

    const li = document.createElement("li");
    li.innerHTML = `
      ${p.nome}
      <span style="color:${dias <= 2 ? "#EF4444" : "#94A3B8"}">
        ${dias >= 0 ? dias + " dias" : "Atrasado"}
      </span>
    `;

    lista.appendChild(li);
  });
}

// =========================
// TOP CLIENTES
// =========================
function renderTopClientes(projetos) {
  const lista = document.querySelector(".box-clientes ul");
  if (!lista) return;

  lista.innerHTML = "";

  const mapa = {};

  projetos.forEach(p => {
    if (!p.pago) return;
    mapa[p.clienteNome] = (mapa[p.clienteNome] || 0) + Number(p.valor);
  });

  const top = Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  top.forEach(([nome, valor]) => {
    const li = document.createElement("li");
    li.innerHTML = `${nome} <span>R$ ${valor}</span>`;
    lista.appendChild(li);
  });
}

// =========================
// CLIENTES RECENTES
// =========================
function renderClientesRecentes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  const clientes = getClientes().slice(-5).reverse();

  clientes.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.nome}</strong>`;
    lista.appendChild(li);
  });
}

// =========================
// PROJETOS RECENTES
// =========================
function renderProjetosRecentes(projetos) {
  const lista = document.getElementById("listaProjetos");
  if (!lista) return;

  lista.innerHTML = "";

  projetos.slice(-5).reverse().forEach(p => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${p.nome}</strong><br>
        <small>${p.clienteNome || ""}</small>
      </div>

      <div>
        <span style="color:${p.pago ? "#22C55E" : "#FACC15"}">
          ${p.pago ? "✔" : "⏳"}
        </span>
        R$ ${p.valor}
      </div>
    `;

    lista.appendChild(li);
  });
}

// =========================
// GRÁFICO
// =========================
function renderGrafico(projetos) {
  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  if (chart) chart.destroy();

  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const dados = new Array(12).fill(0);

  projetos.forEach(p => {
    if (!p.pago) return;

    const mes = new Date(p.criadoEm).getMonth();
    dados[mes] += Number(p.valor);
  });

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        data: dados,
        borderColor: "#7C3AED",
        backgroundColor: "rgba(124,58,237,0.08)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true },
        x: { grid: { display: false } }
      }
    }
  });
}

// =========================
// BOTÃO PLANOS
// =========================
function irPlanos() {
  window.location.href = "planos.html";
}

window.irPlanos = irPlanos;