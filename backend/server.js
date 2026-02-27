const app = require('./src/app');
const env = require('./src/config/env');

const PORT = env.port;

// Only listen when running locally (not on Vercel serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║     🏠 Project HKH (เฮือนคุ้มฮัก)         ║
  ║     Server running on port ${PORT}           ║
  ║     Environment: ${env.nodeEnv.padEnd(22)}║
  ║     http://localhost:${PORT}                 ║
  ╚═══════════════════════════════════════════╝
  `);
  });
}

// Export for Vercel serverless
module.exports = app;

