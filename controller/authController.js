const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {runQuery} = require('../connection');
const {default: axios} = require('axios');
const {generateOTP} = require('../helper/generateOTP');
const {sendMail} = require('../helper/mailService');

const os = require('os');
const {isPasswordRepeated} = require('../helper/passwordHistory');
let currentIP = '';
const interfaces = os.networkInterfaces();

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      currentIP = iface.address;
      console.log(`Your local IP: ${iface.address}`);
    }
  }
}

const failureCount = {};

const login = async (req, res) => {
  const {username, password, captcha} = req.body;
  // if (failureCount[req.ip] >= 3) {
  //   const params = new URLSearchParams();
  //   params.append('secret', process.env.CAPTCHA_SECRET_KEY);
  //   params.append('response', captcha);
  //   params.append('remoteip', req.ip);
  //   // Verify the captcha
  //   const verifyCaptcha = await axios.post(
  //     'https://www.google.com/recaptcha/api/siteverify',
  //     params,
  //   );
  //   console.log(verifyCaptcha.data);
  //   if (!verifyCaptcha.data.success) {
  //     res.status(400).send({message: 'Invalid Captcha'});
  //     return;
  //   }
  // }
  try {
    const result = await runQuery('SELECT * FROM user_cred WHERE username=?', [username]);
    if (result.length > 0) {
      if (result[0]?.role === 'terminated') {
        return res.status(401).send({message: 'Account Terminated ! Contact SuperAdmin'});
      }
      const user = result[0];
      const hashPassword = user.password.toString();
      // Compare the provided password with the hashed password
      bcrypt.compare(password, hashPassword).then(async function (result) {
        if (result) {
          if (!user['2fa']) {
            const isAdmin = user.role === '3'; // role 3 is admin
            const user_roles = await runQuery(
              ` SELECT 
              up.id,
              up.permission
              FROM user_permission up
              INNER JOIN role_permission rp 
                ON up.id = rp.permission_id
              WHERE rp.role_id = ?;
            `,
              [user.role],
            );

            failureCount[req.ip] = 0; // Reset failure count on successful login

            const token = jwt.sign(
              {id: user.id, username: user.name, role: user.role},
              'secretKey123',
              {expiresIn: '1h'},
            );
            res.cookie('token', token, {
              httpOnly: true,
              secure: false,
              sameSite: 'lax',
            });
            return res.status(200).send({
              message: 'Login successful',
              role: user.role,
              permission: user_roles,
              isAdmin: isAdmin,
            });
          } else {
            const token2fa = crypto.randomUUID(); // Or use uuid
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 mins
            await runQuery(
              `INSERT INTO login_requests (user_id, token, expires_at) VALUES (?, ?, ?)`,
              [user.id, token2fa, expiresAt],
            );
            sendMail(
              user.email,
              'Login Approval Request',
              `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Login Approval</title>
                  </head>
                  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f7fa; color: #333;">
                    <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                      <h2 style="text-align: center; color: #2c3e50;">🔐 Login Request</h2>
                      <p style="font-size: 16px; text-align: center;">
                        A login attempt was made to your account. Please confirm or deny this request to continue.
                      </p>

                      <div style="text-align: center; margin-top: 30px;">
                        <a href="http://${currentIP}:5000/approve?token=${token2fa}"
                          style="display: inline-block; background-color: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                          ✅ Approve Login
                        </a>
                        <br/>
                        <a href="http://${currentIP}:5000/deny?token=${token2fa}"
                          style="display: inline-block; background-color: #dc3545; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                          ❌ Deny Login
                        </a>
                      </div>

                      <p style="font-size: 12px; color: #888; margin-top: 40px; text-align: center;">
                        If you did not attempt to log in, please deny the request immediately to secure your account.
                      </p>
                    </div>
                  </body>
                  </html>
                `,
            );

            return res
              .status(202)
              .send({message: 'Approval email sent. Please approve login.', token2fa});
          }
        } else {
          failureCount[req.ip] = (failureCount[req.ip] || 0) + 1;
          return res.status(401).send({message: 'Invalid credentials'});
        }
      });
    } else {
      failureCount[req.ip] = (failureCount[req.ip] || 0) + 1;
      return res.status(401).send({message: 'Invalid credentials'});
    }
  } catch (e) {
    console.log(e);
  }
};

