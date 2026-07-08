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
  const menuNome = document.getElementById("menuNome");
  const saudacao = document.getElementById("saudacao");

  if (elNome) elNome.innerText = nome;
  if (menuNome) menuNome.innerText = nome;
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
      headers: {
        Authorization: token
      }
    });

    const user = await res.json();

    if (user?.plano?.tipo) {
      localStorage.setItem("plano", user.plano.tipo);
    }

    const planTitle = document.querySelector(".plan-box h4");
    const planText = document.querySelector(".plan-box p");
    const filtros = document.getElementById("filtros");
    const badge = document.getElementById("badgePro");
    const menuEmail = document.getElementById("menuEmail");

    if (menuEmail && user?.email) {
      menuEmail.innerText = user.email;
    }

    if (planTitle) {
      planTitle.innerText =
        user?.plano?.tipo === "pro" ? "Plano Pro" : "Plano Free";
    }

    if (user?.plano?.tipo === "pro") {
      if (planText) planText.innerText = "Recursos avançados liberados 🚀";
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
  atualizarBotoesPeriodo();
  atualizarDashboard();
};

function atualizarBotoesPeriodo() {
  const botoes = document.querySelectorAll("#filtros button");
  if (!botoes.length) return;

  botoes.forEach(btn => btn.classList.remove("active"));

  botoes.forEach(btn => {
    const texto = btn.textContent.trim().toLowerCase();

    if (
      (periodo === 7 && texto === "7d") ||
      (periodo === 30 && texto === "30d") ||
      (periodo === 365 && texto === "12m")
    ) {
      btn.classList.add("active");
    }
  });
}

// =========================
// DASHBOARD
// =========================
export function atualizarDashboard() {
  const projetos = getProjetos();

  if (!document.getElementById("ganhos")) return;

  atualizarCards(projetos);
  renderGrafico(projetos);
  renderPrazos(projetos);
  renderProjetosRecentes(projetos);
  renderClientesDashboard();
}

// =========================
// CARDS
// =========================
function atualizarCards(projetos) {
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  const ganhosMes = projetos
    .filter(p => {
      if (!p.pago) return false;
      const data = new Date(p.criadoEm || p.createdAt || Date.now());
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    })
    .reduce((total, p) => total + Number(p.valor || 0), 0);

  const concluidos = projetos.filter(p => p.pago).length;

  const pendentes = projetos.filter(p => !p.pago);
  const totalPendentes = pendentes.length;
  const valorPendente = pendentes.reduce(
    (total, p) => total + Number(p.valor || 0),
    0
  );

  const ganhosEl = document.getElementById("ganhos");
  const totalProjetosEl = document.getElementById("totalProjetos");
  const concluidosEl = document.getElementById("concluidos");
  const pendentesEl = document.getElementById("pendentes");
  const pendentesLabel = document.getElementById("pendentesLabel");

  if (ganhosEl) {
    ganhosEl.innerText = `R$ ${ganhosMes.toLocaleString("pt-BR")}`;
  }

  if (totalProjetosEl) {
    totalProjetosEl.innerText = projetos.length;
  }

  if (concluidosEl) {
    concluidosEl.innerText = concluidos;
  }

  if (pendentesEl) {
    pendentesEl.innerText = `R$ ${valorPendente.toLocaleString("pt-BR")}`;
  }

  if (pendentesLabel) {
    pendentesLabel.innerText = `${totalPendentes} projeto(s) pendente(s)`;
  }
}

