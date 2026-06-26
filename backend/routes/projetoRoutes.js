const express = require("express");

const auth = require("../middlewares/auth");
const checkPlano = require("../middlewares/checkPlano");
const limiteFree = require("../middlewares/limiteFree");

const projetoController = require("../controllers/projetoController");

const router = express.Router();

router.get("/", auth, checkPlano, projetoController.listar);

router.post(
  "/",
  auth,
  checkPlano,
  limiteFree("projetos"),
  projetoController.criar
);

router.put("/:id/edit", auth, projetoController.editar);

router.put("/:id", auth, projetoController.togglePago);

router.delete("/:id", auth, projetoController.deletar);

module.exports = router;