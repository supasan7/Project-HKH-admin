const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const auditService = require('./auditService');
const AppError = require('../utils/AppError');

const authService = {
    async login(username, password, ipAddress) {
        const user = await userRepository.findByUsername(username);
        if (!user) {
            throw new AppError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new AppError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
            env.jwt.secret,
            { expiresIn: env.jwt.expiresIn }
        );

        // Audit log
        await auditService.log({
            user_id: user.id,
            action: 'LOGIN',
            entity_type: 'user',
            entity_id: user.id,
            ip_address: ipAddress,
        });

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.display_name,
                role: user.role,
            },
        };
    },

    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError('ไม่พบผู้ใช้งาน', 404);
        }
        return user;
    },
};

module.exports = authService;
