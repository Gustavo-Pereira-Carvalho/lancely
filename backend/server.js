require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const User = require("./models/User");
const Cliente = require("./models/Cliente");
const Projeto = require("./models/Projeto");
const Pagamento = require("./models/Pagamento");

const auth = require("./middlewares/auth");
const checkPlano = require("./middlewares/checkPlano");
const limiteFree = require("./middlewares/limiteFree");

const authRoutes = require("./routes/authRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const projetoRoutes = require("./routes/projetoRoutes");
const pagamentoRoutes = require("./routes/pagamentoRoutes");

const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.use("/", authRoutes);
app.use("/clientes", clienteRoutes);
app.use("/projetos", projetoRoutes);
app.use("/", pagamentoRoutes);

// =========================
// START
// =========================
app.listen(3000, () => {
  console.log("🚀 SERVER RUNNING ON 3000");
});