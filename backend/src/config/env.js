require('dotenv').config();

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'hkh_db',
    user: process.env.DB_USER || 'hkh_admin',
    password: process.env.DB_PASSWORD || 'hkh_secret_2024',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  lineMessaging: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    targetId: process.env.LINE_TARGET_ID || '',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  },
};

module.exports = env;
