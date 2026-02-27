const env = require('../config/env');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'เกิดข้อผิดพลาดภายในระบบ';
    let details = err.details || null;

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)';
    }

    // PostgreSQL unique violation
    if (err.code === '23505') {
        statusCode = 409;
        message = 'ข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง';
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        statusCode = 400;
        message = 'ข้อมูลอ้างอิงไม่ถูกต้อง';
    }

    // Log error in development
    if (env.nodeEnv === 'development') {
        console.error('❌ Error:', {
            statusCode,
            message,
            stack: err.stack,
        });
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(details && { details }),
        ...(env.nodeEnv === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
