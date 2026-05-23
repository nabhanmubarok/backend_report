const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tambahkan ini sebelum routes
app.get('/test-db', async (req, res) => {
    try {
        const db = require('./config/database');
        const [result] = await db.query('SELECT 1 as test');
        res.json({
            success: true,
            message: 'Database connected!',
            host: process.env.DB_HOST,
            database: process.env.DB_NAME
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            host: process.env.DB_HOST
        });
    }
});
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);


app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sistem Pelaporan Pengaduan Masyarakat API',
        version: '1.0.0'
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server berjalan di port ${PORT}`);
});