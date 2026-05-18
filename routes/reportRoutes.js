const express = require('express');
const router = express.Router();
const {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    updateReportStatus,
    getCategories,
    createCategory
} = require('../controllers/reportController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes (bisa diakses tanpa login)
router.get('/', getAllReports);
router.get('/categories', getCategories);
router.get('/:id', getReportById);

// Protected routes (perlu login)
router.post('/', verifyToken, upload.single('image'), createReport);
router.put('/:id', verifyToken, upload.single('image'), updateReport);
router.delete('/:id', verifyToken, deleteReport);

// Admin only routes
router.patch('/:id/status', verifyToken, verifyRole('admin', 'super_admin'), updateReportStatus);
router.post('/categories', verifyToken, verifyRole('admin', 'super_admin'), createCategory);

module.exports = router;