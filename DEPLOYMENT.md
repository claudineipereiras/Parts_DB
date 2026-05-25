# Deployment Guide: Escooter Parts Database (v3.0)

This guide walks you through deploying the modernized Escooter Parts Database application (built on React/Vite + Node.js/Express + MariaDB/MySQL) to a production environment. 

The application utilizes a decoupled architecture:
1.  **Frontend**: Built with React (Vite) and compiled into static HTML/CSS/JS assets.
2.  **Backend**: An Express.js REST API server running on Node.js.
3.  **Database**: MariaDB or MySQL.

---

## 1. Hosting Requirements & Prerequisites

Before deploying, ensure your server has the following installed:
*   **Operating System**: Linux (Ubuntu 20.04/22.04 LTS recommended) or Windows Server.
*   **Node.js**: `v18.0.0` or higher.
*   **Process Manager**: **PM2** (installed globally: `npm install -g pm2`) to ensure the Node backend runs continuously.
*   **Database Engine**: MySQL `5.7+` or MariaDB `10.4+`.
*   **Web Server / Reverse Proxy**: **Nginx** (highly recommended) or Apache.

---

## 2. Relational Database Deployment

1.  **Log in to your MySQL/MariaDB instance**:
    ```bash
    mysql -u root -p
    ```
2.  **Create the database and a secure dedicated user**:
    ```sql
    CREATE DATABASE parts_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER 'parts_admin'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
    GRANT ALL PRIVILEGES ON parts_db.* TO 'parts_admin'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```
3.  **Initialize the Schema & Admin Account**:
    Import the SQL tables using the backend scripts, or run them from the repository folder:
    ```bash
    cd /path/to/project/backend
    
    # Configure your DB connection strings first (see Step 3)
    node init_db.js
    node seed.js
    node create_admin.js
    ```
    *This automatically creates all necessary indices, tables, default brand/escooter data, and sets up the admin account (`admin@example.com` / `admin123`).*

---

## 3. Backend (API) Server Deployment

1.  **Install dependencies**:
    From your backend folder, install production dependencies only to save disk footprint:
    ```bash
    cd /path/to/project/backend
    npm install --omit=dev
    ```
2.  **Configure environment variables**:
    Create a production `.env` file inside the `backend` folder:
    ```env
    DB_HOST=127.0.0.1
    DB_USER=parts_admin
    DB_PASSWORD=YourStrongPassword123!
    DB_NAME=parts_db
    JWT_SECRET=use_a_very_long_random_hash_string_here_for_security
    PORT=5000
    ```
3.  **Manage and daemonize backend using PM2**:
    Start the Express API using PM2 so it stays alive in the background and recovers on crashes/server restarts:
    ```bash
    pm2 start server.js --name "escooter-parts-api"
    ```
    To ensure the PM2 daemon starts up on machine reboot:
    ```bash
    pm2 startup
    pm2 save
    ```

---

## 4. Frontend Compilation & Serving

The React frontend needs to be compiled to static assets before deployment. 

1.  **Build Frontend locally or on server**:
    ```bash
    cd /path/to/project/frontend
    npm install
    npm run build
    ```
    *This generates a standalone `/dist` folder containing the optimized production assets (`index.html`, JavaScript bundles, and global CSS).*
2.  **Upload Static Assets**:
    Copy the contents of the `frontend/dist` folder to your server's web root directory (e.g., `/var/www/escooter-parts-db/`).

---

## 5. Web Server Configuration (Nginx Reverse Proxy)

To expose both the frontend and backend on port 80 (HTTP) or 443 (HTTPS) under a single domain, use Nginx as a reverse proxy.

Below is an optimized Nginx server block configuration (`/etc/nginx/sites-available/escooter-parts`):

```nginx
server {
    listen 80;
    server_name escooterparts.yourdomain.com; # Replace with your domain

    root /var/www/escooter-parts-db;
    index index.html;

    # 1. Frontend Router Handler (SPA)
    # Redirects all traffic to index.html so React Router can process pages
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Reverse Proxy for Backend API requests
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 3. Serving Static Uploads directly via Nginx for maximum performance
    location /uploads/ {
        alias /path/to/project/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 4. Upload Size limit adjustment for Bulk CSV and Large Images
    client_max_body_size 20M;
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/escooter-parts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Directory Permissions

For users to successfully upload part pictures and schematic diagrams:
1.  Verify the `/uploads/` directory exists in the project root.
2.  Set the ownership to the web server user (usually `www-data` on Linux) so the Node/Express service can write files dynamically:
    ```bash
    sudo chown -R www-data:www-data /path/to/project/uploads
    sudo chmod -R 755 /path/to/project/uploads
    ```

---

## 7. Security Best Practices

*   **SSL/TLS (HTTPS)**: Secure the traffic using a free Let's Encrypt certificate:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d escooterparts.yourdomain.com
    ```
*   **Database Protection**: Never expose port `3306` to public traffic. Bind MySQL/MariaDB to `127.0.0.1` locally only.
*   **Secrets Storage**: Rotate `JWT_SECRET` keys regularly and never commit `.env` files to remote version control (GitHub/GitLab).
