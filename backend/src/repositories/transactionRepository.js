const { query } = require('../config/database');

const transactionRepository = {
    async findAll({ page = 1, limit = 20, type, status } = {}) {
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (type) {
            conditions.push(`t.type = $${paramIndex++}`);
            params.push(type);
        }
        if (status) {
            conditions.push(`t.status = $${paramIndex++}`);
            params.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
      SELECT t.*, u.display_name AS created_by_name,
        v.display_name AS verified_by_name,
        b.guest_name AS booking_guest_name
      FROM transactions t
      JOIN users u ON t.created_by = u.id
      LEFT JOIN users v ON t.verified_by = v.id
      LEFT JOIN bookings b ON t.booking_id = b.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await query(sql, params);

        // Count
        const countSql = `SELECT COUNT(*) FROM transactions t ${whereClause}`;
        const countResult = await query(countSql, params.slice(0, -2));

        return {
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
        };
    },

    async findByBookingId(bookingId) {
        const result = await query(
            `SELECT t.*, u.display_name AS created_by_name,
                v.display_name AS verified_by_name
             FROM transactions t
             JOIN users u ON t.created_by = u.id
             LEFT JOIN users v ON t.verified_by = v.id
             WHERE t.booking_id = $1 AND t.is_voided = false
             ORDER BY t.created_at DESC`,
            [bookingId]
        );
        return result.rows;
    },

    async findById(id) {
        const result = await query(
            `SELECT t.*, u.display_name AS created_by_name,
        v.display_name AS verified_by_name
       FROM transactions t
       JOIN users u ON t.created_by = u.id
       LEFT JOIN users v ON t.verified_by = v.id
       WHERE t.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    async create({ booking_id, type, category, amount, description, attachment_url, created_by }) {
        const result = await query(
            `INSERT INTO transactions (booking_id, type, category, amount, description, attachment_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [booking_id, type, category, amount, description, attachment_url, created_by]
        );
        return result.rows[0];
    },

    async verify(id, verifiedBy) {
        const result = await query(
            `UPDATE transactions SET status = 'verified', verified_by = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
            [verifiedBy, id]
        );
        return result.rows[0] || null;
    },

    async void(id) {
        const result = await query(
            `UPDATE transactions SET status = 'voided', is_voided = true, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0] || null;
    },

    async findByMonth(year, month) {
        const result = await query(
            `SELECT t.*, u.display_name AS created_by_name,
                v.display_name AS verified_by_name,
                b.guest_name AS booking_guest_name, b.room_id,
                r.room_number
             FROM transactions t
             JOIN users u ON t.created_by = u.id
             LEFT JOIN users v ON t.verified_by = v.id
             LEFT JOIN bookings b ON t.booking_id = b.id
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE EXTRACT(YEAR FROM t.created_at) = $1 AND EXTRACT(MONTH FROM t.created_at) = $2
               AND t.is_voided = false
             ORDER BY t.created_at`,
            [year, month]
        );
        return result.rows;
    },

    async getDailySummary(date) {
        const result = await query(
            `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COUNT(*) AS transaction_count
       FROM transactions
       WHERE DATE(created_at) = $1 AND status = 'verified' AND is_voided = false`,
            [date]
        );
        return result.rows[0];
    },

    async getPendingCount(date) {
        const result = await query(
            `SELECT COUNT(*) AS count FROM transactions
       WHERE DATE(created_at) = $1 AND status = 'pending' AND is_voided = false`,
            [date]
        );
        return result.rows[0]?.count || 0;
    },

    async getDailyCategoryBreakdown(date) {
        const result = await query(
            `SELECT type, category,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(*) AS count
       FROM transactions
       WHERE DATE(created_at) = $1 AND status = 'verified' AND is_voided = false
       GROUP BY type, category
       ORDER BY type, total DESC`,
            [date]
        );
        return result.rows;
    },

    async getMonthlySummary(year, month) {
        const result = await query(
            `SELECT
        DATE(created_at) AS date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2
         AND status = 'verified' AND is_voided = false
       GROUP BY DATE(created_at)
       ORDER BY date`,
            [year, month]
        );
        return result.rows;
    },

    async getMonthlyCategoryBreakdown(year, month) {
        const result = await query(
            `SELECT type, category,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(*) AS count
       FROM transactions
       WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2
         AND status = 'verified' AND is_voided = false
       GROUP BY type, category
       ORDER BY type, total DESC`,
            [year, month]
        );
        return result.rows;
    },
};

module.exports = transactionRepository;
