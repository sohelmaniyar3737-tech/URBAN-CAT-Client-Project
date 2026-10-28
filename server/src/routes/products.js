import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100);
const exposeProduct = (product) => product ? { ...product, _id: product.id } : product;

router.get('/', async (req, res, next) => {
  try {
    const where = { published: true };
    if (req.query.category && req.query.category !== 'All') where.category = String(req.query.category);
    const products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(products.map(exposeProduct));
  } catch (error) { next(error); }
});

router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products.map(exposeProduct));
  } catch (error) { next(error); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, description = '', category, price, discountPercent = 0, image = '', galleryImages = [], sizes, colours, published = true, badge = '' } = req.body ?? {};
    const discount = Number(discountPercent);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) return res.status(400).json({ message: 'Discount must be between 0 and 100 percent.' });
    if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' || !category.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Name, category and a valid non-negative price are required.' });
    }
    const baseSlug = slugify(name);
    const slug = `${baseSlug || 'product'}-${Date.now().toString(36)}`;
    const product = await prisma.product.create({ data: {
      name: name.trim(), slug, description: String(description).slice(0, 2000), category: category.trim(),
      price: Number(price), discountPercent: discount, image: String(image), galleryImages: Array.isArray(galleryImages) ? galleryImages.map(String).slice(0, 4) : [], sizes: Array.isArray(sizes) ? sizes.map(String) : ['S', 'M', 'L', 'XL'],
      colours: Array.isArray(colours) ? colours.map(String) : ['Black', 'White'], published: Boolean(published), badge: String(badge).slice(0, 30)
    } });
    res.status(201).json(exposeProduct(product));
  } catch (error) { next(error); }
});

router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'category', 'price', 'discountPercent', 'image', 'galleryImages', 'sizes', 'colours', 'published', 'badge'];
    const updates = Object.fromEntries(Object.entries(req.body ?? {}).filter(([key]) => allowed.includes(key)));
    if ('price' in updates && (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    if ('price' in updates) updates.price = Number(updates.price);
    if ('discountPercent' in updates) {
      updates.discountPercent = Number(updates.discountPercent);
      if (!Number.isFinite(updates.discountPercent) || updates.discountPercent < 0 || updates.discountPercent > 100) return res.status(400).json({ message: 'Discount must be between 0 and 100 percent.' });
    }
    for (const key of ['name', 'category', 'description', 'image', 'badge']) if (key in updates) updates[key] = String(updates[key]);
    for (const key of ['sizes', 'colours', 'galleryImages']) if (key in updates && !Array.isArray(updates[key])) return res.status(400).json({ message: `${key} must be an array.` });
    if ('galleryImages' in updates) updates.galleryImages = updates.galleryImages.map(String).slice(0, 4);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: updates });
    res.json(exposeProduct(product));
  } catch (error) { next(error); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted.' });
  } catch (error) { next(error); }
});

export default router;
