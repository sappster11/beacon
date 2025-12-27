import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Allowed file extensions for profile pictures (images only)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: profile-{timestamp}-{random}.ext
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `profile-${timestamp}-${randomString}${ext}`;

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
export const profilePictureUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Deletes a profile picture file from the filesystem
 */
export function deleteProfilePicture(filename: string): void {
  try {
    const filePath = path.join(__dirname, '../../uploads/profile-pictures', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete profile picture:', error);
    // Don't throw - file deletion failures shouldn't block the request
  }
}

/**
 * Extracts filename from profilePicture URL
 */
export function getFilenameFromUrl(url: string): string | null {
  const match = url.match(/\/profile-pictures\/([^/]+)$/);
  return match ? match[1] : null;
}
