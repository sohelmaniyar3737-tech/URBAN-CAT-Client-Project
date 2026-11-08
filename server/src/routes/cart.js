
import { Router } from 'express';
import { prisma } from '../db.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();

router.use(requireCustomer);

const MAX_QUANTITY = 20;

function formatCart(cart) {
  return {
    items: cart.items.map((item) => {
      const product = item.product;

      return {
        key: `${item.productId}-${item.size}-${item.colour}`,
        id: item.id,
        productId: item.productId,
        name: product.name,
        price: product.price,
        discountPercent: product.discountPercent,
        discountedPrice:
          product.price * (1 - product.discountPercent / 100),
        image: product.image,
        quantity: item.quantity,
        size: item.size,
        colour: item.colour
      };
    })
  };
}

async function getCart(userId) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const cart = await getCart(req.customer.id);
    res.json(formatCart(cart));
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items
router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1, size, colour } = req.body;

    if (
      typeof productId !== 'string' ||
      typeof size !== 'string' ||
      typeof colour !== 'string' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return res.status(400).json({ message: 'Invalid cart item details.' });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, published: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (!product.sizes.includes(size) || !product.colours.includes(colour)) {
      return res.status(400).json({
        message: 'Selected size or colour is not available.'
      });
    }

    const cart = await getCart(req.customer.id);

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_size_colour: {
          cartId: cart.id,
          productId,
          size,
          colour
        }
      }
    });

    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (nextQuantity > MAX_QUANTITY) {
      return res.status(400).json({
        message: `Maximum quantity is ${MAX_QUANTITY} per cart item.`
      });
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId_size_colour: {
          cartId: cart.id,
          productId,
          size,
          colour
        }
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        size,
        colour
      },
      update: { quantity: nextQuantity }
    });

    const updatedCart = await getCart(req.customer.id);
    res.json(formatCart(updatedCart));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/cart/items/:id
router.patch('/items/:id', async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return res.status(400).json({ message: 'Invalid quantity.' });
    }

    const result = await prisma.cartItem.updateMany({
      where: {
        id: req.params.id,
        cart: { userId: req.customer.id }
      },
      data: { quantity }
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const cart = await getCart(req.customer.id);
    res.json(formatCart(cart));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/items/:id
router.delete('/items/:id', async (req, res, next) => {
  try {
    const result = await prisma.cartItem.deleteMany({
      where: {
        id: req.params.id,
        cart: { userId: req.customer.id }
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const cart = await getCart(req.customer.id);
    res.json(formatCart(cart));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart
router.delete('/', async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: req.customer.id } }
    });

    res.json({ items: [] });
  } catch (error) {
    next(error);
  }
});

export default router;
