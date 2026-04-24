const API = "http://localhost:3000";

const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const avatarText = document.getElementById("avatarText");

const token = localStorage.getItem("token");

// =========================
// LOAD USER
// =========================
window.addEventListener("load", carregarUsuario);

async function carregarUsuario() {
  try {
    const res = await fetch(API + "/me", {
      headers: { Authorization: token }
    });

    const user = await res.json();

    if (!user || user.erro) {
      window.location.href = "login.html";
      return;
    }

    nomeInput.value = user.nome;
    emailInput.value = user.email;

    localStorage.setItem("nome", user.nome);

    atualizarAvatar(user.nome);

  } catch (err) {
    console.error(err);
  }
}

// =========================
// AVATAR
// =========================
function atualizarAvatar(nome) {
  avatarText.innerText = nome ? nome.charAt(0).toUpperCase() : "U";
}

// =========================
// AUTO SAVE LOCAL
// =========================
window.autoSalvar = function () {
  localStorage.setItem("nome", nomeInput.value);
  atualizarAvatar(nomeInput.value);
};

// =========================
// VOLTAR
// =========================
window.voltarDashboard = function () {
  window.location.href = "dashboard.html";
};