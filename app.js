require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Middleware
app.use(cors({
  origin: ["http://localhost:3001", "https://nama-project.vercel.app"],
  credentials: true
}));

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Routes
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);

// Home route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sistem Pelaporan Pengaduan Masyarakat API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            reports: '/api/reports',
            comments: '/api/comments'
        }
    });
});

// Error handler untuk route tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Terjadi kesalahan pada server'
    });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME}`);
});