const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Middleware: Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('กรุณาเข้าสู่ระบบ (No token provided)', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.jwt.secret);
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof AppError) {
            return next(err);
        }
        next(new AppError('Token ไม่ถูกต้องหรือหมดอายุ', 401));
    }
};

/**
 * Middleware: Check if user has required role(s)
 * Usage: authorize('owner') or authorize('owner', 'admin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('กรุณาเข้าสู่ระบบก่อน', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403));
        }
        next();
    };
};

module.exports = { authenticate, authorize };
