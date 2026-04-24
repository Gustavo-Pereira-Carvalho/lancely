require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("\n==============================");
  console.log("📥", req.method, req.url);
  console.log("BODY:", req.body);
  console.log("==============================\n");
  next();
});

const SECRET = process.env.JWT_SECRET;

// =========================
// MONGODB
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 MongoDB conectado"))
  .catch(err => console.log(err));

// =========================
// MODELS
// =========================
const User = mongoose.model("User", {
  nome: String,
  email: String,
  senha: String,
  plano: {
    tipo: { type: String, default: "free" },
    expiraEm: Date
  }
});

const Cliente = mongoose.model("Cliente", {
  nome: String,
  userId: String
});

const Projeto = mongoose.model("Projeto", {
  nome: String,
  valor: Number,
  pago: Boolean,
  prazo: Date,
  clienteNome: String,
  userId: String,
  criadoEm: { type: Date, default: Date.now }
});

// =========================
// AUTH
// =========================
function auth(req, res, next) {
  let token = req.headers.authorization;

  if (!token) return res.status(401).json({ erro: "Sem token" });

  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

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
  const hash = await bcrypt.hash(req.body.senha, 10);

  await User.create({
    nome: req.body.nome,
    email: req.body.email,
    senha: hash
  });

  res.json({ ok: true });
});

// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.json({ erro: "user not found" });

  const ok = await bcrypt.compare(req.body.senha, user.senha);

  if (!ok) return res.json({ erro: "senha inválida" });

  const token = jwt.sign({ id: user._id }, SECRET);

  res.json({
    token,
    nome: user.nome,
    plano: user.plano.tipo
  });
});

// =========================
// ME
// =========================
app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user);
});

// =========================
// CHECKOUT (CORRIGIDO 100%)
// =========================
app.post("/create-checkout", auth, async (req, res) => {
  try {
    console.log("🧾 criando checkout...");

    const payload = {
      items: [
        {
          title: "Plano PRO",
          quantity: 1,
          unit_price: 29,
          currency_id: "BRL"
        }
      ],

      back_urls: {
        success: "http://localhost:5500/dashboard.html",
        failure: "http://localhost:5500/planos.html",
        pending: "http://localhost:5500/planos.html"
      },

      external_reference: req.userId,

      notification_url: process.env.WEBHOOK_URL
    };

    console.log("PAYLOAD:", payload);

    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data;

    console.log("INIT POINT:", data.init_point);

    return res.json({ init_point: data.init_point });

  } catch (err) {
    console.log("❌ CHECKOUT ERROR:");
    console.log(err.response?.data || err.message);

    return res.status(500).json({
      erro: "checkout error"
    });
  }
});

// =========================
// WEBHOOK (FUNCIONANDO)
// =========================
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK RECEBIDO:", req.body);

    const body = req.body;

    // =========================
    // FORMATO 1 (payment)
    // =========================
    const paymentId = body?.data?.id;

    // =========================
    // FORMATO 2 (merchant order)
    // =========================
    const merchantOrder = body?.resource;

    if (paymentId) {
      console.log("💳 PAYMENT ID:", paymentId);

      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
          }
        }
      );

      const payment = response.data;

      console.log("💰 STATUS:", payment.status);

      if (payment.status === "approved") {
        const user = await User.findById(payment.external_reference);

        if (user) {
          user.plano.tipo = "pro";
          user.plano.expiraEm = new Date(Date.now() + 30 * 86400000);
          await user.save();

          console.log("🚀 PLANO ATIVADO!");
        }
      }
    }

    return res.sendStatus(200);

  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.sendStatus(200);
  }
});

// =========================
// CLIENTES
// =========================
app.get("/clientes", auth, async (req, res) => {
  const data = await Cliente.find({ userId: req.userId });
  res.json(data);
});

app.post("/clientes", auth, async (req, res) => {
  const data = await Cliente.create({
    nome: req.body.nome,
    userId: req.userId
  });

  res.json(data);
});

// =========================
// PROJETOS
// =========================
app.get("/projetos", auth, async (req, res) => {
  const data = await Projeto.find({ userId: req.userId });
  res.json(data);
});

app.post("/projetos", auth, async (req, res) => {
  const data = await Projeto.create({
    nome: req.body.nome,
    valor: req.body.valor,
    pago: false,
    prazo: req.body.prazo,
    clienteNome: req.body.clienteNome,
    userId: req.userId
  });

  res.json(data);
});

// =========================
// START
// =========================
app.listen(3000, () => {
  console.log("🚀 SERVER RUNNING ON 3000");
});