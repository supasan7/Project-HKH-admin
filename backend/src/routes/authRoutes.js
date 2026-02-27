const { Router } = require('express');
const Joi = require('joi');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');

const router = Router();

const loginSchema = {
    body: Joi.object({
        username: Joi.string().required().messages({ 'any.required': 'กรุณากรอกชื่อผู้ใช้' }),
        password: Joi.string().required().messages({ 'any.required': 'กรุณากรอกรหัสผ่าน' }),
    }),
};

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authController.getProfile); // auth middleware applied in index.js

module.exports = router;
