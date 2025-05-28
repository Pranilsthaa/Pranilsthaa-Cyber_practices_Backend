const { runQuery } = require("../connection");

const getUsers = async (req, res) => {
  try {
    const result = await runQuery("SELECT id, username, role FROM user_cred");
    return res.status(200).send(result);
  } catch (e) {
    console.log(e);
  }
};

const getUserRoles = async (req, res) => {
  if (!req.query.id) {
    try {
      const roles = await runQuery("SELECT * FROM user_roles");
      return res.status(200).send(roles);
    } catch (e) {
      console.log(e);
    }
  } else {
    try {
      const permissions = await runQuery(
        `
      SELECT 
      p.id,
      p.permission,
      rp.role_id IS NOT NULL AS assigned
        FROM user_permission p
          LEFT JOIN role_permission rp 
      ON p.id = rp.permission_id AND rp.role_id = ?
`,
        [req.query.id]
      );
      return res.status(200).send(permissions);
    } catch (e) {
      console.log(e);
    }
  }
};

const updatePermission = async (req, res) => {
  const { role_id, permission_id } = req.body;
  try {
    const result = await runQuery(
      "SELECT * FROM role_permission WHERE role_id=?",
      [role_id]
    );
    if (result.length > 0) {
      await runQuery("DELETE FROM role_permission WHERE role_id=?", [role_id]);
    }

    permission_id.map(async (permission_id) => {
      await runQuery(
        "INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)",
        [role_id, permission_id]
      );
    });

    return res.status(200).send({ message: "Permissions updated" });
  } catch (e) {
    console.log(e);
  }
};

const updateRole = async (req, res) => {
  const { user_id, role_id } = req.body;
  try {
    const result = await runQuery("SELECT * FROM user_cred WHERE id=?", [
      user_id,
    ]);
    if (result.length > 0) {
      await runQuery("UPDATE user_cred SET role=? WHERE id=?", [
        role_id,
        user_id,
      ]);
      return res.status(200).send({ message: "Role updated" });
    } else {
      return res.status(400).send({ message: "User not found" });
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  getUsers,
  getUserRoles,
  updatePermission,
  updateRole,
};
