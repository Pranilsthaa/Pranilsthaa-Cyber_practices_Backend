const {runQuery} = require('../connection');
const crypto = require('crypto');
const {encrypt} = require('../helper/encrypt');

const getUsers = async (req, res) => {
  try {
    const result = await runQuery('SELECT id, username, role FROM user_cred');
    if (result.length > 0) {
      const SECRET_KEY = crypto.randomBytes(32); // 32 bytes for AES-256
      const IV = crypto.randomBytes(16); // 16 bytes for AES block size
      const encryptedData = encrypt(JSON.stringify(result), SECRET_KEY, IV);
      return res.status(200).send({
        enc: encryptedData,
        iv: IV.toString('hex'),
        key: SECRET_KEY.toString('hex'),
      });
    } else {
      return res.status(200).send([]);
    }
  } catch (e) {
    console.log(e);
  }
};

const getUserRoles = async (req, res) => {
  if (!req.query.id) {
    try {
      const roles = await runQuery('SELECT * FROM user_roles');
      if (roles.length === 0) {
        return res.status(404).send({message: 'No roles found'});
      }
      const filteredRoles = roles.filter(role => role.id != 3);
      return res.status(200).send(filteredRoles);
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
      p.type,
      rp.role_id IS NOT NULL AS assigned
        FROM user_permission p
          LEFT JOIN role_permission rp 
      ON p.id = rp.permission_id AND rp.role_id = ?
`,
        [req.query.id],
      );
      return res.status(200).send({
        client: permissions.filter(permission => permission.type === 'client') || [],
        employee: permissions.filter(permission => permission.type === 'manager') || [],
        project: permissions.filter(permission => permission.type === 'auditor') || [],
      });
    } catch (e) {
      console.log(e);
    }
  }
};

const updatePermission = async (req, res) => {
  const {role_id, permission_id} = req.body;
  try {
    const result = await runQuery('SELECT * FROM role_permission WHERE role_id=?', [
      role_id,
    ]);
    if (result.length > 0) {
      await runQuery('DELETE FROM role_permission WHERE role_id=?', [role_id]);
    }

    permission_id.map(async permission_id => {
      await runQuery(
        'INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)',
        [role_id, permission_id],
      );
    });

    return res.status(200).send({message: 'Permissions updated'});
  } catch (e) {
    console.log(e);
  }
};

const updateRole = async (req, res) => {
  const {user_id, role_id} = req.body;
  try {
    const result = await runQuery('SELECT * FROM user_cred WHERE id=?', [user_id]);
    if (result.length > 0) {
      await runQuery('UPDATE user_cred SET role=? WHERE id=?', [role_id, user_id]);
      return res.status(200).send({message: 'Role updated'});
    } else {
      return res.status(400).send({message: 'User not found'});
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
