const express = require("express");

const auth = require("../middlewares/auth");

const pagamentoController = require("../controllers/pagamentoController");

const router = express.Router();

router.post(
  "/create-checkout",
  auth,
  pagamentoController.createCheckout
);

router.post(
  "/webhook",
  pagamentoController.webhook
);

module.exports = router;