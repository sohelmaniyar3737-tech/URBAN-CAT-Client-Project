import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Admin login is not configured on the server.' });
  }
  const userOkay = typeof username === 'string' && username === expectedUser;
  // Supports a plain env password for simple local setup; bcrypt hash is also accepted.
  let passwordOkay = false;
  if (typeof password === 'string') {
    if (expectedPassword.startsWith('$2')) passwordOkay = await bcrypt.compare(password, expectedPassword);
    else passwordOkay = password === expectedPassword;
  }
  if (!userOkay || !passwordOkay) return res.status(401).json({ message: 'Invalid username or password.' });
  const token = jwt.sign({ role: 'admin', username: expectedUser }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: expectedUser, expiresIn: 28800 });
});

export default router;
