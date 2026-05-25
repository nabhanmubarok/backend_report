const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
const register = async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;

        // Validasi input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi'
            });
        }

        // Cek user existing
        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username sudah terdaftar'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: { id: result.insertId, username, role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi'
            });
        }

        // Cari user
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const user = users[0];

        // Verifikasi password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
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

// Get profile (user sendiri)
const getProfile = async (req, res) => {
    try {
        
        const [users] = await db.query(
    'SELECT id, username, role, avatar, created_at FROM users WHERE id = ?',
    [req.user.id]
);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username wajib diisi'
            });
        }

        // Cek username tidak bentrok dengan user lain
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username sudah digunakan user lain'
            });
        }

        await db.query('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);

        res.json({
            success: true,
            message: 'Profile berhasil diupdate'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama dan baru wajib diisi'
            });
        }

        // Ambil user dari database
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        // Verifikasi password lama
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Password lama salah'
            });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Delete account
const deleteAccount = async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);

        res.json({
            success: true,
            message: 'Akun berhasil dihapus'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// ============= CRUD USER UNTUK SUPER ADMIN =============

// Get all users (Super Admin only)
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, role, avatar, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Get user by ID (Super Admin only)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            'SELECT id, username, role, avatar, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Create user (Super Admin only)
const createUser = async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi'
            });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username sudah terdaftar'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );

        res.status(201).json({
            success: true,
            message: 'User berhasil dibuat',
            data: { id: result.insertId, username, role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Update user (Super Admin only)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, role } = req.body;

        if (!username || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username dan role wajib diisi'
            });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        await db.query('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, id]);

        res.json({
            success: true,
            message: 'User berhasil diupdate'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// Delete user (Super Admin only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'User berhasil dihapus'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File gambar wajib diupload' });
        }
        const avatarUrl = req.file.path;
        await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
        res.json({ success: true, message: 'Foto profil berhasil diupdate', data: { avatar: avatarUrl } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

module.exports = {
    register, login, getProfile, updateProfile,
    changePassword, deleteAccount, getAllUsers,
    getUserById, createUser, updateUser, deleteUser,
    updateAvatar
};