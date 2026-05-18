const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (user sendiri)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/profile/change-password', verifyToken, changePassword);
router.delete('/profile', verifyToken, deleteAccount);

// Super Admin only routes (CRUD User)
router.get('/admin/users', verifyToken, verifyRole('super_admin'), getAllUsers);
router.get('/admin/users/:id', verifyToken, verifyRole('super_admin'), getUserById);
router.post('/admin/users', verifyToken, verifyRole('super_admin'), createUser);
router.put('/admin/users/:id', verifyToken, verifyRole('super_admin'), updateUser);
router.delete('/admin/users/:id', verifyToken, verifyRole('super_admin'), deleteUser);

module.exports = router;