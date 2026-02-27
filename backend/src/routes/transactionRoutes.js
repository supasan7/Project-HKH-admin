const { Router } = require('express');
const Joi = require('joi');
const transactionController = require('../controllers/transactionController');
const { authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = Router();

const voidReasonSchema = {
    body: Joi.object({
        reason: Joi.string().min(1).required().messages({ 'any.required': 'กรุณาระบุเหตุผล' }),
    }),
};

// Transaction CRUD
router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.post('/', authorize('owner', 'admin'), upload.single('attachment'), transactionController.create);
router.patch('/:id/verify', authorize('owner'), transactionController.verify);

// Void request (admin can request, owner approves)
router.post('/:id/void', authorize('owner', 'admin'), validate(voidReasonSchema), transactionController.requestVoid);

// Adjustment requests
router.get('/adjustments/list', transactionController.getAdjustmentRequests);
router.patch('/adjustments/:id/approve', authorize('owner'), transactionController.approveAdjustment);
router.patch('/adjustments/:id/reject', authorize('owner'), transactionController.rejectAdjustment);

module.exports = router;
