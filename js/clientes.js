let clientes = [];
let clienteEditando = null;

export function getClientes() {
  return clientes;
}

function isPro() {
  return localStorage.getItem("plano") === "pro";
}

// =========================
// EVENTOS
// =========================
const btn = document.getElementById("btnAddCliente");

if (btn) {
  btn.addEventListener("click", salvarCliente);
}

// =========================
// CARREGAR
// =========================
export async function carregarClientes() {
  const res = await fetch("http://localhost:3000/clientes", {
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });

  clientes = await res.json();

  atualizarLimiteUI();
  renderClientes();
  preencherClientesSelect();
}

// =========================
// CRIAR / EDITAR
// =========================
async function salvarCliente() {

  const input = document.getElementById("clienteInput");

  const nome = input.value.trim();

  if (!nome) {
    return alert("Digite um nome.");
  }

  // EDITAR
  if (clienteEditando) {

    await fetch(`http://localhost:3000/clientes/${clienteEditando}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token")
      },
      body: JSON.stringify({
        nome
      })
    });

    clienteEditando = null;
    btn.innerText = "Adicionar";

  } else {

    // LIMITE FREE
    if (!isPro() && clientes.length >= 3) {
      return alert("Limite do plano FREE atingido (3 clientes). Faça upgrade 🚀");
    }

    await fetch("http://localhost:3000/clientes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token")
      },
      body: JSON.stringify({
        nome
      })
    });

  }

  input.value = "";

  carregarClientes();

}

// =========================
// EDITAR
// =========================
function editarCliente(cliente) {

  clienteEditando = cliente._id;

  document.getElementById("clienteInput").value = cliente.nome;

  btn.innerText = "Salvar";

  document.getElementById("clienteInput").focus();

}

// =========================
// REMOVER
// =========================
export async function removerCliente(id) {

  if (!confirm("Deseja excluir este cliente?")) {
    return;
  }

  await fetch(`http://localhost:3000/clientes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });

  carregarClientes();

}

// =========================
// UI LIMITE
// =========================
function atualizarLimiteUI() {

  const texto = document.querySelector(".plan-box p");
  const barra = document.querySelector(".bar");

  if (!texto || !barra) return;

  if (isPro()) {

    texto.innerText = "Ilimitado 🚀";
    barra.style.width = "100%";

  } else {

    texto.innerText = `${clientes.length}/3 clientes`;

    barra.style.width = `${clientes.length / 3 * 100}%`;

  }

}

// =========================
// RENDER
// =========================
function renderClientes() {

  const lista = document.getElementById("listaClientes");

  if (!lista) return;

  lista.innerHTML = "";

  clientes.forEach(cliente => {

    const li = document.createElement("li");

    li.innerHTML = `
      <span>${cliente.nome}</span>

      <div class="acoes">

        <button class="btn-editar">
          ✏️
        </button>

        <button class="btn-remove">
          🗑️
        </button>

      </div>
    `;

    li.querySelector(".btn-editar")
      .addEventListener("click", () => editarCliente(cliente));

    li.querySelector(".btn-remove")
      .addEventListener("click", () => removerCliente(cliente._id));

    lista.appendChild(li);

  });

}

// =========================
// SELECT
// =========================
export function preencherClientesSelect() {

  const select = document.getElementById("clienteSelect");

  if (!select) return;

  select.innerHTML = "";

  clientes.forEach(cliente => {

    const option = document.createElement("option");

    option.value = cliente._id;
    option.textContent = cliente.nome;

    select.appendChild(option);

  });

}