import { request } from "./api.js";

let clientes = [];

export async function carregarClientes() {
  if (!document.getElementById("listaClientes") && !document.getElementById("clienteSelect")) return;

  clientes = await request("/clientes");

  renderClientes();
  preencherSelect();
}

function renderClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  clientes.forEach((c, i) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${c.nome}
      <button onclick="window.removerCliente(${i})">X</button>
    `;

    lista.appendChild(li);
  });
}

function preencherSelect() {
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

export async function addCliente() {
  const input = document.getElementById("clienteInput");
  if (!input?.value) return;

  await request("/clientes", {
    method: "POST",
    body: JSON.stringify({ nome: input.value })
  });

  input.value = "";
  carregarClientes();
}

export async function removerCliente(index) {
  const id = clientes[index]._id;

  await request(`/clientes/${id}`, {
    method: "DELETE"
  });

  carregarClientes();
}

// deixar global pro HTML
window.addCliente = addCliente;
window.removerCliente = removerCliente;