// =========================
// PRAZOS
// =========================
function renderPrazos(projetos) {
  const lista = document.getElementById("listaPrazos");
  if (!lista) return;

  lista.innerHTML = "";

  const hoje = new Date();

  const prazos = projetos
    .filter(p => p.prazo && !p.pago)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 5);

  if (prazos.length === 0) {
    lista.innerHTML = `
      <li class="empty-state">
        <div class="empty-text">
          <strong>Nenhum prazo pendente</strong>
          <small>Seus projetos em aberto aparecerão aqui.</small>
        </div>
      </li>
    `;
    return;
  }

  prazos.forEach(p => {
    const dataPrazo = new Date(p.prazo);
    const diff = dataPrazo.getTime() - hoje.getTime();
    const dias = Math.ceil(diff / 86400000);

    let statusTexto = "";
    let statusClasse = "";

    if (dias < 0) {
      statusTexto = "Atrasado";
      statusClasse = "status-atrasado";
    } else if (dias === 0) {
      statusTexto = "Hoje";
      statusClasse = "status-hoje";
    } else if (dias <= 2) {
      statusTexto = `${dias} dia${dias > 1 ? "s" : ""}`;
      statusClasse = "status-alerta";
    } else {
      statusTexto = `${dias} dias`;
      statusClasse = "status-ok";
    }

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="dash-item-info">
        <strong>${p.nome}</strong>
        <small>${p.clienteNome || "Sem cliente"} • ${formatarData(p.prazo)}</small>
      </div>

      <span class="status-inline ${statusClasse}">
        ${statusTexto}
      </span>
    `;

    lista.appendChild(li);
  });
}

// =========================
// CLIENTES DASHBOARD
// =========================
function renderClientesDashboard() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  const clientes = [...getClientes()].slice(-5).reverse();

  if (clientes.length === 0) {
    lista.innerHTML = `
      <li class="empty-state">
        <div class="empty-text">
          <strong>Nenhum cliente cadastrado</strong>
          <small>Seus clientes aparecerão aqui.</small>
        </div>
      </li>
    `;
    return;
  }

  clientes.forEach(cliente => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="dash-item-info">
        <strong>${cliente.nome}</strong>
        <small>Cliente cadastrado</small>
      </div>
    `;

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

  const recentes = [...projetos].slice(-5).reverse();

  if (recentes.length === 0) {
    lista.innerHTML = `
      <li class="empty-state">
        <div class="empty-text">
          <strong>Nenhum projeto cadastrado</strong>
          <small>Os projetos mais recentes aparecerão aqui.</small>
        </div>
      </li>
    `;
    return;
  }

  recentes.forEach(p => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="dash-item-info">
        <strong>${p.nome}</strong>
        <small>
          ${p.clienteNome || "Sem cliente"} •
          R$ ${Number(p.valor || 0).toLocaleString("pt-BR")}
        </small>
      </div>

      <span class="status-inline ${p.pago ? "status-pago" : "status-pendente"}">
        ${p.pago ? "Pago" : "Pendente"}
      </span>
    `;

    lista.appendChild(li);
  });
}

// =========================
// GRÁFICO (FREE vs PRO)
// =========================
function renderGrafico(projetos) {
  const canvas = document.getElementById("grafico");
  if (!canvas) return;

  if (chart) {
    chart.destroy();
  }

  const isPro = localStorage.getItem("plano") === "pro";

  canvas.style.transition = "all .2s ease";
  canvas.style.opacity = "0.4";
  canvas.style.transform = "scale(.98)";

  let labels = [];
  let dados = [];

  // =========================
  // FREE -> visão mensal fixa
  // =========================
  if (!isPro) {
    labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    dados = new Array(12).fill(0);

    projetos.forEach(p => {
      if (!p.pago) return;
      const data = new Date(p.criadoEm || p.createdAt || Date.now());
      const mes = data.getMonth();
      dados[mes] += Number(p.valor || 0);
    });
  }

  // =========================
  // PRO
  // =========================
  else {
    const hoje = new Date();

    // 7d ou 30d
    if (periodo === 7 || periodo === 30) {
      const dias = periodo;

      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
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
            const data = new Date(p.criadoEm || p.createdAt || Date.now());
            return data.toDateString() === d.toDateString();
          })
          .reduce((acc, p) => acc + Number(p.valor || 0), 0);

        dados.push(total);
      }
    }

    // 12m
    else {
      labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      dados = new Array(12).fill(0);

      projetos.forEach(p => {
        if (!p.pago) return;
        const data = new Date(p.criadoEm || p.createdAt || Date.now());
        const mes = data.getMonth();
        dados[mes] += Number(p.valor || 0);
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
      pointHoverRadius: 0,
      borderWidth: 2,
      fill: false
    };
  }

  const maxValor = Math.max(...dados, 0, mediaDataset ? mediaDataset.data[0] : 0);
  const sugestaoMax = maxValor > 0 ? Math.ceil(maxValor * 1.15) : 100;

  // =========================
  // CHART
  // =========================
  chart = new Chart(canvas, {
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
          pointRadius: periodo === 365 && isPro ? 2 : 3,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        ...(mediaDataset ? [mediaDataset] : [])
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: {
          top: 10,
          right: 8,
          bottom: 0,
          left: 4
        }
      },

      animation: {
        duration: 800,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "#0F172A",
          borderColor: "rgba(148,163,184,.15)",
          borderWidth: 1,
          titleColor: "#F8FAFC",
          bodyColor: "#CBD5E1",
          padding: 12,
          displayColors: false,
          callbacks: {
            label(context) {
              const valor = Number(context.raw || 0).toLocaleString("pt-BR");
              return `R$ ${valor}`;
            }
          }
        }
      },

      interaction: {
        mode: "index",
        intersect: false
      },

      scales: {
        x: {
          grid: {
            display: false
          },

          border: {
            display: false
          },

          ticks: {
            color: "#94A3B8",
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: periodo === 365 ? 12 : 8,
            font: {
              size: 11
            }
          }
        },

        y: {
          beginAtZero: true,
          suggestedMax: sugestaoMax,

          border: {
            display: false
          },

          ticks: {
            color: "#94A3B8",
            padding: 8,
            maxTicksLimit: 6,
            callback(value) {
              return `R$ ${Number(value).toLocaleString("pt-BR")}`;
            }
          },

          grid: {
            color: "rgba(255,255,255,.06)",
            drawTicks: false
          }
        }
      }
    }
  });

  setTimeout(() => {
    canvas.style.opacity = "1";
    canvas.style.transform = "scale(1)";
  }, 60);
}

// =========================
// HELPERS
// =========================
function formatarData(data) {
  if (!data) return "-";

  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}