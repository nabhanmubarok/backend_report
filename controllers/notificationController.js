const db = require('../config/database');

const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [notifs] = await db.query(
      `SELECT n.*, r.header as report_title 
       FROM notifications n
       JOIN public_reports r ON n.report_id = r.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [user_id]
    );
    const [unread] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [user_id]
    );
    res.json({
      success: true,
      data: notifs,
      unread_count: unread[0].count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    res.json({ success: true, message: 'Notifikasi ditandai sudah dibaca' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [user_id]
    );
    res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };