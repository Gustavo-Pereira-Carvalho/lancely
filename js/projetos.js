import { getClientes, carregarClientes } from "./clientes.js";

let projetos = [];
let filtroAtual = "todos";

// =========================
// GETTER
// =========================
export function getProjetos() {
  return projetos;
}

// =========================
// CARREGAR PROJETOS
// =========================
export async function carregarProjetos() {
  const res = await fetch("http://localhost:3000/projetos", {
    headers: { Authorization: localStorage.getItem("token") }
  });

  projetos = await res.json();
  renderProjetos();
}

// =========================
// ADICIONAR PROJETO
// =========================
export async function addProjeto() {
  const nome = document.getElementById("projetoNome").value;
  const valor = Number(document.getElementById("projetoValor").value);
  const clienteId = document.getElementById("clienteSelect").value;
  const prazo = document.getElementById("projetoPrazo").value;

  if (getClientes().length === 0) {
    await carregarClientes();
  }

  const cliente = getClientes().find(c => c._id === clienteId);

  if (!nome || !valor || !cliente || !prazo) {
    return alert("Preencha tudo (incluindo a data)");
  }

  await fetch("http://localhost:3000/projetos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token")
    },
    body: JSON.stringify({
      nome,
      valor,
      pago: false,
      clienteId,
      clienteNome: cliente.nome,
      prazo: new Date(prazo)
    })
  });

  document.getElementById("projetoNome").value = "";
  document.getElementById("projetoValor").value = "";
  document.getElementById("projetoPrazo").value = "";

  carregarProjetos();
}

// =========================
// TOGGLE (PAGO / PENDENTE)
// =========================
export async function toggleProjeto(id) {
  await fetch(`http://localhost:3000/projetos/${id}`, {
    method: "PUT",
    headers: { Authorization: localStorage.getItem("token") }
  });

  carregarProjetos();
}

// =========================
// REMOVER
// =========================
export async function removerProjeto(id) {
  await fetch(`http://localhost:3000/projetos/${id}`, {
    method: "DELETE",
    headers: { Authorization: localStorage.getItem("token") }
  });

  carregarProjetos();
}

// =========================
// FILTRO (GLOBAL)
// =========================
window.filtrarProjetos = function (tipo) {
  filtroAtual = tipo;
  renderProjetos();
};

// =========================
// RENDER LISTA
// =========================
function renderProjetos() {
  const lista = document.getElementById("listaProjetos");
  if (!lista) return;

  lista.innerHTML = "";

  let filtrados = projetos;

  if (filtroAtual === "pagos") {
    filtrados = projetos.filter(p => p.pago);
  }

  if (filtroAtual === "pendentes") {
    filtrados = projetos.filter(p => !p.pago);
  }

  filtrados.forEach(p => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${p.nome}</strong><br>
        <small>${p.clienteNome || "Sem cliente"}</small><br>
        <small>${p.prazo ? new Date(p.prazo).toLocaleDateString() : "Sem prazo"}</small>
      </div>

      <div>
        <span>${p.pago ? "✔" : "⏳"}</span>
        R$ ${p.valor}

        <button onclick="toggleProjeto('${p._id}')">✔</button>
        <button onclick="removerProjeto('${p._id}')">X</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

// =========================
// GLOBAL EXPORTS (HTML onclick)
// =========================
window.addProjeto = addProjeto;
window.toggleProjeto = toggleProjeto;
window.removerProjeto = removerProjeto;