const fetch = require("node-fetch");

const User = require("../models/User");
const Pagamento = require("../models/Pagamento");

const { MercadoPagoConfig, Preference } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// =========================
// CHECKOUT
// =========================
async function createCheckout(req, res) {
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
      external_reference: req.userId,
      notification_url: process.env.WEBHOOK_URL
    }
  });

  res.json({
    init_point: result.init_point
  });
}

// =========================
// WEBHOOK
// =========================
async function webhook(req, res) {
  try {

    const type =
      req.body?.type ||
      req.query?.type ||
      req.query?.topic;

    const id =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.query?.id ||
      req.body?.resource?.split?.("/").pop?.();

    if (!type || !id) {
      return res.sendStatus(200);
    }

    if (type !== "payment") {
      return res.sendStatus(200);
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      return res.sendStatus(200);
    }

    const payment = await response.json();

    await Pagamento.create({
      userId: payment.external_reference,
      mpId: payment.id,
      status: payment.status,
      valor: payment.transaction_amount
    });

    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    const user = await User.findById(payment.external_reference);

    if (!user) {
      return res.sendStatus(200);
    }

    user.plano.tipo = "pro";
    user.plano.expiraEm = new Date(
      Date.now() + 30 * 86400000
    );

    await user.save();

    console.log("🚀 PRO ATIVADO");

    res.sendStatus(200);

  } catch (err) {

    console.log("❌ webhook error:", err);

    res.sendStatus(200);

  }
}

module.exports = {
  createCheckout,
  webhook
};