const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const port = 5000;

const {authenticate, authenticateAdmin} = require('./middleware/authMiddleware');

require('dotenv').config();

const authRouter = require('./routes/authRoute');
const adminRoute = require('./routes/adminRoute');
const userRouter = require('./routes/userRouter');
const {clientRouter} = require('./routes/clientRoute');
const {managerRoute} = require('./routes/managerRoute');

app.use(
  cors({
    origin: 'http://192.168.1.113:3000',
    credentials: true, // Allow credentials cookies, authorization headers
  }),
);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 per 15 minutes
  standardHeaders: 'draft-8',
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    });
  },
});

// Apply the rate limiting middleware to all requests.
// app.use(limiter);

app.use('/', authRouter);
app.use('/admin', authenticate, authenticateAdmin, adminRoute);
app.use('/user', authenticate, userRouter);
app.use('/client', authenticate, clientRouter);
app.use('/manager', authenticate, managerRoute);

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening on port ${port}`);
});
