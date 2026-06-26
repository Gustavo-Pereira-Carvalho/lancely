const Projeto = require("../models/Projeto");

// =========================
// LISTAR
// =========================
async function listar(req, res) {
  const data = await Projeto.find({
    userId: req.userId
  });

  res.json(data);
}

// =========================
// CRIAR
// =========================
async function criar(req, res) {
  const data = await Projeto.create({
    nome: req.body.nome,
    valor: req.body.valor,
    pago: false,
    prazo: req.body.prazo,
    clienteNome: req.body.clienteNome,
    userId: req.userId
  });

  res.json(data);
}

// =========================
// EDITAR
// =========================
async function editar(req, res) {
  const projeto = await Projeto.findById(req.params.id);

  if (!projeto) {
    return res.status(404).json({
      erro: "não encontrado"
    });
  }

  if (projeto.userId !== req.userId) {
    return res.status(403).json({
      erro: "sem permissão"
    });
  }

  projeto.nome = req.body.nome || projeto.nome;
  projeto.valor = req.body.valor ?? projeto.valor;
  projeto.prazo = req.body.prazo || projeto.prazo;
  projeto.clienteNome = req.body.clienteNome || projeto.clienteNome;

  await projeto.save();

  res.json(projeto);
}

// =========================
// TOGGLE PAGO
// =========================
async function togglePago(req, res) {
  const projeto = await Projeto.findById(req.params.id);

  if (!projeto) {
    return res.status(404).json({
      erro: "não encontrado"
    });
  }

  if (projeto.userId !== req.userId) {
    return res.status(403).json({
      erro: "sem permissão"
    });
  }

  projeto.pago = !projeto.pago;

  await projeto.save();

  res.json(projeto);
}

// =========================
// DELETAR
// =========================
async function deletar(req, res) {
  await Projeto.deleteOne({
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
  togglePago,
  deletar
};