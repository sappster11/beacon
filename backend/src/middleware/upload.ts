import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Allowed file extensions for transcripts
const ALLOWED_EXTENSIONS = ['.txt', '.doc', '.docx', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/transcripts');

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: transcript-{timestamp}-{random}.ext
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `transcript-${timestamp}-${randomString}${ext}`;

    cb(null, filename);
  },
});

// File filter to validate file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

// Create multer upload instance
export const transcriptUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Deletes a transcript file from the filesystem
 */
export function deleteTranscriptFile(filename: string): void {
  try {
    const filePath = path.join(__dirname, '../../uploads/transcripts', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete transcript file:', error);
    // Don't throw - file deletion failures shouldn't block the request
  }
}

/**
 * Extracts filename from transcriptFileUrl
 */
export function getFilenameFromUrl(url: string): string | null {
  const match = url.match(/\/transcripts\/([^/]+)$/);
  return match ? match[1] : null;
}
