const {
  getUserPermission,
  getEmployee,
} = require("../controller/userController");
const {
  authenticate,
  authorizePermission,
} = require("../middleware/authMiddleware");

const userRouter = require("express").Router();

userRouter.get("/get-permission", getUserPermission);
userRouter.get(
  "/get-employee",
  authenticate,
  authorizePermission(["view:employee"]),
  getEmployee
);

module.exports = userRouter;
