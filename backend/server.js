const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET = "lancely_secret";

// =========================
// CONEXÃO
// =========================
mongoose.connect("mongodb://127.0.0.1:27017/lancely");

mongoose.connection.once("open", () => {
  console.log("MongoDB conectado 🚀");
});

// =========================
// MODELS
// =========================
const User = mongoose.model("User", {
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
  prazo: Date,
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
// REGISTER
// =========================
app.post("/register", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.json({ erro: "Preencha tudo" });
  }

  const existe = await User.findOne({ email });
  if (existe) return res.json({ erro: "Usuário já existe" });

  const senhaHash = await bcrypt.hash(senha, 10);

  await User.create({
    email,
    senha: senhaHash
  });

  res.json({ ok: true });
});

// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ erro: "Usuário não encontrado" });

  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (!senhaValida) return res.json({ erro: "Senha incorreta" });

  const token = jwt.sign({ id: user._id }, SECRET);

  res.json({ token });
});

// =========================
// CLIENTES
// =========================
app.get("/clientes", auth, async (req, res) => {
  const clientes = await Cliente.find({ userId: req.userId });
  res.json(clientes);
});

app.post("/clientes", auth, async (req, res) => {
  const novo = await Cliente.create({
    ...req.body,
    userId: req.userId
  });
  res.json(novo);
});

app.delete("/clientes/:id", auth, async (req, res) => {
  await Cliente.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });
  res.json({ ok: true });
});

// =========================
// PROJETOS
// =========================
app.get("/projetos", auth, async (req, res) => {
  const projetos = await Projeto.find({ userId: req.userId }).sort({ criadoEm: 1 });
  res.json(projetos);
});

app.post("/projetos", auth, async (req, res) => {
  const novo = await Projeto.create({
    ...req.body,
    userId: req.userId
  });
  res.json(novo);
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
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});