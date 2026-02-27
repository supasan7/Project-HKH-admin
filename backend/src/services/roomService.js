const roomRepository = require('../repositories/roomRepository');
const auditService = require('./auditService');
const AppError = require('../utils/AppError');

const roomService = {
    async getAll() {
        return roomRepository.findAll();
    },

    async getById(id) {
        const room = await roomRepository.findById(id);
        if (!room) throw new AppError('ไม่พบห้องพัก', 404);
        return room;
    },

    async create(data, userId, ipAddress) {
        const room = await roomRepository.create(data);

        await auditService.log({
            user_id: userId,
            action: 'CREATE_ROOM',
            entity_type: 'room',
            entity_id: room.id,
            new_value: room,
            ip_address: ipAddress,
        });

        return room;
    },

    async update(id, data, userId, ipAddress) {
        const oldRoom = await roomRepository.findById(id);
        if (!oldRoom) throw new AppError('ไม่พบห้องพัก', 404);

        const room = await roomRepository.update(id, data);

        await auditService.log({
            user_id: userId,
            action: 'UPDATE_ROOM',
            entity_type: 'room',
            entity_id: room.id,
            old_value: oldRoom,
            new_value: room,
            ip_address: ipAddress,
        });

        return room;
    },

    async updatePrice(id, price, userId, ipAddress) {
        const oldRoom = await roomRepository.findById(id);
        if (!oldRoom) throw new AppError('ไม่พบห้องพัก', 404);

        const room = await roomRepository.updatePrice(id, price);

        await auditService.log({
            user_id: userId,
            action: 'UPDATE_ROOM_PRICE',
            entity_type: 'room',
            entity_id: room.id,
            old_value: { price_per_night: oldRoom.price_per_night },
            new_value: { price_per_night: room.price_per_night },
            ip_address: ipAddress,
        });

        return room;
    },

    async markCleaned(id, cleanedBy, userId, ipAddress) {
        const oldRoom = await roomRepository.findById(id);
        if (!oldRoom) throw new AppError('ไม่พบห้องพัก', 404);
        if (oldRoom.status !== 'cleaning') throw new AppError('ห้องนี้ไม่ได้อยู่ในสถานะรอทำความสะอาด', 400);

        const room = await roomRepository.markCleaned(id, cleanedBy);

        await auditService.log({
            user_id: userId,
            action: 'CLEAN_ROOM',
            entity_type: 'room',
            entity_id: room.id,
            old_value: { status: 'cleaning' },
            new_value: { status: 'available', cleaned_by: cleanedBy },
            ip_address: ipAddress,
        });

        return room;
    },

    async delete(id, userId, ipAddress) {
        const room = await roomRepository.softDelete(id);
        if (!room) throw new AppError('ไม่พบห้องพัก', 404);

        await auditService.log({
            user_id: userId,
            action: 'DELETE_ROOM',
            entity_type: 'room',
            entity_id: room.id,
            old_value: room,
            ip_address: ipAddress,
        });

        return room;
    },
};

module.exports = roomService;
