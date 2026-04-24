const API = "http://localhost:3000";

// =========================
// CARREGAR PLANO
// =========================
async function carregarPlano() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(API + "/me", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const user = await res.json();

    if (!user || user.erro) return;

    atualizarUI(user.plano?.tipo || "free");

  } catch (err) {
    console.error("Erro /me:", err);
  }
}

// =========================
// UI
// =========================
function atualizarUI(plano) {
  const btn = document.querySelector(".card.pro button");
  const title = document.querySelector(".card.pro h2");

  if (!btn || !title) return;

  if (plano === "pro") {
    title.innerText = "Pro (ativo)";
    btn.innerText = "Já ativo";
    btn.disabled = true;
  } else {
    title.innerText = "Pro";
    btn.innerText = "Ativar Pro";
    btn.disabled = false;
  }
}

// =========================
// PAGAMENTO
// =========================
async function ativarPlano() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(API + "/create-checkout", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      console.log(data);
      alert("Erro ao criar pagamento");
    }

  } catch (err) {
    console.error("Erro checkout:", err);
  }
}

carregarPlano();

window.ativarPlano = ativarPlano;