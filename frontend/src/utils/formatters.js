export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

export const ROOM_STATUS = {
    available: { label: 'ว่าง', class: 'badge-success' },
    booked: { label: 'จองแล้ว', class: 'badge-warning' },
    checked_in: { label: 'เข้าพัก', class: 'badge-info' },
    cleaning: { label: 'รอทำความสะอาด', class: 'badge-danger' },
};

export const TX_TYPE = {
    income: { label: 'รายรับ', class: 'badge-success' },
    expense: { label: 'รายจ่าย', class: 'badge-danger' },
};

export const TX_STATUS = {
    pending: { label: 'รอยืนยัน', class: 'badge-warning' },
    verified: { label: 'ยืนยันแล้ว', class: 'badge-success' },
    voided: { label: 'ยกเลิก', class: 'badge-danger' },
};

export const ADJ_STATUS = {
    pending: { label: 'รออนุมัติ', class: 'badge-warning' },
    approved: { label: 'อนุมัติแล้ว', class: 'badge-success' },
    rejected: { label: 'ปฏิเสธ', class: 'badge-danger' },
};
