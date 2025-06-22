const authRouter = require('express').Router();
const {
  login,
  register,
  logout,
  verifyEmail,
  verifyOTP,
  changePassword,
  approve,
  finalizeLogin,
  checkLoginStatus,
  deny,
} = require('../controller/authController');

authRouter.post('/login', login);
authRouter.get('/approve', approve);
authRouter.get('/deny', deny);
authRouter.get('/check-login-status', checkLoginStatus);
authRouter.post('/finalize-login', finalizeLogin);
authRouter.post('/register', register);
authRouter.post('/logout', logout);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/change-password', changePassword);

module.exports = authRouter;
