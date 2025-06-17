const authRouter = require('express').Router();
const {login, register, logout, verifyEmail} = require('../controller/authController');

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.post('/logout', logout);
authRouter.post('/verify-email', verifyEmail);

module.exports = authRouter;
