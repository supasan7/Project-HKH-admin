const bookingService = require('../services/bookingService');

const bookingController = {
    async getAll(req, res, next) {
        try {
            const { page, limit, status } = req.query;
            const result = await bookingService.getAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, status });
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    },

    async getById(req, res, next) {
        try {
            const booking = await bookingService.getById(req.params.id);
            res.json({ success: true, data: booking });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const booking = await bookingService.create(req.body, req.user.id, req.ip);
            res.status(201).json({ success: true, data: booking });
        } catch (err) {
            next(err);
        }
    },

    async cancel(req, res, next) {
        try {
            const booking = await bookingService.cancel(req.params.id, req.user.id, req.ip);
            res.json({ success: true, data: booking, message: 'ยกเลิกการจองเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    async getCalendar(req, res, next) {
        try {
            const { start, end } = req.query;
            const data = await bookingService.getCalendar(start, end);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },

    async checkIn(req, res, next) {
        try {
            const booking = await bookingService.checkIn(req.params.id, req.user.id, req.ip);
            res.json({ success: true, data: booking, message: 'เช็คอินเรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    async checkOut(req, res, next) {
        try {
            const booking = await bookingService.checkOut(req.params.id, req.user.id, req.ip);
            res.json({ success: true, data: booking, message: 'เช็คเอาท์เรียบร้อย' });
        } catch (err) {
            next(err);
        }
    },

    async getBookedDates(req, res, next) {
        try {
            const bookingRepository = require('../repositories/bookingRepository');
            const data = await bookingRepository.getBookedDatesByRoom(req.params.roomId);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = bookingController;
