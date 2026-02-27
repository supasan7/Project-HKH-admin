const { query } = require('../config/database');

const userRepository = {
    async findByUsername(username) {
        const result = await query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );
        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await query(
            'SELECT id, username, display_name, role, is_active, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    async findAll() {
        const result = await query(
            'SELECT id, username, display_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        return result.rows;
    },
};

module.exports = userRepository;
