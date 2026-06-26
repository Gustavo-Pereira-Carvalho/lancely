import { carregarProjetos, getProjetos } from "./projetos.js";
import { carregarClientes, getClientes } from "./clientes.js";

let chart;
let periodo = 30;

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
  } catch (err) {
    console.error("Erro initDashboard:", err);
  }
}

// =========================
// USUÁRIO
// =========================
const nome = localStorage.getItem("nome");

if (nome) {
  const elNome = document.getElementById("userNome");
  const saudacao = document.getElementById("saudacao");

  if (elNome) elNome.innerText = nome;
  if (saudacao) saudacao.innerText = `Bom dia, ${nome} 👋`;
}

// =========================
// PLANO
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
    const filtros = document.getElementById("filtros");
    const badge = document.getElementById("badgePro");

    if (planTitle) {
      planTitle.innerText =
        user.plano.tipo === "pro" ? "Plano Pro" : "Plano Free";
    }

    // 🚀 LIBERAÇÕES DO PRO
    if (user.plano.tipo === "pro") {
      if (filtros) filtros.style.display = "flex";
      if (badge) badge.innerText = "PRO";
    } else {
      if (filtros) filtros.style.display = "none";
      if (badge) badge.innerText = "";
    }

  } catch (err) {
    console.error("Erro plano:", err);
  }
}

// =========================
// FILTRO PRO (GLOBAL)
// =========================
window.setPeriodo = function (p) {
  if (localStorage.getItem("plano") !== "pro") {
    return alert("Disponível apenas no plano PRO 🚀");
  }

  periodo = p;
  atualizarDashboard();
};

// =========================
// DASHBOARD
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

  const ganhos = projetos
    .filter(p => p.pago && new Date(p.criadoEm).getMonth() === mesAtual)
    .reduce((t, p) => t + Number(p.valor), 0);

  document.getElementById("ganhos").innerText = `R$ ${ganhos}`;
  document.getElementById("totalProjetos").innerText = projetos.length;
  document.getElementById("concluidos").innerText = projetos.filter(p => p.pago).length;
  document.getElementById("pendentes").innerText = projetos.filter(p => !p.pago).length;
}

// =========================
// PRAZOS
// =========================
function renderPrazos(projetos) {
  const lista = document.querySelector(".box:nth-child(3) ul");
  if (!lista) return;

  lista.innerHTML = "";

  const hoje = new Date();

  projetos
    .filter(p => p.prazo && !p.pago)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 5)
    .forEach(p => {
      const dias = Math.ceil((new Date(p.prazo) - hoje) / 86400000);

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
// CLIENTES (TOP)
// =========================
function renderTopClientes(projetos) {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  const mapa = {};

  projetos.forEach(p => {
    if (!p.pago) return;
    mapa[p.clienteNome] = (mapa[p.clienteNome] || 0) + Number(p.valor);
  });

  Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([nome, valor]) => {
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

  getClientes().slice(-5).reverse().forEach(c => {
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
      <strong>${p.nome}</strong>
      <span style="color:${p.pago ? "#22C55E" : "#FACC15"}">
        ${p.pago ? "✔" : "⏳"}
      </span>
      R$ ${p.valor}
    `;

    lista.appendChild(li);
  });
}

// =========================
// GRÁFICO (FREE vs PRO)
// =========================
function renderGrafico(projetos) {
  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  if (chart) chart.destroy();

  const isPro = localStorage.getItem("plano") === "pro";
  const canvas = ctx;

  // animação saída
  canvas.style.transition = "all 0.2s ease";
  canvas.style.opacity = "0.4";
  canvas.style.transform = "scale(0.98)";

  let labels = [];
  let dados = [];

  // =========================
  // FREE (sempre mensal)
  // =========================
  if (!isPro) {
    labels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    dados = new Array(12).fill(0);

    projetos.forEach(p => {
      if (!p.pago) return;
      const mes = new Date(p.criadoEm).getMonth();
      dados[mes] += Number(p.valor);
    });
  }

  // =========================
  // PRO
  // =========================
  else {
    const hoje = new Date();

    // 🔹 visão curta (7 / 30 dias)
    if (periodo === 7 || periodo === 30) {
      const dias = periodo;

      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(hoje.getDate() - i);

        labels.push(
          d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit"
          })
        );

        const total = projetos
          .filter(p => {
            if (!p.pago) return false;
            const data = new Date(p.criadoEm);
            return data.toDateString() === d.toDateString();
          })
          .reduce((t, p) => t + Number(p.valor), 0);

        dados.push(total);
      }
    }

    // 🔹 visão mensal (12 meses)
    else {
      labels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      dados = new Array(12).fill(0);

      projetos.forEach(p => {
        if (!p.pago) return;
        const mes = new Date(p.criadoEm).getMonth();
        dados[mes] += Number(p.valor);
      });
    }
  }

  // =========================
  // MÉDIA (PRO)
  // =========================
  let mediaDataset = null;

  if (isPro && dados.length > 0) {
    const media = dados.reduce((a, b) => a + b, 0) / dados.length;

    mediaDataset = {
      data: new Array(dados.length).fill(media),
      borderColor: "#06B6D4",
      borderDash: [6, 6],
      pointRadius: 0,
      fill: false
    };
  }

  // =========================
  // CHART
  // =========================
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: dados,
          borderColor: "#7C3AED",
          backgroundColor: "rgba(124,58,237,0.15)",
          fill: true,
          tension: 0.45,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        ...(mediaDataset ? [mediaDataset] : [])
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 800,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },

      interaction: {
        mode: "index",
        intersect: false
      },

      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });

  // animação entrada
  setTimeout(() => {
    canvas.style.opacity = "1";
    canvas.style.transform = "scale(1)";
  }, 60);
}