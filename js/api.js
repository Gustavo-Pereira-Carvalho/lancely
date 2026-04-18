export const API = "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("token");
}

export async function request(url, options = {}) {
  const token = getToken();

  const res = await fetch(API + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      ...(options.headers || {})
    }
  });

  return res.json();
}