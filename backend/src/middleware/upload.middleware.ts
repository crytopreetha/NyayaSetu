import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors.js';

// Resolve secure storage directory
const STORAGE_DIR = path.resolve(process.cwd(), 'storage/documents');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// 15 MB maximum file size
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/octet-stream',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename to prevent directory traversal and illegal characters
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);

    const safeFilename = `${randomUUID()}_${Date.now()}_${baseName}${ext}`;
    cb(null, safeFilename);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new BadRequestError(
        `Unsupported file type '${ext}'. Supported formats are: PDF (.pdf), DOCX (.docx), and TXT (.txt).`
      )
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        `Unsupported MIME type '${file.mimetype}'. Please upload a valid PDF, DOCX, or TXT file.`
      )
    );
  }

  cb(null, true);
};

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
});
