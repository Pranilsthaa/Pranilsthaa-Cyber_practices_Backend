const {
  getUserPermission,
  getEmployee,
  getProfile,
} = require('../controller/userController');
const {authenticate, authorizePermission} = require('../middleware/authMiddleware');

const userRouter = require('express').Router();

userRouter.get('/get-permission', authenticate, getUserPermission);
userRouter.get('/get-profile', authenticate, getProfile);
userRouter.get(
  '/get-employee',
  authenticate,
  authorizePermission(['view:employee']),
  getEmployee,
);

module.exports = userRouter;
