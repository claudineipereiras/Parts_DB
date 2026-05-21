require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('Connected to MariaDB/MySQL.');

        const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
        await connection.query(sql);

        console.log('Database schema successfully initialized.');
        await connection.end();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDB();
