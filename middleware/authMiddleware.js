const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  jwt.verify(token, "secretKey123", (err, user) => {
    if (err) {
      console.log("error");
      return res.status(403).send({ message: "Forbidden" });
    }
    req.user = user; // Attach user info to request
    next(); // Proceed to the next middleware or route handler
  });
}

function authenticateAdmin(req, res, next) {
  if (req.user.role !== "3") {
    return res.status(403).send({ message: "Forbidden" });
  }
  next(); // Proceed to the next middleware or route handler
}

module.exports = { authenticate, authenticateAdmin };
