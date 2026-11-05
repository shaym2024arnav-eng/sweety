const app = require('./app');
const config = require('./config');
const migrate = require('./db/migrate');

async function start() {
  // Creating tables on start-up keeps first-time setup to one command.
  await migrate();
  app.listen(config.port, () => {
    console.log(`Sweety API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
