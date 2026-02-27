const auditLogRepository = require('../repositories/auditLogRepository');

const auditService = {
    async log({ user_id, action, entity_type, entity_id = null, old_value = null, new_value = null, ip_address = null }) {
        return auditLogRepository.create({
            user_id,
            action,
            entity_type,
            entity_id,
            old_value,
            new_value,
            ip_address,
        });
    },

    async getAll(filters) {
        return auditLogRepository.findAll(filters);
    },
};

module.exports = auditService;
