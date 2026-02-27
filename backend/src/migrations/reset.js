const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function reset() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Resetting database...\n');

        // Truncate all data tables (order matters for FK constraints, use CASCADE)
        await client.query(`
            TRUNCATE TABLE adjustment_requests, audit_logs, transactions, bookings, rooms, users CASCADE
        `);
        console.log('✅ All tables truncated');

        // Clear uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir).filter(f => f !== '.gitkeep');
            files.forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
            console.log(`✅ Cleared ${files.length} uploaded files`);
        }

        // Re-seed default data
        console.log('\n🌱 Re-seeding default data...\n');

        const ownerPassword = await bcrypt.hash('owner123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        await client.query(`
            INSERT INTO users (username, password_hash, display_name, role) VALUES
                ('owner', $1, 'เจ้าของ (Owner)', 'owner'),
                ('admin', $2, 'ผู้ดูแล (Admin A)', 'admin')
            ON CONFLICT (username) DO NOTHING
        `, [ownerPassword, adminPassword]);
        console.log('✅ Users seeded');

        await client.query(`
            INSERT INTO rooms (room_number, room_type, price_per_night, description, max_guests) VALUES
                ('101', 'Standard', 800.00, 'ห้องมาตรฐาน ชั้น 1', 2),
                ('102', 'Standard', 800.00, 'ห้องมาตรฐาน ชั้น 1', 2),
                ('201', 'Deluxe', 1200.00, 'ห้องดีลักซ์ ชั้น 2 วิวสวน', 3),
                ('202', 'Deluxe', 1200.00, 'ห้องดีลักซ์ ชั้น 2 วิวภูเขา', 3),
                ('301', 'Suite', 2000.00, 'ห้องสวีท ชั้น 3 วิวพาโนรามา', 4)
            ON CONFLICT (room_number) DO NOTHING
        `);
        console.log('✅ Rooms seeded');

        console.log('\n✅ Database reset completed successfully');
        console.log('\n📋 Test Accounts:');
        console.log('   Owner: username=owner, password=owner123');
        console.log('   Admin: username=admin, password=admin123');
    } catch (err) {
        console.error('❌ Reset failed:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

reset().catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
});
