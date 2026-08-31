/**
 * Authentication Service
 * Handles user verification, hashing, token issuance, and password resets
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { JWT_SECRET } = require('../middleware/authMiddleware');

class AuthService {
  /**
   * Find user by email or username
   */
  static async findUserByEmailOrUsername(identifier) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1',
      [identifier, identifier]
    );
    return users[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findUserById(id) {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, department, avatar, status, created_at, last_login FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return users[0] || null;
  }

  /**
   * Validate password against stored bcrypt hash or fallback hash upgrade
   */
  static async verifyPassword(plainPassword, user) {
    if (!user || !user.password) return false;

    // Direct bcrypt compare
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (isMatch) return true;

    // Fallback for legacy plain text passwords in dev/migration (auto-upgrades to bcrypt)
    if (user.password === plainPassword) {
      const newHash = await bcrypt.hash(plainPassword, 10);
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      return true;
    }

    return false;
  }

  /**
   * Issue JWT token
   */
  static generateToken(user, expiresIn = '24h') {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department || null
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  /**
   * Register a new user
   */
  static async registerUser({ name, email, password, role = 'student', department = 'All' }) {
    const existing = await this.findUserByEmailOrUsername(email);
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, department, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, role, department, 'active']
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      role,
      department
    };

    const token = this.generateToken(newUser);
    return { user: newUser, token };
  }

  /**
   * Authenticate user with credentials
   */
  static async loginUser(identifier, password) {
    const user = await this.findUserByEmailOrUsername(identifier);
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      throw new AppError('Your account has been deactivated. Please contact your administrator.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await this.verifyPassword(password, user);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login timestamp asynchronously
    pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]).catch(() => {});

    const token = this.generateToken(user);
    const { password: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  /**
   * Update password
   */
  static async updatePassword(userId, currentPassword, newPassword) {
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    const user = users[0];
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await this.verifyPassword(currentPassword, user);
    if (!isMatch) {
      throw new AppError('Incorrect current password.', 400, 'INCORRECT_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
    return true;
  }
}

module.exports = AuthService;
