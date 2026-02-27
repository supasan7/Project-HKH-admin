const reportService = require('../services/reportService');
const auditService = require('../services/auditService');

const reportController = {
    async getDailySummary(req, res, next) {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const summary = await reportService.getDailySummary(date);
            res.json({ success: true, data: summary });
        } catch (err) {
            next(err);
        }
    },

    async getMonthlySummary(req, res, next) {
        try {
            const now = new Date();
            const year = parseInt(req.query.year) || now.getFullYear();
            const month = parseInt(req.query.month) || now.getMonth() + 1;
            const summary = await reportService.getMonthlySummary(year, month);
            res.json({ success: true, data: summary });
        } catch (err) {
            next(err);
        }
    },

    async getAuditLogs(req, res, next) {
        try {
            const { page, limit, entity_type, user_id } = req.query;
            const result = await auditService.getAll({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 50,
                entity_type,
                user_id,
            });
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    },

    async getMonthlyPdfData(req, res, next) {
        try {
            const now = new Date();
            const year = parseInt(req.query.year) || now.getFullYear();
            const month = parseInt(req.query.month) || now.getMonth() + 1;
            const data = await reportService.getMonthlyPdfData(year, month);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = reportController;
