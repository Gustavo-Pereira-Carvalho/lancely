const mongoose = require("mongoose");

const PagamentoSchema = new mongoose.Schema({
  userId: String,
  mpId: String,
  status: String,
  valor: Number,
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Pagamento", PagamentoSchema);