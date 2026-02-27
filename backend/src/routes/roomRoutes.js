const { Router } = require('express');
const Joi = require('joi');
const roomController = require('../controllers/roomController');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

const roomSchema = {
    body: Joi.object({
        room_number: Joi.string().max(20).required(),
        room_type: Joi.string().max(50).required(),
        price_per_night: Joi.number().min(0).required(),
        description: Joi.string().allow('', null),
        max_guests: Joi.number().integer().min(1).default(2),
    }),
};

const priceSchema = {
    body: Joi.object({
        price_per_night: Joi.number().min(0).required(),
    }),
};

const cleanSchema = {
    body: Joi.object({
        cleaned_by: Joi.string().max(100).required(),
    }),
};

router.get('/', roomController.getAll);
router.get('/:id', roomController.getById);
router.post('/', authorize('owner'), validate(roomSchema), roomController.create);
router.put('/:id', authorize('owner'), validate(roomSchema), roomController.update);
router.patch('/:id/price', authorize('owner', 'admin'), validate(priceSchema), roomController.updatePrice);
router.patch('/:id/clean', authorize('owner', 'admin'), validate(cleanSchema), roomController.markCleaned);
router.delete('/:id', authorize('owner'), roomController.delete);

module.exports = router;
