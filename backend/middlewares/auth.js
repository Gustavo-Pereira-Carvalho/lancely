const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

function auth(req, res, next) {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ erro: "sem token" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ erro: "token inválido" });
  }
}

module.exports = auth;