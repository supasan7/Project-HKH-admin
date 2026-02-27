const bookingRepository = require('../repositories/bookingRepository');
const roomRepository = require('../repositories/roomRepository');
const transactionRepository = require('../repositories/transactionRepository');
const auditService = require('./auditService');
const lineNotifyService = require('./lineNotifyService');
const { calculateNights } = require('../utils/helpers');
const AppError = require('../utils/AppError');

const bookingService = {
    async getAll(filters) {
        return bookingRepository.findAll(filters);
    },

    async getById(id) {
        const booking = await bookingRepository.findById(id);
        if (!booking) throw new AppError('ไม่พบข้อมูลการจอง', 404);

        // Include related transactions
        const transactions = await transactionRepository.findByBookingId(id);
        const nights = calculateNights(booking.check_in_date, booking.check_out_date);

        return { ...booking, transactions, nights };
    },

    async create(data, userId, ipAddress) {
        // Validate room exists
        const room = await roomRepository.findById(data.room_id);
        if (!room) throw new AppError('ไม่พบห้องพัก', 404);
        if (!room.is_active) throw new AppError('ห้องพักนี้ไม่พร้อมใช้งาน', 400);

        // Check room availability (overlap detection)
        const overlapping = await bookingRepository.findByRoomAndDates(
            data.room_id, data.check_in_date, data.check_out_date
        );
        if (overlapping.length > 0) {
            throw new AppError('ห้องพักนี้ไม่ว่างในช่วงวันที่เลือก', 409);
        }

        // Auto-calculate total amount
        const nights = calculateNights(data.check_in_date, data.check_out_date);
        const totalAmount = data.total_amount || (nights * parseFloat(room.price_per_night));

        const booking = await bookingRepository.create({
            ...data,
            total_amount: totalAmount,
            created_by: userId,
        });

        // Update room status
        await roomRepository.updateStatus(data.room_id, 'booked');

        // Audit log
        await auditService.log({
            user_id: userId,
            action: 'CREATE_BOOKING',
            entity_type: 'booking',
            entity_id: booking.id,
            new_value: booking,
            ip_address: ipAddress,
        });

        // Line Notify
        lineNotifyService.sendBookingNotification(booking, room);

        return { ...booking, room_number: room.room_number, nights };
    },

    async cancel(id, userId, ipAddress) {
        const booking = await bookingRepository.findById(id);
        if (!booking) throw new AppError('ไม่พบข้อมูลการจอง', 404);
        if (booking.is_cancelled) throw new AppError('การจองนี้ถูกยกเลิกแล้ว', 400);

        const cancelled = await bookingRepository.cancel(id);

        // Restore room status
        await roomRepository.updateStatus(booking.room_id, 'available');

        // Audit log
        await auditService.log({
            user_id: userId,
            action: 'CANCEL_BOOKING',
            entity_type: 'booking',
            entity_id: id,
            old_value: { is_cancelled: false },
            new_value: { is_cancelled: true },
            ip_address: ipAddress,
        });

        // LINE Notify — cancellation
        lineNotifyService.sendCancelNotification(booking);

        return cancelled;
    },

    async getCalendar(startDate, endDate) {
        return bookingRepository.getCalendarData(startDate, endDate);
    },

    async checkIn(id, userId, ipAddress) {
        const booking = await bookingRepository.findById(id);
        if (!booking) throw new AppError('ไม่พบข้อมูลการจอง', 404);
        if (booking.is_cancelled) throw new AppError('การจองนี้ถูกยกเลิกแล้ว', 400);
        if (booking.checked_in_at) throw new AppError('เช็คอินแล้ว', 400);

        const room = await roomRepository.findById(booking.room_id);
        if (room.status !== 'booked') throw new AppError('สถานะห้องไม่ถูกต้อง ห้องต้องอยู่ในสถานะ "มีการจอง"', 400);

        const updated = await bookingRepository.checkIn(id);
        await roomRepository.updateStatus(booking.room_id, 'checked_in');

        await auditService.log({
            user_id: userId,
            action: 'CHECK_IN',
            entity_type: 'booking',
            entity_id: id,
            new_value: { checked_in_at: updated.checked_in_at, room_id: booking.room_id },
            ip_address: ipAddress,
        });

        // LINE Notify
        lineNotifyService.sendCheckInNotification(booking);

        return updated;
    },

    async checkOut(id, userId, ipAddress) {
        const booking = await bookingRepository.findById(id);
        if (!booking) throw new AppError('ไม่พบข้อมูลการจอง', 404);
        if (!booking.checked_in_at) throw new AppError('ยังไม่ได้เช็คอิน', 400);
        if (booking.checked_out_at) throw new AppError('เช็คเอาท์แล้ว', 400);

        const room = await roomRepository.findById(booking.room_id);
        if (room.status !== 'checked_in') throw new AppError('สถานะห้องไม่ถูกต้อง ห้องต้องอยู่ในสถานะ "เช็คอินแล้ว"', 400);

        const updated = await bookingRepository.checkOut(id);
        await roomRepository.updateStatus(booking.room_id, 'cleaning');

        await auditService.log({
            user_id: userId,
            action: 'CHECK_OUT',
            entity_type: 'booking',
            entity_id: id,
            new_value: { checked_out_at: updated.checked_out_at, room_id: booking.room_id },
            ip_address: ipAddress,
        });

        // LINE Notify
        lineNotifyService.sendCheckOutNotification(booking);

        return updated;
    },
};

module.exports = bookingService;
