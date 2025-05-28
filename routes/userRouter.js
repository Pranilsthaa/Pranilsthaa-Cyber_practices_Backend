const { getUserPermission } = require("../controller/userController");

const userRouter = require("express").Router();

userRouter.get("/get-permission", getUserPermission);

module.exports = userRouter;
