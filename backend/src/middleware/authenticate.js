/**
 * Authentication Middleware
 * Enforces valid active session for protected endpoints.
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in to proceed.',
  });
}

export default requireAuth;
