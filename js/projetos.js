import { request } from "./api.js";

let projetos = [];

export function getProjetos() {
  return projetos;
}

export async function carregarProjetos() {
  if (!document.getElementById("listaProjetos") && !document.getElementById("grafico")) return;

  projetos = await request("/projetos");

  renderProjetos();
}

function renderProjetos() {
  const lista = document.getElementById("listaProjetos");
  if (!lista) return;

  lista.innerHTML = "";

  projetos.slice(-5).reverse().forEach(p => {
    const index = projetos.indexOf(p);

    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${p.nome}</strong><br>
        <small>${p.clienteNome}</small>
      </div>

      <div>
        <span class="badge ${p.pago ? "pago" : "pendente"}">
          ${p.pago ? "Concluído" : "Pendente"}
        </span>
        <button onclick="window.marcarPago(${index})">✔</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

export async function addProjeto() {
  const nome = document.getElementById("projetoNome")?.value;
  const valor = Number(document.getElementById("projetoValor")?.value);
  const clienteId = document.getElementById("clienteSelect")?.value;

  if (!nome || !valor || !clienteId) return alert("Preencha tudo");

  await request("/projetos", {
    method: "POST",
    body: JSON.stringify({
      nome,
      valor,
      pago: false,
      clienteId
    })
  });

  carregarProjetos();
}

export async function marcarPago(index) {
  const id = projetos[index]._id;

  await request(`/projetos/${id}`, {
    method: "PUT"
  });

  carregarProjetos();
}

window.addProjeto = addProjeto;
window.marcarPago = marcarPago;