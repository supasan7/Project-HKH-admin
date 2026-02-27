const { query } = require('../config/database');

const auditLogRepository = {
    async create({ user_id, action, entity_type, entity_id, old_value, new_value, ip_address }) {
        const result = await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [user_id, action, entity_type, entity_id,
                old_value ? JSON.stringify(old_value) : null,
                new_value ? JSON.stringify(new_value) : null,
                ip_address]
        );
        return result.rows[0];
    },

    async findAll({ page = 1, limit = 50, entity_type, user_id } = {}) {
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (entity_type) {
            conditions.push(`al.entity_type = $${paramIndex++}`);
            params.push(entity_type);
        }
        if (user_id) {
            conditions.push(`al.user_id = $${paramIndex++}`);
            params.push(user_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
      SELECT al.*, u.display_name AS user_name, u.role AS user_role
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await query(sql, params);

        const countSql = `SELECT COUNT(*) FROM audit_logs al ${whereClause}`;
        const countResult = await query(countSql, params.slice(0, -2));

        return {
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
        };
    },
};

module.exports = auditLogRepository;
