const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const SECRET = process.env.JWT_SECRET;

async function register(req, res) {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            erro: "dados incompletos"
        });
    }

    const existe = await User.findOne({ email });

    if (existe) {
        return res.json({
            erro: "email já cadastrado"
        });
    }

    const hash = await bcrypt.hash(senha, 10);

    await User.create({
        nome,
        email,
        senha: hash
    });

    res.json({
        ok: true
    });

}

async function login(req, res) {

    const user = await User.findOne({
        email: req.body.email
    });

    if (!user) {
        return res.json({
            erro: "user not found"
        });
    }

    const ok = await bcrypt.compare(
        req.body.senha,
        user.senha
    );

    if (!ok) {
        return res.json({
            erro: "senha inválida"
        });
    }

    const token = jwt.sign(
        {
            id: user._id
        },
        SECRET
    );

    res.json({
        token,
        nome: user.nome,
        plano: user.plano.tipo
    });

}

function me(req, res) {
    res.json(req.user);
}

module.exports = {
    register,
    login,
    me
};