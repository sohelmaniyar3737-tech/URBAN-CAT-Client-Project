import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { optionalCustomer } from '../middleware/optionalCustomer.js';

const router = Router();

const razorpayKeyId = () => String(process.env.RAZORPAY_KEY_ID || '').trim();
const razorpayKeySecret = () => String(process.env.RAZORPAY_KEY_SECRET || '').trim();

async function razorpayRequest(path, { method = 'GET', body } = {}) {
  const keyId = razorpayKeyId();
  const secret = razorpayKeySecret();
  if (!keyId || !secret) {
    const error = new Error('Online payments are not configured yet. Add Razorpay test credentials to server/.env.');
    error.status = 503;
    throw error;
  }
  const authorization = Buffer.from(`${keyId}:${secret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.description || 'Razorpay could not process this payment request.');
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
  }
  return data;
}

function safeSignatureEqual(expected, supplied) {
  if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(supplied, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

router.post('/payment/create', optionalCustomer, async (req, res, next) => {
  let createdOrderId;
  try {
    const { customer, items } = req.body ?? {};
    const required = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    if (!customer || required.some((key) => !String(customer[key] ?? '').trim())) return res.status(400).json({ message: 'Please complete all required delivery details.' });
    if (digitsOnly(customer.phone).length < 10 || digitsOnly(customer.phone).length > 15) return res.status(400).json({ message: 'Please enter a valid phone number.' });
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) return res.status(400).json({ message: 'Your cart is empty or contains too many items.' });

   const normalized = [];
let subtotal = 0;

const handlingFee = 15;
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ message: 'Invalid quantity.' });
      const productId = String(item.productId ?? '');
      const product = await prisma.product.findFirst({ where: { id: productId, published: true } });
      if (!product) return res.status(400).json({ message: 'One of your selected products is unavailable. Refresh your cart.' });
      const size = String(item.size ?? 'M');
      const colour = String(item.colour ?? 'Black');
      if (!product.sizes.includes(size) || !product.colours.includes(colour)) return res.status(400).json({ message: `Selected size or colour is unavailable for ${product.name}.` });
      const discountPercent = Math.min(100, Math.max(0, Number(product.discountPercent || 0)));

const originalPrice = Number(product.price);
const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;

normalized.push({
  productId: product.id,
  name: product.name,
  price: finalPrice,
  quantity,
  size,
  colour
});

subtotal += finalPrice * quantity;
    }

    const PRODUCT_HANDLING_FEE = 15;
    const total = Math.round((subtotal + PRODUCT_HANDLING_FEE) * 100) / 100;
    const amountPaise = Math.round(total * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ message: 'The minimum online payment amount is ₹1.' });
    }
    const orderNumber = `UC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const localOrder = await prisma.order.create({ data: {
      orderNumber, userId: req.customer?.id ?? null,
      name: String(customer.name).trim(), phone: String(customer.phone).trim(),
      email: String(customer.email ?? '').trim(), address: String(customer.address).trim(),
      city: String(customer.city).trim(), state: String(customer.state).trim(), pincode: String(customer.pincode).trim(),
      total, status: 'Pending confirmation', paymentStatus: 'created', paymentMethod: 'razorpay',
      items: { create: normalized },
      statusEvents: { create: { status: 'Pending confirmation', note: 'Order created; awaiting online payment' } }
    } });
    createdOrderId = localOrder.id;
    const gatewayOrder = await razorpayRequest('/orders', { method: 'POST', body: {
      amount: amountPaise, currency: 'INR', receipt: orderNumber,
      notes: { orderNumber, store: 'URBAN CAT' }
    } });
    await prisma.order.update({ where: { id: localOrder.id }, data: { razorpayOrderId: gatewayOrder.id } });
    res.status(201).json({
      keyId: razorpayKeyId(), razorpayOrderId: gatewayOrder.id,
      amount: gatewayOrder.amount, currency: gatewayOrder.currency,
      orderNumber, total, customer: { name: localOrder.name, email: localOrder.email, phone: localOrder.phone }
    });
  } catch (error) {
    if (createdOrderId) {
      try { await prisma.order.delete({ where: { id: createdOrderId } }); } catch { /* retain the original payment error */ }
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
});

router.post('/payment/verify', optionalCustomer, async (req, res, next) => {
  try {
    const orderNumber = String(req.body?.orderNumber ?? '').trim();
    const razorpayOrderId = String(req.body?.razorpay_order_id ?? '').trim();
    const razorpayPaymentId = String(req.body?.razorpay_payment_id ?? '').trim();
    const razorpaySignature = String(req.body?.razorpay_signature ?? '').trim();
    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return res.status(400).json({ message: 'Payment verification details are incomplete.' });
    const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
    if (!order || order.razorpayOrderId !== razorpayOrderId) return res.status(404).json({ message: 'The payment order could not be matched to your order.' });
    if (!razorpayKeySecret()) return res.status(503).json({ message: 'Payment verification is not configured. Contact the store owner.' });
    const expected = createHmac('sha256', razorpayKeySecret()).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (!safeSignatureEqual(expected, razorpaySignature)) return res.status(400).json({ message: 'Payment signature verification failed. Do not retry from an unknown link; contact support if money was deducted.' });
    const payment = await razorpayRequest(`/payments/${encodeURIComponent(razorpayPaymentId)}`);
    if (payment.order_id !== razorpayOrderId) return res.status(400).json({ message: 'Payment does not belong to this order.' });
    if (Number(payment.amount) !== Math.round(Number(order.total) * 100) || payment.currency !== 'INR') return res.status(400).json({ message: 'Payment amount does not match this order. Contact support before retrying.' });
    if (payment.status === 'captured' && order.paymentStatus === 'paid' && order.razorpayPaymentId === razorpayPaymentId) return res.json({ message: 'Payment is already verified.', orderNumber, total: order.total, status: order.status, paymentStatus: order.paymentStatus });
    if (payment.status !== 'captured') {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: payment.status === 'authorized' ? 'authorized' : 'pending' } });
      return res.status(409).json({ message: payment.status === 'authorized' ? 'Payment is authorized but not captured yet. Please wait before retrying.' : `Payment is not captured yet (status: ${payment.status}).` });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'paid', paymentMethod: 'razorpay', razorpayPaymentId } });
      await tx.orderStatusEvent.create({ data: { orderId: order.id, status: order.status, note: 'Razorpay payment captured and verified' } });
      return result;
    });
    res.json({ message: 'Payment verified successfully.', orderNumber: updated.orderNumber, total: updated.total, status: updated.status, paymentStatus: updated.paymentStatus, createdAt: updated.createdAt });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
});
const statuses = ['Pending confirmation', 'Confirmed', 'Printing', 'Shipped', 'Delivered', 'Cancelled'];
const orderInclude = { items: { orderBy: { id: 'asc' } }, statusEvents: { orderBy: { createdAt: 'asc' } } };
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');
const exposeOrder = (order) => {
  if (!order) return order;
  const { name, phone, email, address, city, state, pincode, ...rest } = order;
  return {
    ...rest, _id: order.id,
    customer: { name, phone, email, address, city, state, pincode },
    items: (order.items ?? []).map((item) => ({ ...item, _id: item.id, product: item.productId }))
  };
};
const trackingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many tracking attempts. Please wait 15 minutes and try again.' } });