const approve = async (req, res) => {
  const {token} = req.query;

  const result = await runQuery(`SELECT * FROM login_requests WHERE token = ?`, [token]);

  if (!result.length || result[0].status !== 'pending') {
    return res.send(`<h3>Invalid or expired link.</h3>`);
  }

  // Update to approved
  await runQuery(`UPDATE login_requests SET status = 'approved' WHERE token = ?`, [
    token,
  ]);

  return res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login Approved</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', sans-serif;
        background-color: #121212;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
      }
      h3 {
        font-size: 1.8rem;
        margin-bottom: 1rem;
      }
      p {
        font-size: 1rem;
        color: #bbbbbb;
        max-width: 90%;
        margin: 0 auto;
      }
      .box {
        background: #1e1e1e;
        padding: 30px 20px;
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
        max-width: 90%;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <h3>✅ Login Approved</h3>
      <p>You may now return to the app and continue securely.</p>
    </div>
  </body>
</html>
`);
};

const deny = async (req, res) => {
  const {token} = req.query;

  const result = await runQuery(`SELECT * FROM login_requests WHERE token = ?`, [token]);

  if (!result.length || result[0].status !== 'pending') {
    return res.send(`<h3>Invalid or expired link.</h3>`);
  }

  // Update to denied
  await runQuery(`UPDATE login_requests SET status = 'denied' WHERE token = ?`, [token]);

  return res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login Denied</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', sans-serif;
        background-color: #121212;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
      }
      h3 {
        font-size: 1.8rem;
        margin-bottom: 1rem;
      }
      p {
        font-size: 1rem;
        color: #bbbbbb;
        max-width: 90%;
        margin: 0 auto;
      }
      .box {
        background: #1e1e1e;
        padding: 30px 20px;
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
        max-width: 90%;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <h3>❌ Login Denied</h3>
      <p>Your login request has been denied. Please try again later.</p>
    </div>
  </body>
</html>
`);
};

const checkLoginStatus = async (req, res) => {
  const {token} = req.query;
  if (!token) return res.status(400).send({status: 'error', message: 'Token required'});

  try {
    const requests = await runQuery(
      `SELECT status, user_id FROM login_requests WHERE token = ?`,
      [token],
    );
    if (requests.length === 0) return res.status(404).send({status: 'invalid'});

    const {status, user_id} = requests[0];
    return res.status(200).send({status, user_id});
  } catch (e) {
    console.error(e);
    return res.status(500).send({status: 'error', message: 'Server error'});
  }
};

