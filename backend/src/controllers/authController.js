const authService = require('../services/authService');

const authController = {
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const ipAddress = req.ip;
            const result = await authService.login(username, password, ipAddress);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    async getProfile(req, res, next) {
        try {
            const user = await authService.getProfile(req.user.id);
            res.json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = authController;
