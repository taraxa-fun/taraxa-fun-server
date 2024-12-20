import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
]);

const ALLOWED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif'
]);

export const upload = (req: Request, res: Response, next: NextFunction) => {
    const multerUpload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 512 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
                cb(new Error('File type not allowed. Use .png, .jpg, .jpeg or .gif'));
                return;
            }

            const ext = path.extname(file.originalname).toLowerCase();
            if (!ALLOWED_EXTENSIONS.has(ext)) {
                cb(new Error('File type not allowed. Use .png, .jpg, .jpeg ou .gif'));
                return;
            }

            cb(null, true);
        }
    }).single('image');

    multerUpload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size too large. Max 512KB allowed' });
                }
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};
