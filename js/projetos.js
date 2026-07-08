import { getClientes, carregarClientes } from "./clientes.js";

let projetos = [];
let filtroAtual = "todos";
let projetoEditando = null;
let textoBusca = "";

const btn = document.getElementById("btnAddProjeto");
const busca = document.getElementById("buscarProjeto");

function isPro() {
  return localStorage.getItem("plano") === "pro";
}

export function getProjetos() {
  return projetos;
}

/* ==========================================
   EVENTOS
========================================== */

if (btn) {
  btn.addEventListener("click", salvarProjeto);
}

if (busca) {
  busca.addEventListener("input", (e) => {
    textoBusca = e.target.value.toLowerCase().trim();
    renderProjetos();
  });
}

/* ==========================================
   CARREGAR
========================================== */

export async function carregarProjetos() {
  try {
    const res = await fetch("http://localhost:3000/projetos", {
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });

    projetos = await res.json();

    atualizarLimiteProjetos();
    renderProjetos();
  } catch (err) {
    console.error("Erro ao carregar projetos:", err);
  }
}

/* ==========================================
   CRIAR / EDITAR
========================================== */

async function salvarProjeto() {
  const nomeInput = document.getElementById("projetoNome");
  const valorInput = document.getElementById("projetoValor");
  const clienteSelect = document.getElementById("clienteSelect");
  const prazoInput = document.getElementById("projetoPrazo");

  const nome = nomeInput.value.trim();
  const valor = Number(valorInput.value);
  const clienteId = clienteSelect.value;
  const prazo = prazoInput.value;

  if (getClientes().length === 0) {
    await carregarClientes();
  }

  const cliente = getClientes().find(c => c._id === clienteId);

  if (!nome || !valor || !cliente || !prazo) {
    return alert("Preencha todos os campos.");
  }

  try {
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
      // CRIAR
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

    limparFormulario();
    carregarProjetos();

  } catch (err) {
    console.error("Erro ao salvar projeto:", err);
    alert("Não foi possível salvar o projeto.");
  }
}

/* ==========================================
   EDITAR
========================================== */

function editarProjeto(projeto) {
  projetoEditando = projeto._id;

  document.getElementById("projetoNome").value = projeto.nome;
  document.getElementById("projetoValor").value = projeto.valor;
  document.getElementById("projetoPrazo").value =
    projeto.prazo ? projeto.prazo.substring(0, 10) : "";

  const cliente = getClientes().find(
    c => c.nome === projeto.clienteNome
  );

  if (cliente) {
    document.getElementById("clienteSelect").value = cliente._id;
  }

  if (btn) btn.innerText = "Salvar";

  // sobe para o formulário quando clicar em editar
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* ==========================================
   PAGO / PENDENTE
========================================== */

export async function toggleProjeto(id) {
  try {
    await fetch(`http://localhost:3000/projetos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });

    carregarProjetos();
  } catch (err) {
    console.error("Erro ao atualizar projeto:", err);
  }
}

/* ==========================================
   REMOVER
========================================== */

export async function removerProjeto(id) {
  if (!confirm("Deseja excluir este projeto?")) {
    return;
  }

  try {
    await fetch(`http://localhost:3000/projetos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });

    carregarProjetos();
  } catch (err) {
    console.error("Erro ao remover projeto:", err);
  }
}

/* ==========================================
   LIMITE DO PLANO
========================================== */

function atualizarLimiteProjetos() {
  const texto = document.querySelector(".plan-box p");
  if (!texto) return;

  if (isPro()) {
    texto.innerText = "Projetos ilimitados";
    return;
  }

  texto.innerText = `Limites ativos • ${projetos.length}/5 projetos`;
}

/* ==========================================
   FILTRO
========================================== */

window.filtrarProjetos = function (tipo) {
  filtroAtual = tipo;

  document
    .querySelectorAll(".filtros button")
    .forEach(btn => btn.classList.remove("active"));

  const indice = {
    todos: 0,
    pendentes: 1,
    pagos: 2
  };

  const botoes = document.querySelectorAll(".filtros button");

  if (botoes[indice[tipo]]) {
    botoes[indice[tipo]].classList.add("active");
  }

  renderProjetos();
};

/* ==========================================
   RENDER
========================================== */

function renderProjetos() {
  const lista = document.getElementById("listaProjetos");
  if (!lista) return;

  lista.innerHTML = "";

  let filtrados = [...projetos];

  // filtro por status
  if (filtroAtual === "pagos") {
    filtrados = filtrados.filter(p => p.pago);
  }

  if (filtroAtual === "pendentes") {
    filtrados = filtrados.filter(p => !p.pago);
  }

  // busca
  if (textoBusca) {
    filtrados = filtrados.filter(p =>
      p.nome.toLowerCase().includes(textoBusca) ||
      p.clienteNome.toLowerCase().includes(textoBusca)
    );
  }

  // vazio
  if (filtrados.length === 0) {
    lista.innerHTML = `
      <div class="lista-vazia">
        <strong>Nenhum projeto encontrado</strong>
        <span>
          ${
            textoBusca
              ? "Tente buscar por outro nome ou cliente."
              : "Adicione um novo projeto para começar."
          }
        </span>
      </div>
    `;
    return;
  }

  filtrados.forEach(projeto => {
    const li = document.createElement("li");

    const valorFormatado = Number(projeto.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const prazoFormatado = projeto.prazo
      ? new Date(projeto.prazo).toLocaleDateString("pt-BR")
      : "-";

    li.innerHTML = `
      <div class="projeto-info">
        <strong>${projeto.nome}</strong>

        <small>
          <span>👤 ${projeto.clienteNome}</span>
          <span>📅 ${prazoFormatado}</span>
        </small>
      </div>

      <div class="projeto-extra">
        <span class="valor">${valorFormatado}</span>

        <span class="${projeto.pago ? "status-pago" : "status-pendente"}">
          ${projeto.pago ? "Pago" : "Pendente"}
        </span>

        <div class="acoes">
          <button
            class="btn-pago"
            title="${projeto.pago ? "Marcar como pendente" : "Marcar como pago"}"
          >
            ✔
          </button>

          <button
            class="btn-editar"
            title="Editar"
          >
            ✏️
          </button>

          <button
            class="btn-remove"
            title="Excluir"
          >
            🗑️
          </button>
        </div>
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

/* ==========================================
   HELPERS
========================================== */

function limparFormulario() {
  document.getElementById("projetoNome").value = "";
  document.getElementById("projetoValor").value = "";
  document.getElementById("projetoPrazo").value = "";

  const clienteSelect = document.getElementById("clienteSelect");
  if (clienteSelect) clienteSelect.value = "";

  projetoEditando = null;

  if (btn) btn.innerText = "Adicionar";
}

/* ==========================================
   EXPORTS GLOBAIS
========================================== */

window.addProjeto = salvarProjeto;
window.toggleProjeto = toggleProjeto;
window.removerProjeto = removerProjeto;