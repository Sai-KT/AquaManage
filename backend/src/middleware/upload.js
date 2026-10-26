import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
const allowEphemeralUploads = process.env.ALLOW_EPHEMERAL_UPLOADS === 'true';
const hasCloudStorage = Boolean(process.env.CLOUDINARY_URL || process.env.S3_BUCKET);

const fileFilter = (req, file, cb) => {
  // Guard against silent evidence loss on temporary/ephemeral cloud filesystems (e.g. Render Free)
  if (isProduction && !hasCloudStorage && !allowEphemeralUploads) {
    return cb(
      new Error(
        'Media file uploads are disabled in this cloud demonstration environment to prevent permanent evidence loss on ephemeral filesystems. Please submit your report without attachments, or configure persistent cloud object storage.'
      )
    );
  }

  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    if (isProduction && allowEphemeralUploads && !hasCloudStorage) {
      console.warn(
        `[Storage Warning] Storing "${file.originalname}" in ephemeral filesystem. File will not persist across Render service restarts.`
      );
    }
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are supported.`));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

export default upload;
