import { getClientes, carregarClientes } from "./clientes.js";

let projetos = [];
let filtroAtual = "todos";

function isPro() {
  return localStorage.getItem("plano") === "pro";
}

export function getProjetos() {
  return projetos;
}

export async function carregarProjetos() {
  const res = await fetch("http://localhost:3000/projetos", {
    headers: { Authorization: localStorage.getItem("token") }
  });

  projetos = await res.json();
  atualizarLimiteProjetos();
  renderProjetos();
}

export async function addProjeto() {
  const nome = document.getElementById("projetoNome").value;
  const valor = Number(document.getElementById("projetoValor").value);
  const clienteId = document.getElementById("clienteSelect").value;
  const prazo = document.getElementById("projetoPrazo").value;

  if (getClientes().length === 0) {
    await carregarClientes();
  }

  // 🚨 LIMITE FREE
  if (!isPro() && projetos.length >= 5) {
    return alert("Limite FREE atingido (5 projetos). Faça upgrade 🚀");
  }

  const cliente = getClientes().find(c => c._id === clienteId);

  if (!nome || !valor || !cliente || !prazo) {
    return alert("Preencha tudo");
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
      clienteNome: cliente.nome,
      prazo: new Date(prazo)
    })
  });

  carregarProjetos();
}

export async function toggleProjeto(id) {
  await fetch(`http://localhost:3000/projetos/${id}`, {
    method: "PUT",
    headers: { Authorization: localStorage.getItem("token") }
  });

  carregarProjetos();
}

export async function removerProjeto(id) {
  await fetch(`http://localhost:3000/projetos/${id}`, {
    method: "DELETE",
    headers: { Authorization: localStorage.getItem("token") }
  });

  carregarProjetos();
}

function atualizarLimiteProjetos() {
  const texto = document.querySelector(".plan-box p");
  if (!texto) return;

  if (!isPro()) {
    texto.innerText += ` • ${projetos.length}/5 projetos`;
  }
}

window.filtrarProjetos = function (tipo) {
  filtroAtual = tipo;
  renderProjetos();
};

function renderProjetos() {
  const lista = document.getElementById("listaProjetos");
  if (!lista) return;

  lista.innerHTML = "";

  let filtrados = projetos;

  if (filtroAtual === "pagos") filtrados = projetos.filter(p => p.pago);
  if (filtroAtual === "pendentes") filtrados = projetos.filter(p => !p.pago);

  filtrados.forEach(p => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${p.nome}</strong><br>
        <small>${p.clienteNome || ""}</small>
      </div>

      <div>
        ${p.pago ? "✔" : "⏳"} R$ ${p.valor}
      </div>
    `;

    lista.appendChild(li);
  });
}

window.addProjeto = addProjeto;
window.toggleProjeto = toggleProjeto;
window.removerProjeto = removerProjeto;