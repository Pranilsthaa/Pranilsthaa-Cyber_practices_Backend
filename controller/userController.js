const { runQuery } = require("../connection");

const getUserPermission = async (req, res) => {
  console.log();
  try {
    const user_permissions = await runQuery(
      ` SELECT 
        up.id,
        up.permission
        FROM user_permission up
        INNER JOIN role_permission rp 
        ON up.id = rp.permission_id
        WHERE rp.role_id = ?;`,
      [req.user.role]
    );
    console.log(user_permissions);
    if (user_permissions.length > 0) {
      res.status(200).send(user_permissions);
    } else {
      res.status(404).send({ message: "No permissions found for this user." });
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
};

module.exports = {
  getUserPermission,
};