const finalizeLogin = async (req, res) => {
  const {token} = req.body;
  if (!token) return res.status(400).send({message: 'Token required'});

  try {
    const requests = await runQuery(`SELECT * FROM login_requests WHERE token = ?`, [
      token,
    ]);
    if (requests.length === 0) return res.status(404).send({message: 'Invalid token'});

    const reqRecord = requests[0];
    if (reqRecord.status !== 'approved')
      return res.status(403).send({message: 'Login not approved'});

    // Fetch user info
    const users = await runQuery('SELECT * FROM user_cred WHERE id = ?', [
      reqRecord.user_id,
    ]);
    if (users.length === 0) return res.status(404).send({message: 'User not found'});

    const user = users[0];
    const isAdmin = user.role === '3'; // role 3 is admin
    const user_roles = await runQuery(
      ` SELECT 
              up.id,
              up.permission
              FROM user_permission up
              INNER JOIN role_permission rp 
                ON up.id = rp.permission_id
              WHERE rp.role_id = ?;
            `,
      [user.role],
    );
    const jwtToken = jwt.sign(
      {id: user.id, username: user.username, role: user.role},
      'secretKey123',
      {expiresIn: '1h'},
    );

    // delete or expire the login request
    await runQuery(`DELETE FROM login_requests WHERE token = ?`, [token]);

    res.cookie('token', jwtToken, {httpOnly: true, secure: false, sameSite: 'lax'});
    return res.status(200).send({
      message: 'Login successful',
      role: user.role,
      permission: user_roles,
      isAdmin: isAdmin,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({message: 'Server error'});
  }
};

const register = async (req, res) => {
  const {email, username, password, phone, address, captcha} = req.body;
  // const verifyCaptcha = await axios.post(
  //   'https://www.google.com/recaptcha/api/siteverify',
  //   {
  //     secret: process.env.CAPTCHA_SECRET_KEY,
  //     response: captcha,
  //   },
  // );
  // if (verifyCaptcha.data.success) {
  try {
    const result = await runQuery('SELECT * FROM user_cred WHERE username=?', [username]);
    if (result.length > 0) {
      return res.status(400).send({message: 'User already exists'});
    } else {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await runQuery(
        'INSERT INTO user_cred (email, username, password, phone, address, 2fa, password_changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, username, hashedPassword, phone, address, 0, timestamp],
      );
      await runQuery('INSERT INTO password_history VALUES (?, ?)', [
        result.insertId,
        hashedPassword,
      ]);
      console.log('User created successfully');
      return res.status(200).send({message: 'User created successfully'});
    }
  } catch (e) {
    if (e.code == 'ER_DUP_ENTRY') {
      return res.status(400).send({message: 'Duplicate Email Entry'});
    }
    console.log(e);
  }
  // else {
  //   return res.status(400).send({message: 'Captcha verification failed'});
  // }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).send({message: 'Logout successful'});
};

let user_otp = {};

const verifyEmail = async (req, res) => {
  const {email} = req.body;
  try {
    const user = await runQuery('SELECT * FROM user_cred WHERE email=?', [email]);

    if (user.length > 0) {
      const otp = generateOTP(6);
      user_otp[email] = {id: user[0].id, otp: otp, expiry: Date.now() + 60 * 1000};
      await sendMail(email, 'Test OTP', otp);
      return res
        .status(200)
        .send({message: 'If the email exists, an OTP has been sent.'});
    } else {
      return res
        .status(200)
        .send({message: 'If the email exists, an OTP has been sent.'});
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Internal Server Error'});
  }
};

const verifyOTP = async (req, res) => {
  const {otp, email} = req.body;
  console.log(user_otp[email]);
  if (!user_otp[email] || user_otp[email].expiry < Date.now()) {
    return res.status(400).send({message: 'OTP expired or invalid'});
  }
  try {
    if (user_otp[email]?.otp == otp) {
      user_otp[email].verified = true;
      return res.status(200).send({message: 'OTP verified Succesfully'});
    } else {
      return res.status(400).send({message: 'OTP expired or invalid'});
    }
  } catch (e) {
    console.log('otp error', e);
    return res.status(400).send({message: 'Internal Server Error'});
  }
};

const changePassword = async (req, res) => {
  const {email, newPassword} = req.body;

  if (!user_otp[email]?.verified)
    return res.status(400).send({message: 'OTP verification error !'});
  try {
    const isRepeated = await isPasswordRepeated(user_otp[email].id, newPassword);
    if (isRepeated) {
      return res.status(400).send({
        message: 'New password cannot be the same as any of the previous passwords.',
      });
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const hashPassword = await bcrypt.hash(newPassword, 10);
    const result = await runQuery(
      'UPDATE user_cred SET password=?, password_changed_at=? WHERE email=?',
      [hashPassword, timestamp, email],
    );
    if (result) {
      await runQuery('INSERT INTO password_history VALUES (?, ?)', [
        user_otp[email].id,
        hashPassword,
      ]);
      return res.status(200).send({message: 'Password saved successfully!'});
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({message: 'Something went wrong!'});
  }
};

const updatePasswordWithOld = async (req, res) => {
  const {oldPassword, newPassword} = req.body;

  try {
    const runQueryResult = await runQuery(
      `SELECT (password) FROM user_cred WHERE id = ?`,
      [req.user.id],
    );
    if (runQueryResult.length === 0) {
      return res.status(404).send({message: 'User not found'});
    }
    const user = runQueryResult[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(410).send({message: 'Old password is incorrect'});
    }
    const isRepeated = await isPasswordRepeated(req.user.id, newPassword);
    if (isRepeated) {
      return res.status(400).send({
        message: 'New password cannot be the same as any of the previous passwords.',
      });
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await runQuery(
      `UPDATE user_cred SET password = ?, password_changed_at = ? WHERE id = ?`,
      [hashedNewPassword, timestamp, req.user.id],
    );
    await runQuery('INSERT INTO password_history VALUES (?, ?)', [
      req.user.id,
      hashedNewPassword,
    ]);
    return res.status(200).send({message: 'Password updated successfully!'});
  } catch (error) {
    console.log(error);
    return res.status(400).send({message: 'Something went wrong!'});
  }
};

module.exports = {
  login,
  approve,
  deny,
  checkLoginStatus,
  finalizeLogin,
  register,
  logout,
  verifyEmail,
  verifyOTP,
  changePassword,
  updatePasswordWithOld,
};
