const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Create report (User & Admin)
// Create report (User & Admin)
const createReport = async (req, res) => {
    try {
        const { header, body, category_id, address, latitude, longitude } = req.body;
        const user_id = req.user.id;
        
        let image = null;
        if (req.file) {
        image = req.file.path; // Cloudinary URL
        }

        if (!header || !body || !category_id) {
            return res.status(400).json({
                success: false,
                message: 'Header, body, dan category_id wajib diisi'
            });
        }

        // Insert dengan lokasi
        const [result] = await db.query(
            `INSERT INTO public_reports 
            (header, body, user_id, category_id, image, address, latitude, longitude) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [header, body, user_id, category_id, image, address || null, latitude || null, longitude || null]
        );

        res.status(201).json({
            success: true,
            message: 'Laporan berhasil dibuat',
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

// Get all reports (Public)
// Get all reports with location filter
const getAllReports = async (req, res) => {
    try {
        const { status, category_id, near, lat, lng, radius = 5, page = 1, limit = 10 } = req.query;
        
        let query = `
            SELECT r.*, u.username as author, u.avatar as author_avatar, c.category_name,
            (SELECT COUNT(*) FROM comments WHERE public_report_id = r.id) as comment_count
            FROM public_reports r
            JOIN users u ON r.user_id = u.id
            JOIN categories c ON r.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        if (category_id) {
            query += ' AND r.category_id = ?';
            params.push(category_id);
        }

        // Filter berdasarkan jarak (nearby reports)
        if (near === 'true' && lat && lng) {
            query += ` AND (
                r.latitude IS NOT NULL AND 
                r.longitude IS NOT NULL AND
                (6371 * acos(
                    cos(radians(?)) * cos(radians(r.latitude)) * 
                    cos(radians(r.longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(r.latitude))
                )) <= ?
            `;
            params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
            query += ')';
        }

        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        const offset = (page - 1) * limit;
        params.push(parseInt(limit), parseInt(offset));

        const [reports] = await db.query(query, params);

        // Get total count
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM public_reports');
        const total = countResult[0].total;

        res.json({
            success: true,
            data: reports,
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

// Get report by ID
// Get report by ID (dengan lokasi)
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const [reports] = await db.query(
            `SELECT r.*, u.username as author, u.avatar as author_avatar, c.category_name 
             FROM public_reports r
             JOIN users u ON r.user_id = u.id
             JOIN categories c ON r.category_id = c.id
             WHERE r.id = ?`,
            [id]
        );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Laporan tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: reports[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Update report (Owner & Admin)
// Update report (Owner & Admin)
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { header, body, category_id, address, latitude, longitude } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Cek kepemilikan laporan
        const [reports] = await db.query('SELECT user_id, image FROM public_reports WHERE id = ?', [id]);
        
        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Laporan tidak ditemukan'
            });
        }

        // Hanya owner atau admin yang bisa update
        if (reports[0].user_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengupdate laporan ini'
            });
        }

        const updates = [];
        const params = [];

        if (header) {
            updates.push('header = ?');
            params.push(header);
        }
        if (body) {
            updates.push('body = ?');
            params.push(body);
        }
        if (category_id) {
            updates.push('category_id = ?');
            params.push(category_id);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(address);
        }
        if (latitude !== undefined) {
            updates.push('latitude = ?');
            params.push(latitude);
        }
        if (longitude !== undefined) {
            updates.push('longitude = ?');
            params.push(longitude);
        }
        if (req.file) {
        updates.push('image = ?');
        params.push(req.file.path); // Cloudinary URL
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada data yang diupdate'
            });
        }

        params.push(id);
        await db.query(`UPDATE public_reports SET ${updates.join(', ')} WHERE id = ?`, params);

        res.json({
            success: true,
            message: 'Laporan berhasil diupdate'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Delete report (Owner, Admin, Super Admin)
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [reports] = await db.query('SELECT user_id, image FROM public_reports WHERE id = ?', [id]);
        
        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Laporan tidak ditemukan'
            });
        }

        // Hapus gambar jika ada
        if (reports[0].image) {
            const imagePath = path.join(__dirname, '../uploads', reports[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await db.query('DELETE FROM public_reports WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Laporan berhasil dihapus'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Update report status (Admin & Super Admin)
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['pending', 'approved', 'rejected'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status tidak valid' });
        }

        const [reports] = await db.query(
            'SELECT id, user_id, header FROM public_reports WHERE id = ?', [id]
        );
        if (reports.length === 0) {
            return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
        }

        await db.query('UPDATE public_reports SET status = ? WHERE id = ?', [status, id]);

        // Kirim notifikasi ke pemilik laporan
        const statusLabel = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };
        const message = `Laporan "${reports[0].header}" telah diperbarui statusnya menjadi ${statusLabel[status]}.`;
        await db.query(
            'INSERT INTO notifications (user_id, report_id, message) VALUES (?, ?, ?)',
            [reports[0].user_id, id, message]
        );

        res.json({ success: true, message: `Status laporan berhasil diubah menjadi ${status}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// Get categories
const getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY category_name');
        
        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Create category (Admin & Super Admin)
const createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({
                success: false,
                message: 'Nama kategori wajib diisi'
            });
        }

        const [result] = await db.query('INSERT INTO categories (category_name) VALUES (?)', [category_name]);

        res.status(201).json({
            success: true,
            message: 'Kategori berhasil dibuat',
            data: { id: result.insertId, category_name }
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
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    updateReportStatus,
    getCategories,
    createCategory
};