const mongoose = require("mongoose");

const ClienteSchema = new mongoose.Schema({
  nome: String,
  userId: String
});

module.exports = mongoose.model("Cliente", ClienteSchema);