const User = require("../models/User");

async function checkPlano(req, res, next) {
  const user = await User.findById(req.userId).select("-senha");

  if (!user) {
    return res.status(404).json({
      erro: "user not found"
    });
  }

  if (user.plano.tipo === "pro" && user.plano.expiraEm) {
    if (new Date() > new Date(user.plano.expiraEm)) {
      user.plano.tipo = "free";
      user.plano.expiraEm = null;

      await user.save();

      console.log("⏰ plano expirou");
    }
  }

  req.user = user;

  next();
}

module.exports = checkPlano;