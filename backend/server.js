import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';

dotenv.config();

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException',  (err) => { console.error('Uncaught exception:', err); process.exit(1); });

const PORT = parseInt(process.env.PORT || '8080', 10);
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Stop the other process first.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`✅ Backend API running on http://localhost:${PORT}`);
});
