const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,  // Tambahkan ini (60 detik)
    enableKeepAlive: true,   // Tambahkan ini
    keepAliveInitialDelay: 0 // Tambahkan ini
});

// Test koneksi saat startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Host:', process.env.DB_HOST);
        console.error('Database:', process.env.DB_NAME);
    } else {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

// Promise wrapper untuk menggunakan async/await
const db = pool.promise();
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
module.exports = db;