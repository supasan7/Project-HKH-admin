const { Router } = require('express');
const Joi = require('joi');
const bookingController = require('../controllers/bookingController');
const { authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

const bookingSchema = {
    body: Joi.object({
        room_id: Joi.string().uuid().required(),
        guest_name: Joi.string().max(100).required(),
        guest_phone: Joi.string().max(20).allow('', null),
        check_in_date: Joi.date().required(),
        check_out_date: Joi.date().greater(Joi.ref('check_in_date')).required(),
        num_guests: Joi.number().integer().min(1).default(1),
        total_amount: Joi.number().min(0).allow(null),
        notes: Joi.string().allow('', null),
    }),
};

router.get('/', bookingController.getAll);
router.get('/calendar', bookingController.getCalendar);
router.get('/booked-dates/:roomId', bookingController.getBookedDates);
router.get('/:id', bookingController.getById);
router.post('/', authorize('owner', 'admin'), validate(bookingSchema), bookingController.create);
router.patch('/:id/cancel', authorize('owner', 'admin'), bookingController.cancel);
router.patch('/:id/check-in', authorize('owner', 'admin'), bookingController.checkIn);
router.patch('/:id/check-out', authorize('owner', 'admin'), bookingController.checkOut);

module.exports = router;
