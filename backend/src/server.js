import { createServer } from 'node:http';
import { createLeadApp } from './app.js';

const port = Number(process.env.PORT) || 8787;
const server = createServer(createLeadApp());

server.listen(port, '0.0.0.0', () => {
  console.log(`LS Detailing lead API listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`${signal}: shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
