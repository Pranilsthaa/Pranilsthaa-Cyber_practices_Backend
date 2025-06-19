const {verifyManager} = require('../controller/managerController');

const managerRoute = require('express').Router();

managerRoute.post('/verify', verifyManager);

module.exports = {managerRoute};
