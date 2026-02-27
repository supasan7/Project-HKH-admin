import api from '../config/api';

export const roomService = {
    getAll: () => api.get('/rooms'),
    getById: (id) => api.get(`/rooms/${id}`),
    create: (data) => api.post('/rooms', data),
    update: (id, data) => api.put(`/rooms/${id}`, data),
    updatePrice: (id, price) => api.patch(`/rooms/${id}/price`, { price_per_night: price }),
    markCleaned: (id, cleanedBy) => api.patch(`/rooms/${id}/clean`, { cleaned_by: cleanedBy }),
    delete: (id) => api.delete(`/rooms/${id}`),
};

export const bookingService = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    cancel: (id) => api.patch(`/bookings/${id}/cancel`),
    checkIn: (id) => api.patch(`/bookings/${id}/check-in`),
    checkOut: (id) => api.patch(`/bookings/${id}/check-out`),
    getCalendar: (start, end) => api.get('/bookings/calendar', { params: { start, end } }),
    getBookedDates: (roomId) => api.get(`/bookings/booked-dates/${roomId}`),
};

export const transactionService = {
    getAll: (params) => api.get('/transactions', { params }),
    getById: (id) => api.get(`/transactions/${id}`),
    create: (formData) => api.post('/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    verify: (id) => api.patch(`/transactions/${id}/verify`),
    requestVoid: (id, reason) => api.post(`/transactions/${id}/void`, { reason }),
    getAdjustments: (params) => api.get('/transactions/adjustments/list', { params }),
    approveAdjustment: (id) => api.patch(`/transactions/adjustments/${id}/approve`),
    rejectAdjustment: (id) => api.patch(`/transactions/adjustments/${id}/reject`),
};

export const reportService = {
    getDaily: (date) => api.get('/reports/daily', { params: { date } }),
    getMonthly: (year, month) => api.get('/reports/monthly', { params: { year, month } }),
    getMonthlyPdfData: (year, month) => api.get('/reports/monthly-pdf', { params: { year, month } }),
    getAuditLogs: (params) => api.get('/reports/audit-logs', { params }),
};
