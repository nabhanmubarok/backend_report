const express = require('express');
const router = require('express').Router();
const {
    createComment,
    getCommentsByReport,
    updateComment,
    deleteComment
} = require('../controllers/commentController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/report/:reportId', getCommentsByReport);

// Protected routes
router.post('/', verifyToken, createComment);
router.put('/:id', verifyToken, updateComment);
router.delete('/:id', verifyToken, deleteComment);

module.exports = router;