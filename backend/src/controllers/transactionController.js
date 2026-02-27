const transactionService = require('../services/transactionService');

const transactionController = {
    async getAll(req, res, next) {
        try {
            const { page, limit, type, status } = req.query;
            const result = await transactionService.getAll({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                type,
                status,
            });
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    },

    async getById(req, res, next) {
        try {
            const tx = await transactionService.getById(req.params.id);
            res.json({ success: true, data: tx });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const data = {
                ...req.body,
                attachment_url: req.file ? `/uploads/${req.file.filename}` : null,
            };
            const tx = await transactionService.create(data, req.user.id, req.ip);
            res.status(201).json({ success: true, data: tx });
        } catch (err) {
            next(err);
        }
    },

    async verify(req, res, next) {
        try {
            const tx = await transactionService.verify(req.params.id, req.user.id, req.ip);
            res.json({ success: true, data: tx, message: 'ยืนยันรายการเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    // Void request (admin sends, owner approves)
    async requestVoid(req, res, next) {
        try {
            const { reason } = req.body;
            const result = await transactionService.requestVoid(req.params.id, reason, req.user.id, req.ip);
            res.status(201).json({ success: true, data: result, message: 'ส่งคำขอยกเลิกเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    // Adjustment requests list
    async getAdjustmentRequests(req, res, next) {
        try {
            const { page, limit, status } = req.query;
            const result = await transactionService.getAdjustmentRequests({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                status,
            });
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    },

    // Owner approve
    async approveAdjustment(req, res, next) {
        try {
            const result = await transactionService.approveAdjustment(req.params.id, req.user.id, req.user.role, req.ip);
            res.json({ success: true, data: result, message: 'อนุมัติเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    // Owner reject
    async rejectAdjustment(req, res, next) {
        try {
            const result = await transactionService.rejectAdjustment(req.params.id, req.user.id, req.user.role, req.ip);
            res.json({ success: true, data: result, message: 'ปฏิเสธเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = transactionController;
