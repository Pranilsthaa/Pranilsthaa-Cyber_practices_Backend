const adminRoute = require("express").Router();

const {
  updateRole,
  getUsers,
  getUserRoles,
  updatePermission,
} = require("../controller/adminController");

adminRoute.get("/get-users", getUsers);
adminRoute.get("/get-user-roles", getUserRoles);
adminRoute.get("/update-permissions", updatePermission);
adminRoute.get("/update-role", updateRole);

module.exports = adminRoute;
