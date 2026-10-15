/**
 * =============================================================================
 * Auth Routes (backend/src/routes/auth.routes.js)
 * Authentication, JWT Issuance, & User Session Management
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_fincommerce_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Middleware: Verify Authorization JWT Token
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'UNAUTHORIZED',
            message: 'Access token required in Authorization header.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: 'Invalid or expired access token.'
            });
        }
        req.user = user;
        next();
    });
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new merchant/user account
 */
router.post('/register', async (req, res, next) => {
    const { email, password, fullName, role = 'USER' } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'Email and password are required.'
        });
    }

    try {
        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'USER_EXISTS',
                message: 'An account with this email address already exists.'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const query = `
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, full_name, role, created_at;
        `;
        const { rows } = await db.query(query, [email, hashedPassword, fullName || '', role]);
        const newUser = rows[0];

        // Generate JWT Token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(201).json({
            status: 'SUCCESS',
            message: 'Account registered successfully.',
            token,
            user: newUser
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 */
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'BAD_REQUEST',
            message: 'Email and password are required.'
        });
    }

    try {
        // Find user by email
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.'
            });
        }

        const user = rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.'
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Authentication successful.',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                createdAt: user.created_at
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 */
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'USER_NOT_FOUND',
                message: 'Authenticated user profile not found.'
            });
        }

        return res.status(200).json({
            status: 'SUCCESS',
            user: rows[0]
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;