const jwt = require('jsonwebtoken');
const {fetchUserPermissions} = require('../controller/userController');
const {runQuery} = require('../connection');

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(419).send({message: 'Unauthorized'});
  }
  jwt.verify(token, 'secretKey123', async (err, user) => {
    if (err) {
      console.log('Token Error');
      return res.status(419).send({message: 'Forbidden'});
    }
    const updatedUser = await runQuery(
      'SELECT email, username, role FROM user_cred WHERE id=?',
      [user.id],
    );
    if (updatedUser.length === 0) {
      return res.status(419).send({message: 'User not found'});
    }
    req.user = updatedUser[0];
    next();
  });
}

function authenticateAdmin(req, res, next) {
  if (req.user.role !== '3') {
    return res.status(403).send({message: 'Forbidden'});
  }
  next();
}

function authorizePermission(permission) {
  return async (req, res, next) => {
    const userPermissions = await fetchUserPermissions(req.user.role);
    const hasPermission = userPermissions.some(userPerm =>
      permission.includes(userPerm.permission),
    );
    if (!hasPermission) {
      return res.status(403).send({message: 'Required Permission Not Matched'});
    }
    next();
  };
}

module.exports = {authenticate, authenticateAdmin, authorizePermission};
