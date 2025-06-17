const authRouter = require('express').Router();
const {
  login,
  register,
  logout,
  verifyEmail,
  verifyOTP,
  changePassword,
} = require('../controller/authController');

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.post('/logout', logout);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/change-password', changePassword);

module.exports = authRouter;
