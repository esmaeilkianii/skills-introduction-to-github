const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        req.user = user; // Add decoded user payload to request object
        next();
    });
};

const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Forbidden: User role not available' });
        }

        const userRole = req.user.role; // Assuming role is part of JWT payload
        if (Array.isArray(allowedRoles) && allowedRoles.includes(userRole)) {
            next();
        } else if (typeof allowedRoles === 'string' && allowedRoles === userRole) {
            next();
        }
        else {
            return res.status(403).json({ message: `Forbidden: Role '${userRole}' is not authorized` });
        }
    };
};

module.exports = {
    authenticateToken,
    authorizeRole,
};
