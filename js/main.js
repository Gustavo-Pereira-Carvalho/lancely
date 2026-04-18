import { protegerRota, login, register } from "./auth.js";
import { carregarClientes } from "./clientes.js";
import { carregarProjetos } from "./projetos.js";
import { atualizarDashboard } from "./dashboard.js";

protegerRota();

// LOGIN PAGE
if (document.getElementById("email")) {
  window.login = login;
  window.register = register;
}

// APP
carregarClientes();
carregarProjetos();

// espera carregar projetos antes do dashboard
setTimeout(() => {
  atualizarDashboard();
}, 300);