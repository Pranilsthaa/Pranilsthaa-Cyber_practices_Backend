const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const port = 5000;

const {
  authenticate,
  authenticateAdmin,
} = require("./middleware/authMiddleware");

require("dotenv").config();

const authRouter = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");

app.use(
  cors({
    origin: "http://192.168.1.17:3000",
    credentials: true, // Allow credentials cookies, authorization headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", authRouter);
app.use("/admin", authenticate, authenticateAdmin, adminRoute);

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening on port ${port}`);
});
