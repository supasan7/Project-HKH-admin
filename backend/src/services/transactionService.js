const transactionRepository = require('../repositories/transactionRepository');
const bookingRepository = require('../repositories/bookingRepository');
const adjustmentRequestRepository = require('../repositories/adjustmentRequestRepository');
const auditService = require('./auditService');
const lineNotifyService = require('./lineNotifyService');
const AppError = require('../utils/AppError');

const transactionService = {
    async getAll(filters) {
        return transactionRepository.findAll(filters);
    },

    async getById(id) {
        const tx = await transactionRepository.findById(id);
        if (!tx) throw new AppError('ไม่พบรายการเงิน', 404);
        return tx;
    },

    async create(data, userId, ipAddress) {
        // BUSINESS RULE: Attachment is mandatory
        if (!data.attachment_url) {
            throw new AppError('กรุณาแนบรูปสลิป/ใบเสร็จ', 400);
        }

        const tx = await transactionRepository.create({
            ...data,
            created_by: userId,
        });

        // Audit log
        await auditService.log({
            user_id: userId,
            action: 'CREATE_TRANSACTION',
            entity_type: 'transaction',
            entity_id: tx.id,
            new_value: tx,
            ip_address: ipAddress,
        });

        // Look up booking info if linked
        let booking = null;
        if (data.booking_id) {
            booking = await bookingRepository.findById(data.booking_id);
        }

        // Line Notify with booking info + slip image
        lineNotifyService.sendTransactionNotification(tx, booking);

        return tx;
    },

    async verify(id, userId, ipAddress) {
        const tx = await transactionRepository.findById(id);
        if (!tx) throw new AppError('ไม่พบรายการเงิน', 404);
        if (tx.status === 'verified') throw new AppError('รายการนี้ถูกยืนยันแล้ว', 400);
        if (tx.is_voided) throw new AppError('ไม่สามารถยืนยันรายการที่ถูกยกเลิกได้', 400);

        const verified = await transactionRepository.verify(id, userId);

        await auditService.log({
            user_id: userId,
            action: 'VERIFY_TRANSACTION',
            entity_type: 'transaction',
            entity_id: id,
            old_value: { status: tx.status },
            new_value: { status: 'verified' },
            ip_address: ipAddress,
        });

        return verified;
    },

    // BUSINESS RULE: No hard delete - must use void request and owner approval
    async requestVoid(transactionId, reason, userId, ipAddress) {
        const tx = await transactionRepository.findById(transactionId);
        if (!tx) throw new AppError('ไม่พบรายการเงิน', 404);
        if (tx.is_voided) throw new AppError('รายการนี้ถูกยกเลิกแล้ว', 400);

        const request = await adjustmentRequestRepository.create({
            transaction_id: transactionId,
            request_type: 'void',
            reason,
            old_data: tx,
            requested_by: userId,
        });

        await auditService.log({
            user_id: userId,
            action: 'REQUEST_VOID',
            entity_type: 'adjustment_request',
            entity_id: request.id,
            new_value: { transaction_id: transactionId, reason },
            ip_address: ipAddress,
        });

        return request;
    },

    // BUSINESS RULE: Only owner can approve void/edit
    async approveAdjustment(requestId, userId, userRole, ipAddress) {
        if (userRole !== 'owner') {
            throw new AppError('เฉพาะเจ้าของเท่านั้นที่สามารถอนุมัติได้', 403);
        }

        const request = await adjustmentRequestRepository.findById(requestId);
        if (!request) throw new AppError('ไม่พบคำขอ', 404);
        if (request.status !== 'pending') throw new AppError('คำขอนี้ถูกดำเนินการแล้ว', 400);

        const approved = await adjustmentRequestRepository.approve(requestId, userId);

        // If void request is approved, void the transaction
        if (request.request_type === 'void') {
            await transactionRepository.void(request.transaction_id);
        }

        await auditService.log({
            user_id: userId,
            action: 'APPROVE_ADJUSTMENT',
            entity_type: 'adjustment_request',
            entity_id: requestId,
            old_value: { status: 'pending' },
            new_value: { status: 'approved' },
            ip_address: ipAddress,
        });

        return approved;
    },

    async rejectAdjustment(requestId, userId, userRole, ipAddress) {
        if (userRole !== 'owner') {
            throw new AppError('เฉพาะเจ้าของเท่านั้นที่สามารถปฏิเสธได้', 403);
        }

        const request = await adjustmentRequestRepository.findById(requestId);
        if (!request) throw new AppError('ไม่พบคำขอ', 404);
        if (request.status !== 'pending') throw new AppError('คำขอนี้ถูกดำเนินการแล้ว', 400);

        const rejected = await adjustmentRequestRepository.reject(requestId, userId);

        await auditService.log({
            user_id: userId,
            action: 'REJECT_ADJUSTMENT',
            entity_type: 'adjustment_request',
            entity_id: requestId,
            old_value: { status: 'pending' },
            new_value: { status: 'rejected' },
            ip_address: ipAddress,
        });

        return rejected;
    },

    async getAdjustmentRequests(filters) {
        return adjustmentRequestRepository.findAll(filters);
    },
};

module.exports = transactionService;
