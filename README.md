# MISTY — Luxury Fragrance E-Commerce

MISTY is a high-end luxury perfume e-commerce web application engineered with a modern decoupled full-stack architecture.

---

## Technology Stack

### Frontend
* **Core Framework**: React.js 18.3.1 with Vite 5.4.x
* **Styling**: Tailwind CSS 3.4.17
* **Client Routing**: React Router DOM 6.28.x
* **State Management**: React Context API (`AuthContext`, `CartContext`, `WishlistContext`)
* **HTTP Client**: Axios 1.7.9
* **Iconography**: Lucide React
* **Hosting Target**: Vercel

### Backend
* **Core Framework**: Python 3.11.x with Django 5.2 (Long-Term Support)
* **REST API**: Django REST Framework 3.15.2
* **Authentication**: Simple JWT 5.4.0 (JSON Web Tokens)
* **Database**: MySQL 8.0+
* **Database Driver**: `mysqlclient` 2.3.0 (Sole primary C-based driver)
* **Image CDN & Storage**: Cloudinary (via `cloudinary` SDK)
* **Hosting Target**: Render (Gunicorn WSGI)

---

## Project Structure

```text
Misty/
├── .gitignore                        # Global ignore configuration
├── README.md                         # Project documentation and developer guide
├── docs/
│   └── architecture.md               # Master system architecture specification
│
├── backend/
│   └── .env.example                  # Backend environment variable template
│
└── frontend/
    └── .env.example                  # Frontend environment variable template
```

---

## Development Prerequisites

Before beginning local setup, verify the following runtimes are installed on your system:

1. **Python**: `3.11.x` (or supported `3.12.x`)
   ```bash
   python --version
   ```
2. **Node.js**: `Node.js 20 LTS` or `22 LTS`
   ```bash
   node --version
   npm --version
   ```
3. **MySQL Server**: `MySQL 8.0+` running locally on port `3306`
   ```bash
   mysql --version
   ```
4. **Cloudinary Account**: Required for product image hosting.

---

## Local Setup Commands

### 1. Database Initialization
Log into your local MySQL command line interface and create the project database:
```sql
CREATE DATABASE misty_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Environment Preparation
```bash
# Navigate to the backend folder
cd backend

# Create a clean Python virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate

# Create local environment file from example template
copy .env.example .env     # Windows
# cp .env.example .env      # macOS/Linux

# Update DB_PASSWORD and other credentials inside backend/.env
```

### 3. Frontend Environment Preparation
```bash
# In a separate terminal, navigate to the frontend folder
cd frontend

# Create local environment file from example template
copy .env.example .env     # Windows
# cp .env.example .env      # macOS/Linux
```

---

## Key Business & Architectural Rules

1. **Guest Browsing**: Visitors can browse the homepage, collections, shop catalog, search, and view fragrance details (fragrance notes, bottle size, concentration) freely without authentication.
2. **Authenticated Actions**:
   * **Buy Now**: Requires login. Automatically adds the perfume to the cart and proceeds directly to checkout upon authentication.
   * **Add to Cart**: Requires login. Automatically adds the item and returns the customer to their previous product page upon authentication.
   * **Add to Wishlist**: Requires login. Saves the perfume and returns the customer to their previous product page upon authentication.
   * **Order Placement & History**: Checkout is restricted to authenticated customers. Only Cash on Delivery (COD) is supported initially.
3. **Data & Price Integrity**:
   * Frontend prices are never trusted; all computations are performed authoritatively by the backend.
   * Historical order items snapshot the product name, bottle volume, unit price, and subtotal at the moment of order creation.
   * Historical orders preserve an immutable snapshot of the shipping address.
   * Database transactions and row locking (`select_for_update()`) prevent stock overselling.

---

## Project Status

> **Current Phase**: **Phase 1: Architecture and Project Setup ONLY**  
> No application models, endpoints, authentication views, or user interfaces have been generated yet. All foundational documentation and configurations are prepared for review.

