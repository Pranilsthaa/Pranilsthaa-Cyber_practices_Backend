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
  updatePasswordWithOld,
} = require('../controller/authController');
const {authenticate} = require('../middleware/authMiddleware');

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
authRouter.post('/change-password-with-old', authenticate, updatePasswordWithOld);

module.exports = authRouter;
