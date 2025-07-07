const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const registerUser = async (req, res) => {
    const { username, password, email, first_name, last_name, role_name } = req.body;

    // Basic validation
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required.' });
    }

    try {
        // Check if user or email already exists
        const existingUser = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Determine role_id
        let roleId = null;
        if (role_name) {
            const roleResult = await db.query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
            if (roleResult.rows.length > 0) {
                roleId = roleResult.rows[0].role_id;
            } else {
                // Optionally, handle role not found (e.g., assign a default or return error)
                console.warn(`Role '${role_name}' not found. User will be created without a specific role or with a default.`);
                // For now, let's find a default 'operator' role or leave it null if not found
                const defaultRole = await db.query('SELECT role_id FROM roles WHERE role_name = $1', ['operator']);
                if (defaultRole.rows.length > 0) roleId = defaultRole.rows[0].role_id;
            }
        } else {
            // Default to 'operator' if no role_name is provided
            const defaultRole = await db.query('SELECT role_id FROM roles WHERE role_name = $1', ['operator']);
            if (defaultRole.rows.length > 0) roleId = defaultRole.rows[0].role_id;
        }


        // Store user in database
        const newUser = await db.query(
            'INSERT INTO users (username, password_hash, email, first_name, last_name, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, username, email, role_id, created_at',
            [username, password_hash, email, first_name, last_name, roleId]
        );

        res.status(201).json({
            message: 'User registered successfully.',
            user: newUser.rows[0],
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error during user registration.' });
    }
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Find user in database
        const userResult = await db.query(
            'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.username = $1 AND u.is_active = TRUE',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or user inactive.' });
        }

        const user = userResult.rows[0];

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT token
        const payload = {
            userId: user.user_id,
            username: user.username,
            role: user.role_name, // Include role_name in JWT
            // Add other relevant info to payload if needed
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        // Update last_login timestamp
        await db.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

        res.status(200).json({
            message: 'Login successful.',
            token: token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role_name,
            },
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// TODO: Implement other controller functions:
// - manageRoles (CRUD for roles)
// - managePermissions (CRUD for permissions)
// - assignPermissionsToRole
// - getUserProfile
// - updateUserProfile
// - changePassword
// - listUsers (admin)
// - getUserById (admin)
// - updateUserById (admin)
// - deactivateUser (admin)

module.exports = {
    registerUser,
    loginUser,
};
