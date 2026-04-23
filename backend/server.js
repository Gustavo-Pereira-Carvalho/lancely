require("dotenv").config(); // 🔥 IMPORTANTE (tem que ser o primeiro)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

// =========================
// CONEXÃO
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch(err => console.error("Erro Mongo:", err));

// =========================
// MODELS
// =========================
const User = mongoose.model("User", {
  nome: String,
  email: String,
  senha: String
});

const Cliente = mongoose.model("Cliente", {
  nome: String,
  userId: String
});

const Projeto = mongoose.model("Projeto", {
  nome: String,
  valor: Number,
  pago: Boolean,
  clienteId: String,
  clienteNome: String,
  userId: String,
  prazo: Date, // 🔥 importante
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

// =========================
// AUTH
// =========================
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ erro: "Sem token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido" });
  }
}

// =========================
// ROTAS
// =========================
app.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;

  const existe = await User.findOne({ email });
  if (existe) return res.json({ erro: "Usuário já existe" });

  const senhaHash = await bcrypt.hash(senha, 10);

  const user = await User.create({ nome, email, senha: senhaHash });

  res.json({ ok: true });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ erro: "Usuário não encontrado" });

  const ok = await bcrypt.compare(senha, user.senha);
  if (!ok) return res.json({ erro: "Senha incorreta" });

  const token = jwt.sign({ id: user._id }, SECRET);

  res.json({
    token,
    nome: user.nome // 🔥 AQUI
  });
});

// CLIENTES
app.get("/clientes", auth, async (req, res) => {
  res.json(await Cliente.find({ userId: req.userId }));
});

app.post("/clientes", auth, async (req, res) => {
  res.json(await Cliente.create({ ...req.body, userId: req.userId }));
});

app.delete("/clientes/:id", auth, async (req, res) => {
  await Cliente.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

// PROJETOS
app.get("/projetos", auth, async (req, res) => {
  res.json(await Projeto.find({ userId: req.userId }));
});

app.post("/projetos", auth, async (req, res) => {
  res.json(await Projeto.create({ ...req.body, userId: req.userId }));
});

app.put("/projetos/:id", auth, async (req, res) => {
  const projeto = await Projeto.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!projeto) return res.status(404).json({ erro: "Não encontrado" });

  projeto.pago = !projeto.pago;
  await projeto.save();

  res.json(projeto);
});

app.delete("/projetos/:id", auth, async (req, res) => {
  await Projeto.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  res.json({ ok: true });
});

// =========================
// SERVER
// =========================
app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando 🚀");
});