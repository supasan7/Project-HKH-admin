const { Router } = require('express');
const reportController = require('../controllers/reportController');
const { authorize } = require('../middleware/auth');

const router = Router();

router.get('/daily', reportController.getDailySummary);
router.get('/monthly', reportController.getMonthlySummary);
router.get('/monthly-pdf', authorize('owner'), reportController.getMonthlyPdfData);
router.get('/audit-logs', authorize('owner'), reportController.getAuditLogs);

module.exports = router;
