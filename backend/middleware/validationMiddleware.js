/**
 * Input Validation and Sanitization Middleware using express-validator
 */

const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Middleware that runs express-validator rules and formats any errors into standard response
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors: formattedErrors
    });
  };
};

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email or username is required')
    .isLength({ max: 150 }).withMessage('Email exceeds maximum length'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'instructor', 'student']).withMessage('Role must be admin, instructor, or student'),
  body('department')
    .optional()
    .isIn(['CWTS', 'LTS', 'ROTC', 'All', 'N/A']).withMessage('Invalid department')
];

/**
 * Validation rules for student creation and updates
 */
const studentValidation = [
  body('studentId')
    .trim()
    .notEmpty().withMessage('Student ID number is required')
    .isLength({ max: 50 }).withMessage('Student ID too long'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .escape(),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .escape(),
  body('department')
    .trim()
    .notEmpty().withMessage('NSTP component department is required')
    .isIn(['CWTS', 'LTS', 'ROTC']).withMessage('Department must be CWTS, LTS, or ROTC'),
  body('program')
    .trim()
    .notEmpty().withMessage('Academic degree program is required')
];

/**
 * Validation rules for grades submission
 */
const gradesValidation = [
  body('studentId')
    .optional()
    .trim(),
  body('semester')
    .optional()
    .isIn(['1st Semester', '2nd Semester', 'Summer']).withMessage('Invalid semester'),
  body('final_grade')
    .optional()
    .trim()
];

/**
 * Validation rules for report creation
 */
const reportValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Report title is required')
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isIn(['CWTS', 'LTS', 'ROTC', 'All']).withMessage('Invalid department'),
  body('description')
    .optional()
    .trim()
];

/**
 * Validation rules for password change
 */
const changePasswordValidation = [
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  studentValidation,
  gradesValidation,
  reportValidation,
  changePasswordValidation
};
