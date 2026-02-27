/**
 * Format date to Thai locale string
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Format currency to Thai Baht
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
    }).format(amount);
};

/**
 * Calculate number of nights between two dates
 */
const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = { formatDate, formatCurrency, calculateNights };
