const roomService = require('../services/roomService');

const roomController = {
    async getAll(req, res, next) {
        try {
            const rooms = await roomService.getAll();
            res.json({ success: true, data: rooms });
        } catch (err) {
            next(err);
        }
    },

    async getById(req, res, next) {
        try {
            const room = await roomService.getById(req.params.id);
            res.json({ success: true, data: room });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const room = await roomService.create(req.body, req.user.id, req.ip);
            res.status(201).json({ success: true, data: room });
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {
        try {
            const room = await roomService.update(req.params.id, req.body, req.user.id, req.ip);
            res.json({ success: true, data: room });
        } catch (err) {
            next(err);
        }
    },

    async updatePrice(req, res, next) {
        try {
            const room = await roomService.updatePrice(req.params.id, req.body.price_per_night, req.user.id, req.ip);
            res.json({ success: true, data: room });
        } catch (err) {
            next(err);
        }
    },

    async markCleaned(req, res, next) {
        try {
            const room = await roomService.markCleaned(req.params.id, req.body.cleaned_by, req.user.id, req.ip);
            res.json({ success: true, data: room, message: 'บันทึกการทำความสะอาดเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            await roomService.delete(req.params.id, req.user.id, req.ip);
            res.json({ success: true, message: 'ลบห้องพักเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = roomController;
