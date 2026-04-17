// =========================
// CONFIG
// =========================
const API = "http://localhost:3000";

// =========================
// AUTH
// =========================
const token = localStorage.getItem("token");

// proteger páginas
if (!token && !window.location.href.includes("login.html")) {
  window.location.href = "login.html";
}

// =========================
// LOGIN / REGISTER
// =========================
async function register() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    return alert("Preencha tudo");
  }

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const data = await res.json();

  if (data.erro) return alert(data.erro);

  alert("Conta criada!");
}

async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    return alert("Preencha tudo");
  }

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const data = await res.json();

  if (data.erro) return alert(data.erro);

  localStorage.setItem("token", data.token);

  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// =========================
// ESTADO
// =========================
let projetos = [];
let clientes = [];
let filtroAtual = "todos";
let chart;

// =========================
// CLIENTES
// =========================
async function carregarClientes() {
  const res = await fetch(`${API}/clientes`, {
    headers: {
      "Authorization": token
    }
  });

  clientes = await res.json();

  renderClientes();
  preencherClientesSelect();
}

async function addCliente() {
  const input = document.getElementById("clienteInput");
  const nome = input.value;

  if (!nome) return;

  await fetch(`${API}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ nome })
  });

  input.value = "";
  carregarClientes();
}

async function removerCliente(index) {
  const id = clientes[index]._id;

  await fetch(`${API}/clientes/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": token
    }
  });

  carregarClientes();
}

function renderClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  clientes.forEach((c, i) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${c.nome}
      <button onclick="removerCliente(${i})">X</button>
    `;

    lista.appendChild(li);
  });
}

// =========================
// SELECT CLIENTES
// =========================
function preencherClientesSelect() {
  const select = document.getElementById("clienteSelect");
  if (!select) return;

  select.innerHTML = "";

  clientes.forEach(c => {
    const option = document.createElement("option");
    option.value = c._id;
    option.textContent = c.nome;
    select.appendChild(option);
  });
}

// =========================
// PROJETOS
// =========================
async function carregarProjetos() {
  const res = await fetch(`${API}/projetos`, {
    headers: {
      "Authorization": token
    }
  });

  projetos = await res.json();

  renderProjetos();
  atualizarDashboard();
}

async function addProjeto() {
  const nome = document.getElementById("projetoNome").value;
  const valor = Number(document.getElementById("projetoValor").value);
  const clienteId = document.getElementById("clienteSelect")?.value;

  const cliente = clientes.find(c => c._id === clienteId);

  if (!nome || !valor || !cliente) {
    alert("Preencha tudo e selecione um cliente");
    return;
  }

  await fetch(`${API}/projetos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      nome,
      valor,
      pago: false,
      clienteId,
      clienteNome: cliente.nome
    })
  });

  document.getElementById("projetoNome").value = "";
  document.getElementById("projetoValor").value = "";

  carregarProjetos();
}

async function marcarPago(index) {
  const id = projetos[index]._id;

  await fetch(`${API}/projetos/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": token
    }
  });

  carregarProjetos();
}

async function removerProjeto(index) {
  const id = projetos[index]._id;

  await fetch(`${API}/projetos/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": token
    }
  });

  carregarProjetos();
}

// =========================
// FILTRO
// =========================
function filtrarProjetos(tipo) {
  filtroAtual = tipo;
  renderProjetos();
}

// =========================
// RENDER PROJETOS
// =========================
function renderProjetos() {
  const lista = document.getElementById("listaProjetos");
  if (!lista) return;

  lista.innerHTML = "";

  let listaFiltrada = projetos;

  if (filtroAtual === "pendentes") {
    listaFiltrada = projetos.filter(p => !p.pago);
  } else if (filtroAtual === "pagos") {
    listaFiltrada = projetos.filter(p => p.pago);
  }

  listaFiltrada.forEach((p) => {
    const indexReal = projetos.indexOf(p);

    const li = document.createElement("li");

li.innerHTML = `
  <div>
    <strong>${p.nome}</strong>
    <br>
    <small>${p.clienteNome || ""}</small>
  </div>

  <div>
    <span class="badge ${p.pago ? 'pago' : 'pendente'}">
      ${p.pago ? 'Pago' : 'Pendente'}
    </span>
  </div>
`;

    lista.appendChild(li);
  });
}

// =========================
// DASHBOARD
// =========================
function atualizarDashboard() {
  const ganhos = projetos
    .filter(p => p.pago)
    .reduce((total, p) => total + p.valor, 0);

  const pendentes = projetos.filter(p => !p.pago).length;

  const ganhosEl = document.getElementById("ganhos");
  const totalEl = document.getElementById("totalProjetos");
  const pendentesEl = document.getElementById("pendentes");

  if (ganhosEl) ganhosEl.innerText = "R$ " + ganhos;
  if (totalEl) totalEl.innerText = projetos.length;
  if (pendentesEl) pendentesEl.innerText = pendentes;

  renderGrafico();
}

// =========================
// GRÁFICO
// =========================
function renderGrafico() {
  const ctx = document.getElementById("grafico");
  if (!ctx) return;

  if (chart) chart.destroy();

  const nomes = projetos.map(p => p.nome);
  const valores = projetos.map(p => p.valor);

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [{
        label: "Ganhos por Projeto",
        data: valores
      }]
    }
  });
}

// =========================
// INIT
// =========================
carregarClientes();
carregarProjetos();