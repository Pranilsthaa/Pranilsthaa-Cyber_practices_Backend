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

function authenticateAdmin(req, res, next) {
  const adminToken = process.env.admin_token;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).send({ message: "Unauthorized" });

  if (token !== adminToken) {
    return res.status(403).send({ message: "Forbidden" });
  }
  next();

  // jwt.verify(token, "secretKey123", (err, user) => {
  //   if (err) return res.sendStatus(403);
  //   req.user = user;
  //   next();
  // });
}

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
          role: "admin",
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  } catch (e) {
    console.log(e);
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await runQuery("SELECT * FROM user_cred WHERE username=?", [
      username,
    ]);
    if (result.length > 0) {
      return res.status(400).send({ message: "User already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await runQuery(
        "INSERT INTO user_cred (username, password) VALUES (?, ?)",
        [username, hashedPassword]
      );
      return res.status(200).send({ message: "User created successfully" });
    }
  } catch (e) {
    console.log(e);
  }
});

app.get("/users", authenticateAdmin, async (req, res) => {
  try {
    const result = await runQuery("SELECT id, username, role FROM user_cred");
    return res.status(200).send(result);
  } catch (e) {
    console.log(e);
  }
});

app.get("/roles", authenticateAdmin, async (req, res) => {
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
});

app.post("/update-permissions", authenticateAdmin, async (req, res) => {
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
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening on port ${port}`);
});
