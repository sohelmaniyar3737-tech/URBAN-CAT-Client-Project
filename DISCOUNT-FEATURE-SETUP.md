# URBAN CAT — Percentage Discount Feature

This update is based on the uploaded project that already contains the Razorpay test-payment flow.

## What's included
- `Product.discountPercent` database field, default `0`.
- Owner Add/Edit Product form field with live discounted-price preview.
- Discount badge and crossed-out original price on product cards, product details, recommended products, cart, and checkout summary.
- Backend validates discount percentages (0–100) on product create/update.
- Backend recalculates discounted prices from database product data for online and manual orders; it does not trust client-sent prices.
- Additive Prisma migration: `20261026170000_add_product_discount`.

## Important: keep your secrets
This ZIP intentionally does not include `.env` files or `node_modules`.
Copy your existing `server/.env` and `client/.env` into the extracted project locally, if required. Do not share or commit secrets.

## Run it
From the project root in PowerShell:
```powershell
npm install
npm run install:all
cd server
npm run db:generate
npm run db:deploy
cd ..
npm run dev
```

Make sure `server/.env` points at the correct database before running the migration. Back up the database first. The migration adds a nullable-to-defaulted column and does not delete existing products or orders.

## Test
1. Sign in to the owner dashboard.
2. Add or edit a product, enter the original price and a discount (e.g. price `1000`, discount `10`).
3. Save it. The store should show `₹900`, crossed-out `₹1,000`, and a `SAVE 10%` badge.
4. Add the product to cart and check the checkout total.
5. Complete a Razorpay **Test Mode** payment and confirm the order/payment still appears in the owner dashboard.

A discount of `0` leaves the normal price and hides the sale badge. A 100% discount results in a zero-priced item; Razorpay online checkout has a minimum payment of ₹1, so free orders will need a separate free-order checkout path if you intend to support them.
