require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const port = process.env.GATEWAY_PORT || 3000;

// --- Service URLs ---
// These should come from .env in a real setup, especially for different environments
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const DOC_SERVICE_URL = process.env.DOC_SERVICE_URL || 'http://localhost:3002';
// Add other service URLs as they are developed
// const INCIDENT_SERVICE_URL = process.env.INCIDENT_SERVICE_URL || 'http://localhost:3003';

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes - configure appropriately for production
app.use(helmet()); // Basic security headers
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// --- Health Check ---
app.get('/gateway/health', (req, res) => {
    res.status(200).json({ message: 'API Gateway is running and healthy' });
});

// --- Proxy Routes ---

// Authentication Service
app.use('/api/auth', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: function (req) {
        return `/auth${req.url}`; // Prepends '/auth' to the path
    },
    proxyErrorHandler: function(err, res, next) {
        console.error('[Gateway Error - Auth Service]:', err.code || err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: 'Auth service is unavailable.' });
        }
        next(err);
    }
}));

// Document Service
app.use('/api/documents', proxy(DOC_SERVICE_URL, {
    proxyReqPathResolver: function (req) {
        return `/documents${req.url}`; // Prepends '/documents' to the path
    },
    proxyErrorHandler: function(err, res, next) {
        console.error('[Gateway Error - Document Service]:', err.code || err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: 'Document service is unavailable.' });
        }
        next(err);
    }
}));

// Example for Incident Service (when it's ready)
/*
app.use('/api/incidents', proxy(INCIDENT_SERVICE_URL, {
    proxyReqPathResolver: function (req) {
        return `/incidents${req.url}`;
    },
    proxyErrorHandler: function(err, res, next) {
        console.error('[Gateway Error - Incident Service]:', err.code || err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: 'Incident service is unavailable.' });
        }
        next(err);
    }
}));
*/

// --- Centralized Error Handling for Gateway Itself (e.g., route not found) ---
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found on API Gateway.' });
});

app.use((err, req, res, next) => {
    console.error('[API Gateway Global Error]:', err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'An unexpected error occurred on the API Gateway.',
        ...(process.env.NODE_ENV === 'development' && { errorDetails: err.stack })
    });
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`API Gateway listening on port ${port}`);
    console.log(`Proxying /api/auth to ${AUTH_SERVICE_URL}`);
    console.log(`Proxying /api/documents to ${DOC_SERVICE_URL}`);
    // console.log(`Proxying /api/incidents to ${INCIDENT_SERVICE_URL}`);
});
