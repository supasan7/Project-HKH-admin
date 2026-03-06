const { query } = require('../config/database');

const bookingRepository = {
    async findAll({ page = 1, limit = 20, status } = {}) {
        const offset = (page - 1) * limit;
        let sql = `
      SELECT b.*, r.room_number, r.room_type, u.display_name AS created_by_name,
        EXISTS (
          SELECT 1 FROM transactions t
          WHERE t.booking_id = b.id AND t.type = 'income' AND t.status = 'verified' AND t.attachment_url IS NOT NULL
        ) AS has_payment
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN users u ON b.created_by = u.id
    `;
        const params = [];

        if (status === 'active') {
            sql += ' WHERE b.is_cancelled = false';
        } else if (status === 'cancelled') {
            sql += ' WHERE b.is_cancelled = true';
        }

        sql += ' ORDER BY b.created_at DESC LIMIT $1 OFFSET $2';
        params.push(limit, offset);

        const result = await query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) FROM bookings';
        if (status === 'active') countSql += ' WHERE is_cancelled = false';
        else if (status === 'cancelled') countSql += ' WHERE is_cancelled = true';
        const countResult = await query(countSql);

        return {
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
        };
    },

    async findById(id) {
        const result = await query(
            `SELECT b.*, r.room_number, r.room_type, r.price_per_night,
        u.display_name AS created_by_name
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN users u ON b.created_by = u.id
       WHERE b.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    async findByRoomAndDates(roomId, checkInDate, checkOutDate, excludeId = null) {
        let sql = `
      SELECT * FROM bookings
      WHERE room_id = $1
        AND is_cancelled = false
        AND check_in_date < $3
        AND check_out_date > $2
    `;
        const params = [roomId, checkInDate, checkOutDate];

        if (excludeId) {
            sql += ' AND id != $4';
            params.push(excludeId);
        }

        const result = await query(sql, params);
        return result.rows;
    },

    async create({ room_id, guest_name, guest_phone, check_in_date, check_out_date, num_guests, total_amount, notes, created_by }) {
        const result = await query(
            `INSERT INTO bookings (room_id, guest_name, guest_phone, check_in_date, check_out_date, num_guests, total_amount, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [room_id, guest_name, guest_phone, check_in_date, check_out_date, num_guests, total_amount, notes, created_by]
        );
        return result.rows[0];
    },

    async cancel(id) {
        const result = await query(
            'UPDATE bookings SET is_cancelled = true, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    },

    async findByMonth(year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        const result = await query(
            `SELECT b.*, r.room_number, r.room_type, r.price_per_night,
                u.display_name AS created_by_name
             FROM bookings b
             JOIN rooms r ON b.room_id = r.id
             JOIN users u ON b.created_by = u.id
             WHERE b.check_in_date >= $1 AND b.check_in_date <= $2
             ORDER BY b.check_in_date`,
            [startDate, endDate]
        );
        return result.rows;
    },

    async getBookedDatesByRoom(roomId) {
        const result = await query(
            `SELECT check_in_date, check_out_date FROM bookings
             WHERE room_id = $1 AND is_cancelled = false
             ORDER BY check_in_date`,
            [roomId]
        );
        return result.rows;
    },

    async getCalendarData(startDate, endDate) {
        const result = await query(
            `SELECT b.id, b.room_id, b.guest_name, b.guest_phone, b.check_in_date, b.check_out_date, b.is_cancelled,
        r.room_number, r.room_type, r.status AS room_status
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.is_cancelled = false
         AND b.check_in_date <= $2
         AND b.check_out_date >= $1
       ORDER BY r.room_number, b.check_in_date`,
            [startDate, endDate]
        );
        return result.rows;
    },

    async checkIn(id) {
        const result = await query(
            'UPDATE bookings SET checked_in_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    },

    async checkOut(id) {
        const result = await query(
            'UPDATE bookings SET checked_out_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    },
};

module.exports = bookingRepository;
