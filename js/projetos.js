import { getClientes, carregarClientes } from "./clientes.js";

let projetos = [];
let filtroAtual = "todos";
let projetoEditando = null;
let textoBusca = "";

function isPro() {
  return localStorage.getItem("plano") === "pro";
}

export function getProjetos() {
  return projetos;
}

// =========================
// EVENTOS
// =========================
const btn = document.getElementById("btnAddProjeto");

if (btn) {
  btn.addEventListener("click", salvarProjeto);
}

const busca = document.getElementById("buscarProjeto");

if (busca) {

    busca.addEventListener("input", e => {

        textoBusca = e.target.value.toLowerCase();

        renderProjetos();

    });

}

// =========================
// CARREGAR
// =========================
export async function carregarProjetos() {

  const res = await fetch("http://localhost:3000/projetos", {
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });

  projetos = await res.json();

  atualizarLimiteProjetos();
  renderProjetos();

}

// =========================
// CRIAR / EDITAR
// =========================
async function salvarProjeto() {

  const nome = document.getElementById("projetoNome").value.trim();
  const valor = Number(document.getElementById("projetoValor").value);
  const clienteId = document.getElementById("clienteSelect").value;
  const prazo = document.getElementById("projetoPrazo").value;

  if (getClientes().length === 0) {
    await carregarClientes();
  }

  const cliente = getClientes().find(c => c._id === clienteId);

  if (!nome || !valor || !cliente || !prazo) {
    return alert("Preencha todos os campos.");
  }

  // EDITAR
  if (projetoEditando) {

    await fetch(`http://localhost:3000/projetos/${projetoEditando}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token")
      },
      body: JSON.stringify({
        nome,
        valor,
        clienteNome: cliente.nome,
        prazo
      })
    });

    projetoEditando = null;

    if (btn) btn.innerText = "Adicionar";

  } else {

    if (!isPro() && projetos.length >= 5) {
      return alert("Limite FREE atingido (5 projetos). Faça upgrade 🚀");
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
        clienteNome: cliente.nome,
        prazo
      })
    });

  }

  document.getElementById("projetoNome").value = "";
  document.getElementById("projetoValor").value = "";
  document.getElementById("projetoPrazo").value = "";

  carregarProjetos();

}

// =========================
// EDITAR
// =========================
function editarProjeto(projeto) {

  projetoEditando = projeto._id;

  document.getElementById("projetoNome").value = projeto.nome;
  document.getElementById("projetoValor").value = projeto.valor;
  document.getElementById("projetoPrazo").value =
    projeto.prazo
      ? projeto.prazo.substring(0, 10)
      : "";

  const cliente = getClientes().find(
    c => c.nome === projeto.clienteNome
  );

  if (cliente) {
    document.getElementById("clienteSelect").value = cliente._id;
  }

  if (btn) btn.innerText = "Salvar";

}

// =========================
// PAGO
// =========================
export async function toggleProjeto(id) {

  await fetch(`http://localhost:3000/projetos/${id}`, {
    method: "PUT",
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });

  carregarProjetos();

}

// =========================
// REMOVER
// =========================
export async function removerProjeto(id) {

  if (!confirm("Deseja excluir este projeto?")) {
    return;
  }

  await fetch(`http://localhost:3000/projetos/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });

  carregarProjetos();

}

// =========================
// LIMITE
// =========================
function atualizarLimiteProjetos() {

  const texto = document.querySelector(".plan-box p");

  if (!texto) return;

  if (!isPro()) {
    texto.innerText += ` • ${projetos.length}/5 projetos`;
  }

}

window.filtrarProjetos = function (tipo) {

    filtroAtual = tipo;

    document
        .querySelectorAll(".filtros button")
        .forEach(btn => btn.classList.remove("active"));

    const indice = {
        todos:0,
        pendentes:1,
        pagos:2
    };

    document
        .querySelectorAll(".filtros button")
        [indice[tipo]]
        .classList.add("active");

    renderProjetos();

};

// =========================
// RENDER
// =========================
function renderProjetos() {

  const lista = document.getElementById("listaProjetos");

  if (!lista) return;

  lista.innerHTML = "";

let filtrados = [...projetos];

if (filtroAtual === "pagos") {

    filtrados = filtrados.filter(p => p.pago);

}

if (filtroAtual === "pendentes") {

    filtrados = filtrados.filter(p => !p.pago);

}

if (textoBusca) {

    filtrados = filtrados.filter(p =>

        p.nome.toLowerCase().includes(textoBusca) ||

        p.clienteNome.toLowerCase().includes(textoBusca)

    );

}

  filtrados.forEach(projeto => {

    const li = document.createElement("li");

    li.innerHTML = `

      <div class="projeto-info">

        <strong>${projeto.nome}</strong>

        <small>
          Cliente: ${projeto.clienteNome}
        </small>

        <small>
          R$ ${Number(projeto.valor).toFixed(2)}
        </small>

        <small>
          Prazo:
          ${
            projeto.prazo
              ? new Date(projeto.prazo).toLocaleDateString("pt-BR")
              : "-"
          }
        </small>

        <span class="${
          projeto.pago ? "status-pago" : "status-pendente"
        }">

          ${projeto.pago ? "🟢 Pago" : "🔴 Pendente"}

        </span>

      </div>

      <div class="acoes">

        <button
          class="btn-pago"
          title="Marcar como pago">
          ✔
        </button>

        <button
          class="btn-editar"
          title="Editar">
          ✏️
        </button>

        <button
          class="btn-remove"
          title="Excluir">
          🗑️
        </button>

      </div>

    `;

    li.querySelector(".btn-pago")
      .addEventListener("click", () => toggleProjeto(projeto._id));

    li.querySelector(".btn-editar")
      .addEventListener("click", () => editarProjeto(projeto));

    li.querySelector(".btn-remove")
      .addEventListener("click", () => removerProjeto(projeto._id));

    lista.appendChild(li);

  });

}

window.addProjeto = salvarProjeto;
window.toggleProjeto = toggleProjeto;
window.removerProjeto = removerProjeto;