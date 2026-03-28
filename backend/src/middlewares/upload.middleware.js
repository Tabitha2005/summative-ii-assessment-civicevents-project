import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Utility to ensure the upload directory exists
const ensureFolderExists = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

// ---------- IMAGE UPLOAD (Events) ----------
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = 'uploads/events';
        ensureFolderExists(folder);
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
        return cb(new Error('Only image files are allowed (jpg, jpeg, png, gif)'), false);
    }
    cb(null, true);
};

export const uploadEventImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});


// ---------- VIDEO UPLOAD (Promos) ----------
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = 'uploads/promos';
        ensureFolderExists(folder);
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const videoFilter = (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.avi', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
        return cb(new Error('Only video files are allowed (mp4, mov, avi, mkv)'), false);
    }
    cb(null, true);
};

export const uploadPromoVideo = multer({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
});


// ---------- AUDIO UPLOAD (Announcements) ----------
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = 'uploads/announcements';
        ensureFolderExists(folder);
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const audioFilter = (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.m4a', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
        return cb(new Error('Only audio files are allowed (mp3, wav, m4a, ogg)'), false);
    }
    cb(null, true);
};

export const uploadAudio = multer({
    storage: audioStorage,
    fileFilter: audioFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});
