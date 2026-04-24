require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("\n==============================");
  console.log("📥", req.method, req.url);
  console.log("BODY:", req.body);
  console.log("QUERY:", req.query);
  console.log("==============================");
  next();
});

// =========================
// CONFIG
// =========================
const SECRET = process.env.JWT_SECRET;

// =========================
// MONGO
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 MongoDB conectado"))
  .catch(err => console.log(err));

// =========================
// MERCADO PAGO
// =========================
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// =========================
// MODELS
// =========================
const User = mongoose.model("User", {
  nome: String,
  email: String,
  senha: String,
  role: { type: String, default: "user" }, // 👈 ADMIN SYSTEM
  plano: {
    tipo: { type: String, default: "free" },
    expiraEm: Date,
  },
});

// =========================
// AUTH USER
// =========================
function auth(req, res, next) {
  let token = req.headers.authorization;

  if (!token) return res.status(401).json({ erro: "sem token" });

  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ erro: "token inválido" });
  }
}

// =========================
// AUTH ADMIN
// =========================
function adminAuth(req, res, next) {
  let token = req.headers.authorization;

  if (!token) return res.status(401).json({ erro: "sem token" });

  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ erro: "acesso negado" });
    }

    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ erro: "token inválido" });
  }
}

// =========================
// LOGIN USER
// =========================
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.json({ erro: "user not found" });

  const ok = await bcrypt.compare(req.body.senha, user.senha);
  if (!ok) return res.json({ erro: "senha inválida" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    SECRET
  );

  res.json({
    token,
    nome: user.nome,
    role: user.role,
    plano: user.plano.tipo
  });
});

// =========================
// LOGIN ADMIN (SEPARADO)
// =========================
app.post("/admin/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || user.role !== "admin") {
    return res.status(403).json({ erro: "não é admin" });
  }

  const ok = await bcrypt.compare(req.body.senha, user.senha);
  if (!ok) return res.json({ erro: "senha inválida" });

  const token = jwt.sign(
    { id: user._id, role: "admin" },
    SECRET
  );

  res.json({ token });
});

// =========================
// CHECKOUT
// =========================
app.post("/create-checkout", auth, async (req, res) => {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
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
        auto_return: "approved",
        external_reference: req.userId,
        notification_url: "https://nervous-lunchroom-matchless.ngrok-free.dev/webhook"
      }
    });

    return res.json({ init_point: result.init_point });

  } catch (err) {
    console.log("❌ checkout error:", err);
    return res.status(500).json({ erro: "checkout error" });
  }
});

// =========================
// WEBHOOK (ROBUSTO)
// =========================
app.post("/webhook", async (req, res) => {
  try {
    console.log("\n🔥 WEBHOOK RECEBIDO");

    const type =
      req.body?.type ||
      req.query?.type ||
      req.query?.topic;

    const dataId =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.body?.id ||
      req.query?.id ||
      req.body?.resource?.split?.("/").pop?.();

    console.log("➡️ TYPE:", type);
    console.log("➡️ ID:", dataId);

    if (!type || !dataId) return res.sendStatus(200);

    // ignora merchant order
    if (type === "merchant_order") {
      console.log("⛔ merchant_order ignorado");
      return res.sendStatus(200);
    }

    if (type !== "payment") return res.sendStatus(200);

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      console.log("⚠️ pagamento não encontrado");
      return res.sendStatus(200);
    }

    const payment = await response.json();

    console.log("💰 STATUS:", payment.status);

    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    const user = await User.findById(payment.external_reference);

    if (!user) return res.sendStatus(200);

    user.plano.tipo = "pro";
    user.plano.expiraEm = new Date(Date.now() + 30 * 86400000);

    await user.save();

    console.log("🚀 PLANO PRO ATIVADO!");

    return res.sendStatus(200);

  } catch (err) {
    console.log("❌ webhook error:", err);
    return res.sendStatus(200);
  }
});

// =========================
// ADMIN ROUTE EXAMPLE
// =========================
app.get("/admin/users", adminAuth, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// =========================
// START
// =========================
app.listen(3000, () => {
  console.log("🚀 SERVER RUNNING ON 3000");
});