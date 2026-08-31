/**
 * File Upload Middleware using Multer
 * Handles file size limits and MIME-type restrictions safely in memory / disk
 */

const multer = require('multer');
const { AppError } = require('./errorHandler');

// Allowed file types for documents, images, and audio attachments
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'audio/webm',
  'audio/ogg',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4'
];

// Memory Storage (for direct upload to Cloudinary or database buffer)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file format (${file.mimetype}). Allowed types: PDF, DOCX, XLSX, Images, and Audio.`, 400), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max file size
  },
  fileFilter
});

module.exports = upload;
