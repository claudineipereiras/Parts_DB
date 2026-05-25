# Escooter Parts Database (v3.0) - System Documentation

This document serves as the master reference for the Escooter Parts Database application. It outlines the technology stack, architectural decisions, database structure, and core features, reflecting the modernization from the legacy PHP application to the current React/Node.js stack.

## 1. Project Overview

The Escooter Parts Database is a modernized, full-stack web application built to manage technical specifications, replacement parts, and visual schematic diagrams for various Escooter brands and models. 

## 2. Technology Stack

### Frontend
*   **Framework**: React.js (via Vite)
*   **Routing**: React Router DOM (`v7`)
*   **HTTP Client**: Axios
*   **Styling**: Pure CSS (Vanilla) utilizing a centralized variable system (`index.css`) for a premium, light-themed aesthetic. No external styling libraries like Tailwind or Bootstrap are used to ensure maximum control.
*   **Icons**: Lucide React

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database Client**: `mysql2` (Promise-based connection pool)
*   **Authentication**: `jsonwebtoken` (JWT) and `bcrypt` (Password hashing)
*   **File Uploads**: `multer` (Handling images and CSVs)
*   **Data Processing**: `csv-parser` (For high-speed stream parsing of bulk data)

### Database
*   **Engine**: MySQL / MariaDB (v5.7+ or v10.4+)

---

## 3. Database Schema

The relational database (`parts_db`) is heavily normalized to ensure data integrity.

*   `users`: Manages administrative access (`id`, `date_registered`, `full_name`, `email`, `password_hash`, `status`, `role`). 
    *   *Statuses*: `Active`, `Inactive`, `Requested`
    *   *Roles*: `Admin`, `User` (Defaults to `User` for self-registered accounts).
*   `brand`: Stores escooter manufacturers (`id`, `name`, `status`).
*   `escooter`: Stores detailed technical specs for models, linked to a brand (`id`, `id_brand`, `model`, `battery_voltage`, `motor_watt`, etc.).
*   `parts`: The core inventory table. Linked to both a brand and an escooter model (`id`, `sku`, `description`, `id_make`, `id_model`, `photo_path`).
*   `diagram`: Stores the schematic image uploaded for a specific escooter (`id`, `id_escooter`, `diagram_picture`).
*   `list_diagram`: A junction table that maps a specific part to a reference number on a diagram (`id_part`, `id_diagram`, `diagram_number`).

---

## 4. Core Features & Modules

### 4.1. Authentication & Role-Based Access Control (RBAC)
*   **Registration/Login**: Standard email and hashed-password authentication via `/api/auth`.
*   **Access Levels**:
    *   **Admin**: Only administrators (`role = 'Admin'`) can access the User settings dashboard to approve (`Requested` -> `Active`), deactivate, or delete user accounts.
    *   **User**: Regular users can view parts, escooters, and diagrams but are strictly blocked from user management.
*   **Multi-layered Security**: 
    *   *API protection*: Routes are guarded with `auth` and `admin` middlewares (`backend/middleware/admin.js`).
    *   *UI protection*: Non-admin users cannot see the "User settings" item in the sidebar layout.
    *   *Router protection*: React router guards (`AdminRoute`) intercept unauthorized direct navigation.

### 4.2. Escooters & Brands Module
*   **Management**: CRUD operations for Escooter models and their technical specifications.
*   **Quick-Add**: A dynamic feature allowing users to create a new Brand directly from the modal if it doesn't already exist in the dropdown.

### 4.3. Parts Inventory
*   **Filtered Views**: Parts are filtered dynamically based on the selected Escooter Model.
*   **Image Uploads**: Individual parts can have a photo attached via `multer`, saved to `/uploads/`.
*   **Pagination**: The table is strictly paginated (10 items per page) on the client-side for rapid rendering.

### 4.4. Bulk CSV Importer
*   **Endpoint**: `POST /api/parts/bulk`
*   **Validation Rules**: 
    *   Strict checking against the `brand` and `escooter` tables. The names in the CSV must perfectly match the database.
    *   Fails the *entire* batch if a single row contains a duplicate SKU or an invalid foreign key link, preventing partial database corruption.

### 4.5. Interactive Diagramming Module
*   **Layout**: A 60/40 split view. The left panel displays the uploaded schematic image; the right panel contains the mapping interface.
*   **Mapping**: Users can link an existing Part SKU to a `# Number` drawn on the schematic image via the `/diagrams` interface.
*   **Data Integrity**: Handled via the `list_diagram` table. Deleting a part automatically cascades and removes its reference from the diagram mapping.

---

## 5. Folder Structure & Key Files

```text
/Parts_DB
│
├── /backend
│   ├── /routes           # Express API endpoints (parts.js, escooters.js, diagrams.js, auth.js, etc.)
│   ├── /middleware       # auth.js (JWT validation), admin.js (Admin privilege guard)
│   ├── db.js             # MySQL connection pool
│   ├── schema.sql        # Master database schema script
│   ├── init_db.js        # Automatic schema initializer script
│   ├── seed.js           # Seeds sample brands and models
│   ├── create_admin.js   # Generates default Admin account
│   └── server.js         # Entry point for the backend API
│
├── /frontend
│   ├── /src
│   │   ├── /components   # Reusable UI (Layout.jsx, Pagination.jsx)
│   │   ├── /pages        # Main views (Parts.jsx, Escooters.jsx, Diagrams.jsx, Users.jsx, etc.)
│   │   ├── App.jsx       # React Router setup and AdminRoute guard
│   │   └── index.css     # Global CSS variables and design tokens
│   └── index.html
│
└── /uploads              # Static directory for part photos and schematic diagrams
```

---

## 6. How to Run Locally

### 1. Database Setup
Ensure MySQL/MariaDB is running locally on port `3306`.
Create a database named `parts_db` or execute the automatic initialization script:
```bash
cd backend
node init_db.js
node seed.js
node create_admin.js
```
*Note: This instantiates all tables, seeds default brands/models, and creates the default admin user:*
*   **Admin Email**: `admin@example.com`
*   **Admin Password**: `admin123`

### 2. Backend Server Setup
Ensure `.env` in the `/backend` folder contains valid credentials:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=parts_db
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```
Start the Express API:
```bash
npm run dev
# Starts on http://localhost:5000
```

### 3. Frontend Server Setup
Navigate into the `/frontend` directory and start the Vite dev server:
```bash
cd ../frontend
npm run dev
# Starts on http://localhost:5173
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.
