import multer from 'multer';

/**
 * Global error handler middleware
 * Should be the last middleware added in app.js
 */
const errorHandler = (err, req, res, next) => {
    console.error(err);

    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Multer file size / type errors → 400 with clear message
    if (err instanceof multer.MulterError) {
        status = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            const limits = { audio: '100MB', video: '500MB', image: '10MB' };
            const field = err.field || 'file';
            const limit = limits[field] || '100MB';
            message = `File too large. Maximum allowed size for ${field} is ${limit}.`;
        } else {
            message = `Upload error: ${err.message}`;
        }
    } else if (err.name === 'ValidationError') {
        status = 400;
        message = err.message;
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Invalid or missing token';
    } else if (err.code === '23505') {
        status = 409;
        message = 'Duplicate entry';
    }

    return res.status(status).json({
        status,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
};

export default errorHandler;
