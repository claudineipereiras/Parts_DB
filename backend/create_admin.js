const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'parts_db'
        });

        // Create a default admin user
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);
        
        // Use INSERT IGNORE in case admin@example.com already exists
        await connection.query(
            'INSERT IGNORE INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, ?)', 
            ['Admin User', 'admin@example.com', hash, 'Active']
        );

        // Also update any other users that might have been created to 'Active'
        await connection.query('UPDATE users SET status = "Active"');

        console.log('Admin account created/ensured:');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');

        const [rows] = await connection.query('SELECT id, full_name, email, status FROM users');
        console.log('\nCurrent Users in DB:', rows);

        await connection.end();
    } catch (err) {
        console.error('Error creating admin:', err);
    }
}

createAdmin();
