import { request } from "./api.js";

export function protegerRota() {
  const token = localStorage.getItem("token");

  if (!token && !window.location.href.includes("login.html")) {
    window.location.href = "login.html";
  }
}

export async function login() {
  const email = document.getElementById("email")?.value;
  const senha = document.getElementById("senha")?.value;

  if (!email || !senha) return alert("Preencha tudo");

  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify({ email, senha })
  });

  if (data.erro) return alert(data.erro);

  localStorage.setItem("token", data.token);
  window.location.href = "dashboard.html";
}

export async function register() {
  const email = document.getElementById("email")?.value;
  const senha = document.getElementById("senha")?.value;

  if (!email || !senha) return alert("Preencha tudo");

  const data = await request("/register", {
    method: "POST",
    body: JSON.stringify({ email, senha })
  });

  if (data.erro) return alert(data.erro);

  alert("Conta criada!");
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}