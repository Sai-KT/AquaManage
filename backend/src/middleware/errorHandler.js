/**
 * Centralized Error Handling Middleware
 * Prevents stack trace leakages and provides consistent JSON error responses.
 */
export function errorHandler(err, req, res, _next) {
  console.error('[Server Error]:', {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    code: err.code,
  });

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // File filter error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.status || 500;
  const message = statusCode === 500
    ? 'An unexpected server error occurred. Please try again later.'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
}

export default errorHandler;
