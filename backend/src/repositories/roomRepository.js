const { query } = require('../config/database');

const roomRepository = {
    async findAll() {
        const result = await query(
            'SELECT * FROM rooms WHERE is_active = true ORDER BY room_number ASC'
        );
        return result.rows;
    },

    async findById(id) {
        const result = await query('SELECT * FROM rooms WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async findByRoomNumber(roomNumber) {
        const result = await query('SELECT * FROM rooms WHERE room_number = $1', [roomNumber]);
        return result.rows[0] || null;
    },

    async create({ room_number, room_type, price_per_night, description, max_guests }) {
        const result = await query(
            `INSERT INTO rooms (room_number, room_type, price_per_night, description, max_guests)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [room_number, room_type, price_per_night, description, max_guests]
        );
        return result.rows[0];
    },

    async update(id, { room_number, room_type, price_per_night, description, max_guests, status }) {
        const result = await query(
            `UPDATE rooms SET room_number = COALESCE($1, room_number),
        room_type = COALESCE($2, room_type),
        price_per_night = COALESCE($3, price_per_night),
        description = COALESCE($4, description),
        max_guests = COALESCE($5, max_guests),
        status = COALESCE($6, status),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
            [room_number, room_type, price_per_night, description, max_guests, status, id]
        );
        return result.rows[0] || null;
    },

    async updatePrice(id, price) {
        const result = await query(
            'UPDATE rooms SET price_per_night = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [price, id]
        );
        return result.rows[0] || null;
    },

    async updateStatus(id, status) {
        const result = await query(
            'UPDATE rooms SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0] || null;
    },

    async markCleaned(id, cleanedBy) {
        const result = await query(
            `UPDATE rooms SET status = 'available', cleaned_by = $1, cleaned_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
            [cleanedBy, id]
        );
        return result.rows[0] || null;
    },

    async softDelete(id) {
        const result = await query(
            'UPDATE rooms SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    },
};

module.exports = roomRepository;
