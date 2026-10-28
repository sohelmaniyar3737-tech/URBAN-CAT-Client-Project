# 🐈 URBAN CAT — Clothing

**Independent streetwear. Made to stand out.**

URBAN CAT is a modern clothing e-commerce platform built to deliver a stylish and seamless online shopping experience. Featuring a bold black-and-white aesthetic, the store showcases streetwear products with dynamic pricing, discounts, product recommendations, and a streamlined checkout experience.

## ✨ Features

- 🛍️ **Product Catalog** — Browse clothing collections and product details.
- 💸 **Discounted Pricing** — Display product discounts and savings.
- 🛒 **Shopping Cart** — Add products and manage quantities.
- 📱 **Responsive Design** — Optimized for desktop, tablet, and mobile devices.
- 🔐 **Authentication** — Customer and owner authentication.
- 📦 **Order Management** — Place orders and manage order information.
- 💳 **Payment Integration** — Integrated payment flow.
- 🎯 **Recommended Products** — Discover more styles through product recommendations.
- ⚙️ **Owner Dashboard** — Manage store products and orders.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM

### Database
- PostgreSQL

### Other Tools
- Git & GitHub
- REST API

## 📂 Project Structure

```text
urban-cat/
├── client/          # React frontend
├── server/          # Express backend
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/urban-cat.git
```

### 2. Navigate to the project

```bash
cd urban-cat
```

### 3. Install dependencies

Install the root dependencies if applicable:

```bash
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create `.env` files inside the `client` and `server` folders.

#### Client — `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

#### Server — `server/.env`

Configure the required backend environment variables, including:

- Database connection URL
- JWT secret
- Client origin
- Payment provider credentials

**Never commit real credentials or secret keys to GitHub.**

### 5. Start the application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the local frontend URL provided by Vite.

## 🔒 Security

- Environment variables are used for sensitive configuration.
- Authentication is handled through the backend.
- Secret keys and database credentials should never be exposed publicly.

## 🎨 Design

URBAN CAT follows a minimal black-and-white visual identity inspired by modern streetwear brands.

The interface focuses on:

- Bold typography
- Clean product presentation
- Smooth interactions
- Responsive layouts
- Simple shopping experience

## 📌 Project Status

🚧 **Under Development**

URBAN CAT is actively being developed, with ongoing improvements to the storefront, product management, and customer shopping experience.

## 👨‍💻 Developer

Developed with ❤️ for **URBAN CAT Clothing**.

---

© URBAN CAT Clothing. All rights reserved.
