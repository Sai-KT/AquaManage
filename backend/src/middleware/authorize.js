/**
 * Role-Based Authorization Middleware
 * Enforces specific role access (e.g. admin, student, maintenance).
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No active user session.',
      });
    }

    const userRole = req.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${userRole}" is not authorized for this resource.`,
      });
    }

    next();
  };
}

export default requireRole;
