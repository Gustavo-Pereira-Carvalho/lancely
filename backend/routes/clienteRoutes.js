const express = require("express");

const auth = require("../middlewares/auth");
const checkPlano = require("../middlewares/checkPlano");
const limiteFree = require("../middlewares/limiteFree");

const clienteController = require("../controllers/clienteController");

const router = express.Router();

router.get("/", auth, checkPlano, clienteController.listar);

router.post(
  "/",
  auth,
  checkPlano,
  limiteFree("clientes"),
  clienteController.criar
);

router.put("/:id", auth, clienteController.editar);

router.delete("/:id", auth, clienteController.deletar);

module.exports = router;