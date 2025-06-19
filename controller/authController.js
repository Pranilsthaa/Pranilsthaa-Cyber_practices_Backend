const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {runQuery} = require('../connection');
const {default: axios} = require('axios');
const {generateOTP} = require('../helper/generateOTP');
const {sendMail} = require('../helper/mailService');

const failureCount = {};

const login = async (req, res) => {
  const {username, password, captcha} = req.body;
  if (failureCount[req.ip] >= 3) {
    const params = new URLSearchParams();
    params.append('secret', '6LebM1orAAAAAIdd2q44zjIe8F78ymp4K4m_xo1m');
    params.append('response', captcha);
    params.append('remoteip', req.ip);
    // Verify the captcha
    const verifyCaptcha = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params,
    );
    console.log(verifyCaptcha.data);
    if (!verifyCaptcha.data.success) {
      res.status(400).send({message: 'Invalid Captcha'});
      return;
    }
  }
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

const register = async (req, res) => {
  const {email, username, password, captcha} = req.body;
  // const verifyCaptcha = await axios.post(
  //   'https://www.google.com/recaptcha/api/siteverify',
  //   {
  //     secret: '6LebM1orAAAAAIdd2q44zjIe8F78ymp4K4m_xo1m',
  //     response: captcha,
  //   },
  // );
  // if (verifyCaptcha.data.success) {
  try {
    const result = await runQuery('SELECT * FROM user_cred WHERE username=?', [username]);
    if (result.length > 0) {
      return res.status(400).send({message: 'User already exists'});
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await runQuery(
        'INSERT INTO user_cred (email, username, password) VALUES (?, ?, ?)',
        [email, username, hashedPassword],
      );
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
      user_otp[email] = {otp: otp, expiry: Date.now() + 60 * 1000};
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
    const encryptPassword = await bcrypt.hash(newPassword, 10);
    const result = await runQuery('UPDATE user_cred SET password=? WHERE email=?', [
      encryptPassword,
      email,
    ]);
    if (result) {
      return res.status(200).send({message: 'Password saved successfully!'});
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({message: 'Something went wrong!'});
  }
};

module.exports = {login, register, logout, verifyEmail, verifyOTP, changePassword};
