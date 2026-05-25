const db = require('../config/database');

// Create comment
const createComment = async (req, res) => {
    try {
        const { body, public_report_id } = req.body;
        const user_id = req.user.id;

        if (!body || !public_report_id) {
            return res.status(400).json({
                success: false,
                message: 'Body dan public_report_id wajib diisi'
            });
        }

        // Cek apakah laporan ada
        const [reports] = await db.query('SELECT id FROM public_reports WHERE id = ?', [public_report_id]);
        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Laporan tidak ditemukan'
            });
        }

        const [result] = await db.query(
            'INSERT INTO comments (body, user_id, public_report_id) VALUES (?, ?, ?)',
            [body, user_id, public_report_id]
        );

        res.status(201).json({
            success: true,
            message: 'Komentar berhasil ditambahkan',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Get comments by report ID
const getCommentsByReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        const [comments] = await db.query(
            `SELECT c.*, u.username as commenter, u.avatar as commenter_avatar
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.public_report_id = ?
             ORDER BY c.created_at ASC
             LIMIT ? OFFSET ?`,
            [reportId, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM comments WHERE public_report_id = ?',
            [reportId]
        );
        const total = countResult[0].total;

        res.json({
            success: true,
            data: comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Update comment (Owner & Admin)
const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!body) {
            return res.status(400).json({
                success: false,
                message: 'Body komentar wajib diisi'
            });
        }

        const [comments] = await db.query('SELECT user_id FROM comments WHERE id = ?', [id]);
        
        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Komentar tidak ditemukan'
            });
        }

        if (comments[0].user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengupdate komentar ini'
            });
        }

        await db.query('UPDATE comments SET body = ? WHERE id = ?', [body, id]);

        res.json({
            success: true,
            message: 'Komentar berhasil diupdate'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Delete comment (Owner, Admin, Super Admin)
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [comments] = await db.query('SELECT user_id FROM comments WHERE id = ?', [id]);
        
        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Komentar tidak ditemukan'
            });
        }

        await db.query('DELETE FROM comments WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Komentar berhasil dihapus'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

module.exports = {
    createComment,
    getCommentsByReport,
    updateComment,
    deleteComment
};