const API = "http://localhost:3000";

// =========================
// LOGIN
// =========================
function login() {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  })
    .then(res => res.json())
    .then(data => {
      if (data.erro) return alert(data.erro);

      localStorage.setItem("token", data.token);
      localStorage.setItem("nome", data.nome);

      window.location.href = "dashboard.html";
    })
    .catch(err => {
      console.error("Erro login:", err);
      alert("Erro ao fazer login");
    });
}

// =========================
// REGISTER
// =========================
function register() {
  const nome = document.getElementById("registerNome").value;
  const email = document.getElementById("registerEmail").value;
  const senha = document.getElementById("registerSenha").value;

  fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha })
  })
    .then(res => res.json())
    .then(data => {
      if (data.erro) return alert(data.erro);

      alert("Conta criada com sucesso!");

      // volta para login (flip card)
      const wrapper = document.getElementById("cardWrapper");
      if (wrapper) wrapper.classList.remove("flipped");
    })
    .catch(err => {
      console.error("Erro register:", err);
      alert("Erro ao criar conta");
    });
}

// =========================
// TOGGLE CARD (CORRIGIDO)
// =========================
function toggleCard() {
  const wrapper = document.getElementById("cardWrapper");
  if (!wrapper) return;

  wrapper.classList.toggle("flipped");
}

// =========================
// GLOBAL
// =========================
window.login = login;
window.register = register;
window.toggleCard = toggleCard;