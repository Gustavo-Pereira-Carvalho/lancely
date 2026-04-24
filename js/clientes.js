let clientes = [];

export function getClientes() {
  return clientes;
}

export async function carregarClientes() {
  const res = await fetch("http://localhost:3000/clientes", {
    headers: { Authorization: localStorage.getItem("token") }
  });

  clientes = await res.json();

  renderClientes();
  preencherClientesSelect();
}

export async function addCliente() {
  const input = document.getElementById("clienteInput");

  if (!input.value) return alert("Digite um nome");

  await fetch("http://localhost:3000/clientes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token")
    },
    body: JSON.stringify({ nome: input.value })
  });

  input.value = "";
  carregarClientes();
}

export async function removerCliente(id) {
  await fetch(`http://localhost:3000/clientes/${id}`, {
    method: "DELETE",
    headers: { Authorization: localStorage.getItem("token") }
  });

  carregarClientes();
}

function renderClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  clientes.forEach(c => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${c.nome}
      <button onclick="removerCliente('${c._id}')">X</button>
    `;

    lista.appendChild(li);
  });
}

export function preencherClientesSelect() {
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

window.addCliente = addCliente;
window.removerCliente = removerCliente;