const axios = require('axios');
const env = require('../config/env');
const { formatCurrency, formatDate, calculateNights } = require('../utils/helpers');

const getThaiTime = () => {
    return new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

const lineMessagingService = {
    async sendMessages(messages) {
        const { channelAccessToken, targetId } = env.lineMessaging;

        if (!channelAccessToken || !targetId) {
            console.log('⚠️ LINE Messaging API not configured.');
            return null;
        }

        try {
            const response = await axios.post(
                LINE_API_URL,
                { to: targetId, messages },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${channelAccessToken}`,
                    },
                }
            );
            return response.data;
        } catch (err) {
            console.error('LINE Messaging API Error:', err.response?.data || err.message);
            return null;
        }
    },

    async send(message) {
        return this.sendMessages([{ type: 'text', text: message.trim() }]);
    },

    async sendBookingNotification(booking, room) {
        const nights = calculateNights(booking.check_in_date, booking.check_out_date);
        const days = nights + 1;
        const message = `
🏠 การจองใหม่!
🕐 ${getThaiTime()}
ห้อง: ${room.room_number} (${room.room_type})
ชื่อแขก: ${booking.guest_name}
📞 เบอร์: ${booking.guest_phone || '-'}
เช็คอิน: ${formatDate(booking.check_in_date)}
เช็คเอาท์: ${formatDate(booking.check_out_date)}
📅 ${days} วัน ${nights} คืน
ยอดรวม: ${formatCurrency(booking.total_amount)}`;

        return this.send(message);
    },

    async sendCancelNotification(booking) {
        const message = `
❌ ยกเลิกการจอง!
🕐 ${getThaiTime()}
ห้อง: ${booking.room_number} (${booking.room_type})
ชื่อแขก: ${booking.guest_name}
📞 เบอร์: ${booking.guest_phone || '-'}
เช็คอิน: ${formatDate(booking.check_in_date)}
เช็คเอาท์: ${formatDate(booking.check_out_date)}
ยอดรวม: ${formatCurrency(booking.total_amount)}`;

        return this.send(message);
    },

    async sendCheckInNotification(booking) {
        const message = `
📥 เช็คอิน!
🕐 ${getThaiTime()}
ห้อง: ${booking.room_number} (${booking.room_type})
ชื่อแขก: ${booking.guest_name}
📞 เบอร์: ${booking.guest_phone || '-'}
เช็คเอาท์: ${formatDate(booking.check_out_date)}`;

        return this.send(message);
    },

    async sendCheckOutNotification(booking) {
        const nights = calculateNights(booking.check_in_date, booking.check_out_date);
        const days = nights + 1;
        const message = `
📤 เช็คเอาท์!
🕐 ${getThaiTime()}
ห้อง: ${booking.room_number} (${booking.room_type})
ชื่อแขก: ${booking.guest_name}
📅 เข้าพัก ${days} วัน ${nights} คืน
ยอดรวม: ${formatCurrency(booking.total_amount)}`;

        return this.send(message);
    },

    async sendTransactionNotification(tx, booking = null) {
        const typeLabel = tx.type === 'income' ? '💰 รายรับ' : '💸 รายจ่าย';
        let bookingInfo = '';
        if (booking) {
            bookingInfo = `\n🏠 ห้อง: ${booking.room_number}\n👤 แขก: ${booking.guest_name}\n📞 เบอร์: ${booking.guest_phone || '-'}`;
        }

        const message = `
${typeLabel}
🕐 ${getThaiTime()}${bookingInfo}
หมวดหมู่: ${tx.category}
จำนวน: ${formatCurrency(tx.amount)}
รายละเอียด: ${tx.description || '-'}`;

        const messages = [{ type: 'text', text: message.trim() }];

        // Attach slip image if available and URL is publicly accessible
        if (tx.attachment_url) {
            const baseUrl = process.env.BACKEND_URL || `http://localhost:${env.port}`;
            const imageUrl = `${baseUrl}${tx.attachment_url}`;
            messages.push({
                type: 'image',
                originalContentUrl: imageUrl,
                previewImageUrl: imageUrl,
            });
        }

        return this.sendMessages(messages);
    },
};

module.exports = lineMessagingService;
