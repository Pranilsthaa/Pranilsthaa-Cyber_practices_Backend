const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { runQuery } = require("./connection");

app.use(
  cors({
    origin: "*",
  })
);

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await runQuery("SELECT * FROM user_cred WHERE username=?", [
      username,
    ]);

    if (result.length > 0) {
      if (result[0]?.role === "terminated") {
        return res
          .status(401)
          .send({ message: "Account Terminated ! Contact SuperAdmin" });
      }
      const user = result[0];
      const hashPassword = user.password.toString();
      // Compare the provided password with the hashed password
      bcrypt.compare(password, hashPassword).then(function (result) {
        if (result) {
          // Generate a JWT token
          const token = jwt.sign(
            { id: user.id, username: user.name, role: user.role },
            "secretKey123",
            { expiresIn: "1h" }
          );
          return res.status(200).send({
            token: token,
            message: "Login successful",
            role: user.role,
          });
        }
      });
    } else {
      const adminUsername = process.env.admin_username;
      const adminPassword = process.env.admin_password;
      const adminToken = process.env.admin_token;
      if (username === adminUsername && password === adminPassword) {
        res.status(200).json({
          message: "Login successful",
          token: adminToken,
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  } catch (e) {
    console.log(e);
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening on port ${port}`);
});
