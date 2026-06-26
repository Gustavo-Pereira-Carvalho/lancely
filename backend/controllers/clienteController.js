const Cliente = require("../models/Cliente");

// =========================
// LISTAR
// =========================
async function listar(req, res) {
  const data = await Cliente.find({
    userId: req.userId
  });

  res.json(data);
}

// =========================
// CRIAR
// =========================
async function criar(req, res) {
  const data = await Cliente.create({
    nome: req.body.nome,
    userId: req.userId
  });

  res.json(data);
}

// =========================
// EDITAR
// =========================
async function editar(req, res) {
  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    return res.status(404).json({
      erro: "não encontrado"
    });
  }

  if (cliente.userId !== req.userId) {
    return res.status(403).json({
      erro: "sem permissão"
    });
  }

  cliente.nome = req.body.nome || cliente.nome;

  await cliente.save();

  res.json(cliente);
}

// =========================
// DELETAR
// =========================
async function deletar(req, res) {
  await Cliente.deleteOne({
    _id: req.params.id,
    userId: req.userId
  });

  res.json({
    ok: true
  });
}

module.exports = {
  listar,
  criar,
  editar,
  deletar
};