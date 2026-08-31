/**
 * Authentication Controller
 * Handles request parsing, response formatting, and calls AuthService
 */

const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const { catchAsync } = require('../middleware/errorHandler');
const pool = require('../config/database');

/**
 * User Login
 */
const login = catchAsync(async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').trim();

  const { user, token } = await AuthService.loginUser(identifier, password);
  return ApiResponse.success(res, { user, token }, 'Login successful');
});

/**
 * User Registration
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const { user, token } = await AuthService.registerUser({
    name,
    email,
    password,
    role: role || 'student',
    department: department || 'All'
  });

  return ApiResponse.created(res, { user, token }, 'Registration successful');
});

/**
 * Verify Current Authentication Token
 */
const verifyToken = catchAsync(async (req, res) => {
  const user = await AuthService.findUserById(req.user.id);
  if (!user) {
    return ApiResponse.error(res, 'User session not found', 404);
  }
  return ApiResponse.success(res, { user }, 'Token is valid');
});

/**
 * Get Current User Profile
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await AuthService.findUserById(req.user.id);
  return ApiResponse.success(res, user, 'Profile retrieved');
});

/**
 * Update Current User Profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const { name, email, avatar, department } = req.body;
  const userId = req.user.id;

  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name.trim()); }
  if (email) { updates.push('email = ?'); params.push(email.trim()); }
  if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
  if (department) { updates.push('department = ?'); params.push(department); }

  if (updates.length > 0) {
    params.push(userId);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const updatedUser = await AuthService.findUserById(userId);
  return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
});

/**
 * Change Password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await AuthService.updatePassword(req.user.id, currentPassword, newPassword);
  return ApiResponse.success(res, null, 'Password changed successfully');
});

/**
 * List All Users (Admin only)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const [users] = await pool.execute(
    'SELECT id, name, email, role, department, avatar, status, last_login, created_at FROM users ORDER BY name ASC'
  );
  return ApiResponse.success(res, users, 'Users list retrieved');
});

module.exports = {
  login,
  register,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers
};
