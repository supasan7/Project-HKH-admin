const app = require('./src/app');
const env = require('./src/config/env');

const PORT = env.port;

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
