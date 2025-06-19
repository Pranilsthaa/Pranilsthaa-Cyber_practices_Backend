const {verifyClient} = require('../controller/clientController');

const clientRouter = require('express').Router();

clientRouter.post('/verify', verifyClient);

module.exports = {clientRouter};
