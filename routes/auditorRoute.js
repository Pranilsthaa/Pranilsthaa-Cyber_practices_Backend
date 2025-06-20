const {
  verifyAuditor,
  getReports,
  getActivityLogs,
  getDashboardData,
} = require('../controller/auditor');
const {authorizePermission} = require('../middleware/authMiddleware');

const auditorRouter = require('express').Router();

auditorRouter.post('/verify', verifyAuditor);
auditorRouter.get(
  '/dashboard',
  authorizePermission(['view:auditor_dashboard']),
  getDashboardData,
);
auditorRouter.get('/reports', authorizePermission(['view:auditor_reports']), getReports);
auditorRouter.get(
  '/activity-logs',
  authorizePermission(['view:auditor_activity_logs']),
  getActivityLogs,
);

module.exports = {auditorRouter};
