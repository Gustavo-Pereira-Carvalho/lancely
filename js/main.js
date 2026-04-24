const API = "http://localhost:3000";

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.innerText = value;
}

// =========================
// PROTEÇÃO
// =========================
function protegerRota() {
  const token = localStorage.getItem("token");
  const isLogin = window.location.href.includes("login.html");

  if (!token && !isLogin) {
    window.location.href = "login.html";
  }
}

// =========================
// USUÁRIO
// =========================
async function carregarUsuario() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const res = await fetch(API + "/me", {
      headers: { Authorization: token }
    });

    const user = await res.json();

    if (!user || user.erro) return;

    setText("userNome", user.nome);
    setText("userEmail", user.email);
    setText("menuNome", user.nome);
    setText("menuEmail", user.email);

  } catch (err) {
    console.error("Erro /me:", err);
  }
}

// =========================
// MENU
// =========================
function toggleUserMenu() {
  const menu = $("userMenu");
  if (menu) menu.classList.toggle("active");
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function irPerfil() {
  window.location.href = "perfil.html";
}

function irPlanos() {
  window.location.href = "planos.html";
}

// expõe no window
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.irPerfil = irPerfil;
window.irPlanos = irPlanos;

// =========================
// INIT
// =========================
async function init() {
  await import("./auth.js");
  await carregarUsuario();

  const url = window.location.href;

  if (url.includes("clientes")) {
    const clientes = await import("./clientes.js");
    await clientes.carregarClientes();
  }

  if (url.includes("projetos")) {
    const clientes = await import("./clientes.js");
    const projetos = await import("./projetos.js");

    await clientes.carregarClientes();
    await projetos.carregarProjetos();
  }

  if (url.includes("dashboard")) {
    const clientes = await import("./clientes.js");
    const projetos = await import("./projetos.js");
    const dashboard = await import("./dashboard.js");

    await clientes.carregarClientes();
    await projetos.carregarProjetos();

    dashboard.atualizarDashboard();
  }
}

protegerRota();
init();