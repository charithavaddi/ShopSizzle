/**
 * =============================================================================
 * Auth Middleware (backend/src/middleware/auth.js)
 * JWT Verification & Role-Based Access Control (RBAC)
 * =============================================================================
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_fincommerce_key_2026';

/**
 * Middleware: Verifies Bearer JWT token from incoming request headers
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({
            error: 'UNAUTHORIZED',
            message: 'Access denied. Bearer authorization token is missing.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: 'Invalid, expired, or malformed authentication token.'
            });
        }

        // Attach decoded user payload (id, email, role) to Express Request object
        req.user = decodedUser;
        next();
    });
}

/**
 * Middleware Factory: Enforces Role-Based Access Control (RBAC)
 * @param {...string} allowedRoles - Permitted user roles (e.g., 'ADMIN', 'MERCHANT')
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'User authentication required prior to authorization.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles
};