const mongoose = require("mongoose");

const ProjetoSchema = new mongoose.Schema({
  nome: String,
  valor: Number,
  pago: Boolean,
  prazo: Date,
  clienteNome: String,
  userId: String,
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Projeto", ProjetoSchema);