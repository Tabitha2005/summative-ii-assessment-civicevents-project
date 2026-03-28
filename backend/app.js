import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import routes from './src/routes/index.routes.js';
import errorHandler from './src/middlewares/errorHandler.middleware.js';

const app = express();

app.use(morgan('dev'));
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (filePath.endsWith('.mp3')) res.set('Content-Type', 'audio/mpeg');
    if (filePath.endsWith('.wav')) res.set('Content-Type', 'audio/wav');
    if (filePath.endsWith('.ogg')) res.set('Content-Type', 'audio/ogg');
    if (filePath.endsWith('.m4a')) res.set('Content-Type', 'audio/mp4');
  }
}));

// API routes
app.use('/api', routes);
app.get('/health', (req, res) => res.json({ ok: true }));

// Error handler
app.use(errorHandler);

export default app;
