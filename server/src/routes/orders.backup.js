import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const statuses = ['Pending confirmation', 'Confirmed', 'Printing', 'Shipped', 'Delivered', 'Cancelled'];
const exposeOrder = (order) => {
  if (!order) return order;
  const { name, phone, email, address, city, state, pincode, ...rest } = order;
  return {
    ...rest, _id: order.id,
    customer: { name, phone, email, address, city, state, pincode },
    items: (order.items ?? []).map((item) => ({ ...item, _id: item.id, product: item.productId }))
  };
};
const orderInclude = { items: { orderBy: { id: 'asc' } } };

router.post('/', async (req, res, next) => {
  try {
    const { customer, items } = req.body ?? {};
    const required = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    if (!customer || required.some((key) => !String(customer[key] ?? '').trim())) return res.status(400).json({ message: 'Please complete all required delivery details.' });
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
      normalized.push({ productId: product.id, name: product.name, price: product.price, quantity, size, colour });
      total += product.price * quantity;
    }
    const orderNumber = `UC-${Date.now().toString(36).toUpperCase()}`;
    const order = await prisma.order.create({ data: {
      orderNumber, name: String(customer.name).trim(), phone: String(customer.phone).trim(), email: String(customer.email ?? '').trim(),
      address: String(customer.address).trim(), city: String(customer.city).trim(), state: String(customer.state).trim(), pincode: String(customer.pincode).trim(),
      total, status: 'Pending confirmation', items: { create: normalized }
    } });
    res.status(201).json({ message: 'Order received! The store owner will confirm it shortly.', orderNumber: order.orderNumber, total: order.total, status: order.status });
  } catch (error) { next(error); }
});

router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' } });
    res.json(orders.map(exposeOrder));
  } catch (error) { next(error); }
});

router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!statuses.includes(status)) return res.status(400).json({ message: 'Invalid order status.' });
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status }, include: orderInclude });
    res.json(exposeOrder(order));
  } catch (error) { next(error); }
});

export default router;