router.post('/', optionalCustomer, async (req, res, next) => {
  try {
    const { customer, items } = req.body ?? {};
    const required = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    if (!customer || required.some((key) => !String(customer[key] ?? '').trim())) return res.status(400).json({ message: 'Please complete all required delivery details.' });
    if (digitsOnly(customer.phone).length < 10 || digitsOnly(customer.phone).length > 15) return res.status(400).json({ message: 'Please enter a valid phone number.' });
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) return res.status(400).json({ message: 'Your cart is empty or contains too many items.' });

    const normalized = [];
    let total = 0;
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ message: 'Invalid quantity.' });
      const productId = String(item.productId ?? '');
      const product = await prisma.product.findFirst({ where: { id: productId, published: true } });
      if (!product) return res.status(400).json({ message: 'One of your selected products is unavailable. Refresh your cart.' });
      const size = String(item.size ?? 'M');
      const colour = String(item.colour ?? 'Black');
      if (!product.sizes.includes(size) || !product.colours.includes(colour)) return res.status(400).json({ message: `Selected size or colour is unavailable for ${product.name}.` });
      const discountPercent = Math.min(100, Math.max(0, Number(product.discountPercent || 0)));
      const finalPrice = Math.round(Number(product.price) * (1 - discountPercent / 100) * 100) / 100;
      normalized.push({ productId: product.id, name: product.name, price: finalPrice, quantity, size, colour });
      total += finalPrice * quantity;
    }
    const orderNumber = `UC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order = await prisma.order.create({
  data: {
    orderNumber,
    userId: req.customer?.id ?? null,
    name: String(customer.name).trim(),
    phone: String(customer.phone).trim(),
    email: String(customer.email ?? '').trim(),
    address: String(customer.address).trim(),
    city: String(customer.city).trim(),
    state: String(customer.state).trim(),
    pincode: String(customer.pincode).trim(),
    total,
    status: 'Pending confirmation',
    items: { create: normalized },
    statusEvents: {
      create: {
        status: 'Pending confirmation',
        note: 'Order placed'
      }
    }
  }
});
    res.status(201).json({ message: 'Order received! Save your order number to track it later.', orderNumber: order.orderNumber, total: order.total, status: order.status, createdAt: order.createdAt });
  } catch (error) { next(error); }
});

// Customers must provide both their order number and the phone number used at checkout.
// This endpoint deliberately returns no delivery address, email, or full phone number.
router.post('/track', trackingLimiter, async (req, res, next) => {
  try {
    const orderNumber = String(req.body?.orderNumber ?? '').trim().toUpperCase();
    const suppliedPhone = digitsOnly(req.body?.phone);
    if (!orderNumber || suppliedPhone.length < 10 || suppliedPhone.length > 15) return res.status(400).json({ message: 'Enter the order number and the phone number used at checkout.' });
    const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
    const storedPhone = digitsOnly(order?.phone);
    // Compare the full normalized phone number, allowing a leading international +country code to be omitted.
    const phoneMatches = order && (storedPhone === suppliedPhone || (storedPhone.length >= 10 && suppliedPhone.length === 10 && storedPhone.slice(-10) === suppliedPhone));
    if (!phoneMatches) return res.status(404).json({ message: 'We could not find an order matching those details. Check the order number and phone number.' });

    let events = (order.statusEvents ?? []).map(({ status, note, createdAt }) => ({ status, note, createdAt }));
    if (!events.length) {
      events = [{ status: 'Pending confirmation', note: 'Order placed', createdAt: order.createdAt }];
      if (order.status !== 'Pending confirmation') events.push({ status: order.status, note: 'Current status (history available from tracking activation onward)', createdAt: order.updatedAt });
    }
    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(({ name, price, quantity, size, colour }) => ({ name, price, quantity, size, colour })),
      events
    });
  } catch (error) { next(error); }
});


router.get('/my-orders', requireCustomer, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.customer.id
      },
      include: orderInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders.map(exposeOrder));
  } catch (error) {
    next(error);
  }
});


router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders.map(exposeOrder));
  } catch (error) {
    next(error);
  }
});


router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!statuses.includes(status)) return res.status(400).json({ message: 'Invalid order status.' });
    const existing = await prisma.order.findUnique({ where: { id: req.params.id }, select: { id: true, status: true, paymentMethod: true, paymentStatus: true } });
    if (!existing) return res.status(404).json({ message: 'Order not found.' });
    if (existing.paymentMethod === 'razorpay' && existing.paymentStatus !== 'paid' && status !== 'Cancelled') return res.status(409).json({ message: 'This online order cannot move to fulfilment until its payment is verified.' });
    if (existing.status === status) {
      const sameOrder = await prisma.order.findUnique({ where: { id: existing.id }, include: orderInclude });
      return res.json(exposeOrder(sameOrder));
    }
    const order = await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: req.params.id }, data: { status } });
      await tx.orderStatusEvent.create({ data: { orderId: req.params.id, status, note: `Status updated to ${status}` } });
      return tx.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
    });
    res.json(exposeOrder(order));
  } catch (error) { next(error); }
});

export default router;
