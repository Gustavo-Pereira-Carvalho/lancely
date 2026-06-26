const Cliente = require("../models/Cliente");
const Projeto = require("../models/Projeto");

function limiteFree(tipo) {
  return async (req, res, next) => {
    if (req.user.plano.tipo === "pro") {
      return next();
    }

    if (tipo === "clientes") {
      const count = await Cliente.countDocuments({
        userId: req.userId
      });

      if (count >= 3) {
        return res.status(403).json({
          erro: "limite FREE: 3 clientes"
        });
      }
    }

    if (tipo === "projetos") {
      const count = await Projeto.countDocuments({
        userId: req.userId
      });

      if (count >= 5) {
        return res.status(403).json({
          erro: "limite FREE: 5 projetos"
        });
      }
    }

    next();
  };
}

module.exports = limiteFree;