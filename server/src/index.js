import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { prisma } from './db.js';
import authRoutes from './routes/auth.js';
import customerAuthRoutes from './routes/customerAuth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';

const app = express();
const port = Number(process.env.PORT || 5000);
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',').map((value) => value.trim()) || 'http://10.85.196.148:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch {
    res.status(503).json({ ok: false, database: 'disconnected' });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.status && error.status < 500) return res.status(error.status).json({ message: error.message });
  if (error?.code === 'P2002') return res.status(409).json({ message: 'A record with that value already exists.' });
  if (error?.code === 'P2025') return res.status(404).json({ message: 'Record not found.' });
  if (error?.code === 'P2003') return res.status(400).json({ message: 'This record is referenced by another record.' });
  res.status(500).json({ message: 'Server error. Please try again.' });
});

const server = app.listen(port, "0.0.0.0", () => console.log(`URBAN CAT API listening on http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
