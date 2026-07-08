let clientes = [];
let clienteEditando = null;
let textoBusca = "";

// =========================
// HELPERS
// =========================
export function getClientes() {
  return clientes;
}

function isPro() {
  return localStorage.getItem("plano") === "pro";
}

// =========================
// ELEMENTOS
// =========================
const btn = document.getElementById("btnAddCliente");
const inputCliente = document.getElementById("clienteInput");
const inputBusca = document.getElementById("buscarCliente");
const contadorClientes = document.getElementById("contadorClientes");

// =========================
// EVENTOS
// =========================
if (btn) {
  btn.addEventListener("click", salvarCliente);
}

if (inputCliente) {
  inputCliente.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      salvarCliente();
    }
  });
}

if (inputBusca) {
  inputBusca.addEventListener("input", (e) => {
    textoBusca = e.target.value.trim().toLowerCase();
    renderClientes();
  });
}

// =========================
// CARREGAR
// =========================
export async function carregarClientes() {
  try {
    const res = await fetch("http://localhost:3000/clientes", {
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });

    clientes = await res.json();

    atualizarLimiteUI();
    renderClientes();
    preencherClientesSelect();
  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
  }
}

// =========================
// CRIAR / EDITAR
// =========================
async function salvarCliente() {
  if (!inputCliente) return;

  const nome = inputCliente.value.trim();

  if (!nome) {
    return alert("Digite um nome.");
  }

  try {
    // =========================
    // EDITAR
    // =========================
    if (clienteEditando) {
      await fetch(`http://localhost:3000/clientes/${clienteEditando}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({ nome })
      });

      clienteEditando = null;

      if (btn) {
        btn.innerText = "Adicionar";
      }
    }

    // =========================
    // CRIAR
    // =========================
    else {
      if (!isPro() && clientes.length >= 3) {
        return alert("Limite do plano FREE atingido (3 clientes). Faça upgrade 🚀");
      }

      await fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({ nome })
      });
    }

    inputCliente.value = "";
    inputCliente.focus();

    await carregarClientes();
  } catch (err) {
    console.error("Erro ao salvar cliente:", err);
    alert("Não foi possível salvar o cliente.");
  }
}

// =========================
// EDITAR
// =========================
function editarCliente(cliente) {
  clienteEditando = cliente._id;

  if (inputCliente) {
    inputCliente.value = cliente.nome;
    inputCliente.focus();
  }

  if (btn) {
    btn.innerText = "Salvar";
  }
}

// =========================
// REMOVER
// =========================
export async function removerCliente(id) {
  const confirmar = confirm("Deseja excluir este cliente?");
  if (!confirmar) return;

  try {
    await fetch(`http://localhost:3000/clientes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });

    if (clienteEditando === id) {
      clienteEditando = null;

      if (inputCliente) inputCliente.value = "";
      if (btn) btn.innerText = "Adicionar";
    }

    await carregarClientes();
  } catch (err) {
    console.error("Erro ao remover cliente:", err);
    alert("Não foi possível remover o cliente.");
  }
}

// =========================
// UI LIMITE
// =========================
function atualizarLimiteUI() {
  const texto = document.querySelector(".plan-box p");
  const barra = document.querySelector(".bar");

  // nessa página pode não existir plan-box
  if (!texto || !barra) return;

  if (isPro()) {
    texto.innerText = "Ilimitado 🚀";
    barra.style.width = "100%";
  } else {
    texto.innerText = `${clientes.length}/3 clientes`;
    barra.style.width = `${(clientes.length / 3) * 100}%`;
  }
}

// =========================
// CONTADOR
// =========================
function atualizarContador(total) {
  if (!contadorClientes) return;

  contadorClientes.textContent =
    total === 1 ? "1 cliente" : `${total} clientes`;
}

// =========================
// RENDER
// =========================
function renderClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  let filtrados = [...clientes];

  if (textoBusca) {
    filtrados = filtrados.filter(cliente =>
      cliente.nome.toLowerCase().includes(textoBusca)
    );
  }

  atualizarContador(filtrados.length);

  // =========================
  // ESTADO VAZIO
  // =========================
  if (filtrados.length === 0) {
    lista.innerHTML = `
      <div class="lista-vazia">
        ${
          textoBusca
            ? "Nenhum cliente encontrado para essa busca."
            : "Você ainda não cadastrou nenhum cliente."
        }
      </div>
    `;
    return;
  }

  // =========================
  // LISTA
  // =========================
  filtrados.forEach(cliente => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="cliente-info">
        <strong>${cliente.nome}</strong>
        <small>Cliente cadastrado na sua conta</small>
      </div>

      <div class="acoes">
        <button class="btn-editar" title="Editar">✏️</button>
        <button class="btn-remove" title="Excluir">🗑️</button>
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
// SELECT DOS PROJETOS
// =========================
export function preencherClientesSelect() {
  const select = document.getElementById("clienteSelect");
  if (!select) return;

  select.innerHTML = "";

  if (clientes.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum cliente cadastrado";
    select.appendChild(option);
    return;
  }

  clientes.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente._id;
    option.textContent = cliente.nome;
    select.appendChild(option);
  });
}