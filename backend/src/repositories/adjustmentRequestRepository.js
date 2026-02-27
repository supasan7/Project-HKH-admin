const { query } = require('../config/database');

const adjustmentRequestRepository = {
    async create({ transaction_id, request_type, reason, old_data, new_data, requested_by }) {
        const result = await query(
            `INSERT INTO adjustment_requests (transaction_id, request_type, reason, old_data, new_data, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [transaction_id, request_type, reason,
                old_data ? JSON.stringify(old_data) : null,
                new_data ? JSON.stringify(new_data) : null,
                requested_by]
        );
        return result.rows[0];
    },

    async findAll({ page = 1, limit = 20, status } = {}) {
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (status) {
            conditions.push(`ar.status = $${paramIndex++}`);
            params.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
      SELECT ar.*, t.type AS tx_type, t.category AS tx_category, t.amount AS tx_amount,
        u_req.display_name AS requested_by_name,
        u_app.display_name AS approved_by_name
      FROM adjustment_requests ar
      JOIN transactions t ON ar.transaction_id = t.id
      JOIN users u_req ON ar.requested_by = u_req.id
      LEFT JOIN users u_app ON ar.approved_by = u_app.id
      ${whereClause}
      ORDER BY ar.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await query(sql, params);

        const countSql = `SELECT COUNT(*) FROM adjustment_requests ar ${whereClause}`;
        const countResult = await query(countSql, params.slice(0, -2));

        return {
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
        };
    },

    async findById(id) {
        const result = await query(
            `SELECT ar.*, t.type AS tx_type, t.category AS tx_category, t.amount AS tx_amount,
        u_req.display_name AS requested_by_name
       FROM adjustment_requests ar
       JOIN transactions t ON ar.transaction_id = t.id
       JOIN users u_req ON ar.requested_by = u_req.id
       WHERE ar.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    async approve(id, approvedBy) {
        const result = await query(
            `UPDATE adjustment_requests SET status = 'approved', approved_by = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'pending' RETURNING *`,
            [approvedBy, id]
        );
        return result.rows[0] || null;
    },

    async reject(id, approvedBy) {
        const result = await query(
            `UPDATE adjustment_requests SET status = 'rejected', approved_by = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'pending' RETURNING *`,
            [approvedBy, id]
        );
        return result.rows[0] || null;
    },
};

module.exports = adjustmentRequestRepository;
