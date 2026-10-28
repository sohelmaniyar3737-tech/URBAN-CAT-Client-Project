# URBAN CAT store starter

React/Vite storefront + Express API. The API uses PostgreSQL through Prisma.

## Safe database setup

1. Sign in at https://console.neon.tech/.
2. Create a **new Neon project** named `urban-cat-db`. Do not reuse AluuAI's project/database connection string.
3. Copy both the pooled connection string (for `DATABASE_URL`) and the direct/unpooled connection string (for `DIRECT_URL`) from the new project's **Connect** dialog. Both must come from `urban-cat-db`.
4. Create `server/.env` by copying `server/.env.example`, then set `DATABASE_URL` to that new connection string and set strong `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` values. Never commit `.env` or share its contents.

## Install and run (from project root)

```bash
npm install
npm run install:all
```

Create the schema and initial migration against the new, empty URBAN CAT database:

```bash
cd server
npm run db:validate
npm run db:generate
npm run db:migrate -- --name init
cd ..
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173). API health check: http://localhost:5000/api/health.

For later production deployment, set the production server's `DATABASE_URL` to the URBAN CAT Neon database and run `npm run db:deploy` from `server` as part of deployment. Do not run development migrations against AluuAI.

## Notes

- The former Mongoose models/routes have been migrated to Prisma. The database starts empty; existing MongoDB documents are **not automatically copied**.
- Products and orders are stored in PostgreSQL. Order line items keep product name/price snapshots so old orders remain readable if a product is deleted.
- Admin login is configured via environment variables; use strong credentials before deployment.

## Product image uploads (optional)

The owner product form supports a direct image URL and an upload button. To enable uploads:

1. Create/sign in to a Cloudinary account at https://cloudinary.com/.
2. In Cloudinary, create an **unsigned upload preset** for product images. Restrict the preset as appropriate for your store; do not put Cloudinary API secrets in frontend variables.
3. Copy `client/.env.example` to `client/.env` (or add these values to your existing client `.env`) and set:

   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
   ```

4. Restart the Vite dev server after changing environment variables.
5. In Owner access → Products, click **Upload image**, select a JPG/PNG/WebP image up to 8 MB, then save the product.

Cloudinary upload is optional. Until configured, the owner can still paste a publicly reachable image URL. Never paste a Windows file path such as `C:\\Users\\...`; browsers cannot use that as a public product image URL.

## Product image gallery update

Products now support up to four additional gallery images alongside the main product image. The storefront opens a gallery preview when a product image is clicked; this preview shows the product photos, name, price, and description without changing the existing Add to Bag flow.

After installing the updated server dependencies, apply the new database migration using:

```bash
cd server
npm run db:deploy
```

For local development, `npm run db:generate` can be run after pulling the updated Prisma schema. Keep your actual `client/.env` and `server/.env` files locally; they are intentionally excluded from shared ZIPs.



## Razorpay online payments (Test Mode first)

Add these values to `server/.env` without removing your existing database/auth settings:

```env
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Keep the Key Secret only on the backend. Never add it to `client/.env`, any `VITE_` variable, or source control. The storefront loads Razorpay Checkout and creates payment orders through the Express API. The API verifies the checkout signature and confirms the payment is captured before marking an order as paid.

Apply the new additive database migration from the project root:

```bash
cd server
npm run db:generate
npm run db:deploy
cd ..
npm run dev
```

For local testing, leave Razorpay in Test Mode and use test credentials. Before real customer payments, deploy the store to a public HTTPS URL, complete Razorpay website/business verification, and replace the test credentials with Live Mode credentials on the backend only. The custom URBAN CAT checkout page uses the store's black/white styling; Razorpay's secure payment window is hosted by Razorpay.
