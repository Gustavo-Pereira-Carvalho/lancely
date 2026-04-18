import { getProjetos } from "./projetos.js";

let chart;

export function atualizarDashboard() {
  const projetos = getProjetos();

  if (!document.getElementById("ganhos")) return;

  const ganhos = projetos
    .filter(p => p.pago)
    .reduce((t, p) => t + p.valor, 0);

  document.getElementById("ganhos").innerText = "R$ " + ganhos;
  document.getElementById("totalProjetos").innerText = projetos.length;
  document.getElementById("concluidos").innerText = projetos.filter(p => p.pago).length;
  document.getElementById("pendentes").innerText = projetos.filter(p => !p.pago).length;

  renderGrafico(projetos);
}

function renderGrafico(projetos) {
  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  if (chart) chart.destroy();

  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const dados = new Array(12).fill(0);

  projetos.forEach(p => {
    if (!p.pago) return;
    const mes = new Date(p.criadoEm).getMonth();
    dados[mes] += p.valor;
  });

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        data: dados,
        borderColor: "#7C3AED",
        backgroundColor: "rgba(124,58,237,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 2
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1000,
            callback: v => "R$ " + v / 1000 + "k"
          }
        }
      }
    }
  });
}