/**
 * Chat & Messaging Controller
 * Handles conversation listings, message history, reactions, and WebRTC signals
 */

const ApiResponse = require('../utils/apiResponse');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const pool = require('../config/database');

/**
 * Get User Conversations
 */
const getConversations = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Retrieve distinct users interacted with or active channels
  const [messages] = await pool.execute(`
    SELECT DISTINCT 
      CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as partner_id
    FROM chat_messages
    WHERE (sender_id = ? OR recipient_id = ?) AND is_group = 0
  `, [userId, userId, userId]).catch(() => [[]]);

  const partnerIds = messages.map(m => m.partner_id).filter(Boolean);

  let partners = [];
  if (partnerIds.length > 0) {
    const placeholders = partnerIds.map(() => '?').join(',');
    const [userRows] = await pool.execute(
      `SELECT id, name, email, role, department, avatar, status, last_login FROM users WHERE id IN (${placeholders})`,
      partnerIds
    );
    partners = userRows;
  }

  return ApiResponse.success(res, partners, 'Conversations retrieved');
});

/**
 * Get Messages for a specific conversation
 */
const getMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const partnerId = req.params.partnerId || req.query.partnerId;
  const { limit = 100 } = req.query;

  let query = '';
  let params = [];

  if (partnerId === 'all' || partnerId === 'group') {
    query = 'SELECT * FROM chat_messages WHERE is_group = 1 ORDER BY created_at ASC LIMIT ?';
    params = [Number(limit)];
  } else {
    query = `
      SELECT * FROM chat_messages 
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at ASC 
      LIMIT ?
    `;
    params = [userId, partnerId, partnerId, userId, Number(limit)];
  }

  const [rows] = await pool.execute(query, params).catch(() => [[]]);

  // Parse reactions and edit_history
  const formatted = rows.map(m => ({
    ...m,
    reactions: typeof m.reactions === 'string' ? JSON.parse(m.reactions || '{}') : (m.reactions || {}),
    edit_history: typeof m.edit_history === 'string' ? JSON.parse(m.edit_history || '[]') : (m.edit_history || [])
  }));

  return ApiResponse.success(res, formatted, 'Messages retrieved');
});

/**
 * Send Direct or Group Message
 */
const sendMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const { recipient_id, content, text, file_url, file_name, file_type, file_size, is_group = 0 } = req.body;
  const messageText = (content || text || '').trim();

  if (!messageText && !file_url) {
    throw new AppError('Message text or attachment is required.', 400);
  }

  const [result] = await pool.execute(`
    INSERT INTO chat_messages (
      sender_id, recipient_id, content, is_group, file_url, file_name,
      file_type, file_size, reactions, edit_history, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', '[]', 0, NOW())
  `, [
    senderId,
    recipient_id || null,
    messageText,
    is_group ? 1 : 0,
    file_url || null,
    file_name || null,
    file_type || null,
    file_size || null
  ]);

  const [rows] = await pool.execute('SELECT * FROM chat_messages WHERE id = ?', [result.insertId]);
  return ApiResponse.created(res, rows[0], 'Message sent');
});

/**
 * Add / Remove Reaction on a Message
 */
const toggleReaction = catchAsync(async (req, res) => {
  const { messageId, emoji } = req.body;
  const userId = req.user.id;

  const [rows] = await pool.execute('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
  if (rows.length === 0) {
    throw new AppError('Message not found.', 404);
  }

  const message = rows[0];
  let reactions = typeof message.reactions === 'string' ? JSON.parse(message.reactions || '{}') : (message.reactions || {});

  if (!reactions[emoji]) {
    reactions[emoji] = [userId];
  } else if (reactions[emoji].includes(userId)) {
    reactions[emoji] = reactions[emoji].filter(id => id !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji].push(userId);
  }

  await pool.execute('UPDATE chat_messages SET reactions = ? WHERE id = ?', [JSON.stringify(reactions), messageId]);
  return ApiResponse.success(res, { messageId, reactions }, 'Reaction updated');
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  toggleReaction
};
