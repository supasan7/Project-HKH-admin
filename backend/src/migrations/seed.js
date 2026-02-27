const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...\n');

    // Seed Users
    const ownerPassword = await bcrypt.hash('liengchaisiri2508', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    await client.query(`
      INSERT INTO users (username, password_hash, display_name, role) VALUES
        ('owner', $1, 'เจ้าของ (Owner)', 'owner'),
        ('admin', $2, 'ผู้ดูแล (Admin)', 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [ownerPassword, adminPassword]);
    console.log('✅ Users seeded');

    // Seed Rooms
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

    console.log('\n✅ Seeding completed successfully');
    console.log('\n📋 Test Accounts:');
    console.log('   Owner: username=owner, password=liengchaisiri2508');
    console.log('   Admin: username=admin, password=admin123');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
