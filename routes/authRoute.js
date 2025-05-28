const authRouter = require("express").Router();
const { login, register, logout } = require("../controller/authController");

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/logout", logout);

module.exports = authRouter;
