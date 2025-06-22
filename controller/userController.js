const {runQuery} = require('../connection');

const fetchUserPermissions = async roleId => {
  if (!roleId) {
    throw new Error('Role ID is required to fetch permissions.');
  }
  return await runQuery(
    ` SELECT 
        up.id,
        up.permission
        FROM user_permission up
        INNER JOIN role_permission rp 
        ON up.id = rp.permission_id
        WHERE rp.role_id = ?;`,
    [roleId],
  );
};

const getUserPermission = async (req, res) => {
  try {
    const user_permissions = await fetchUserPermissions(req.user.role);
    if (user_permissions.length > 0) {
      res.status(200).send({
        user_permissions,
        roleId: req.user.role,
      });
    } else {
      res.status(204).send({message: 'No permissions found for this user.'});
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
    throw error;
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await runQuery(
      'SELECT email, username, phone, address, role, 2fa, password_changed_at FROM user_cred WHERE id=?',
      [req.user.id],
    );
    if (user.length > 0) {
      res.status(200).send(user[0]);
    } else {
      res.status(404).send({message: 'User not found'});
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send({message: 'Internal server error'});
  }
};

const toggle2FA = async (req, res) => {
  try {
    const {enable} = req.body;
    if (typeof enable !== 'boolean') {
      return res.status(400).send({message: 'Invalid request body'});
    }
    await runQuery(`UPDATE user_cred SET 2fa = ? WHERE id = ?`, [enable, req.user.id]);
    res.status(200).send({message: '2FA setting updated successfully'});
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  fetchUserPermissions,
  getUserPermission,
  getProfile,
  toggle2FA,
};
