const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../', env.upload.dir);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// File filter: allow only images and PDF
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('อนุญาตเฉพาะไฟล์ JPG, PNG, PDF เท่านั้น', 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.upload.maxFileSize,
    },
});

module.exports = upload;
