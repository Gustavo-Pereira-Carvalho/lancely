const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
  plano: {
    tipo: {
      type: String,
      default: "free"
    },
    expiraEm: Date
  }
});

module.exports = mongoose.model("User", UserSchema);