const {
  verifyClient,
  getReports,
  getDashboardData,
  getClientTickets,
} = require('../controller/clientController');
const {authorizePermission} = require('../middleware/authMiddleware');

const clientRouter = require('express').Router();

clientRouter.post('/verify', verifyClient);
clientRouter.get('/reports', authorizePermission(['view:client_reports']), getReports);
clientRouter.get(
  '/dashboard',
  authorizePermission(['view:client_dashboard']),
  getDashboardData,
);
clientRouter.get(
  '/tickets',
  authorizePermission(['view:client_tickets']),
  getClientTickets,
);

module.exports = {clientRouter};
