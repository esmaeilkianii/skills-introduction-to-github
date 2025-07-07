const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Multer for file uploads
// Ensure UPLOAD_PATH is defined in .env or use a default
const uploadDir = process.env.UPLOAD_PATH || './uploads/documents';

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename, add timestamp to avoid conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Example: 100MB limit
});

// --- Document Routes ---
// For these routes, proper authentication and authorization middleware from auth-service (via API gateway) will be needed.
// For now, placeholders.

// POST /documents/upload - Upload a new document
router.post('/upload', upload.single('documentFile'), docController.uploadDocument);

// GET /documents - List all documents (with filters)
router.get('/', docController.listDocuments);

// GET /documents/:docId - Get a specific document's metadata
router.get('/:docId', docController.getDocumentById);

// GET /documents/:docId/download - Download a specific document file (current version)
router.get('/:docId/download', docController.downloadDocumentFile);

// GET /documents/:docId/versions/:versionNumber/download - Download a specific version of a document file
router.get('/:docId/versions/:versionNumber/download', docController.downloadDocumentFile);

// PUT /documents/:docId - Update document metadata
router.put('/:docId', (req, res) => {
    // TODO: Implement document metadata update
    const { docId } = req.params;
    res.status(501).json({ message: `Updating document ${docId} not yet implemented.` });
});

// DELETE /documents/:docId - Archive/delete a document
router.delete('/:docId', (req, res) => {
    // TODO: Implement document deletion (soft delete preferred)
    const { docId } = req.params;
    res.status(501).json({ message: `Deleting document ${docId} not yet implemented.` });
});


// --- Versioning Routes (example) ---
router.get('/:docId/versions', (req, res) => {
    const { docId } = req.params;
    res.status(501).json({ message: `Listing versions for doc ${docId} not implemented.` });
});

router.post('/:docId/versions', upload.single('documentFile'), (req, res) => {
    // TODO: Upload a new version of an existing document
    const { docId } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded for new version.' });
    }
    res.status(501).json({ message: `Uploading new version for doc ${docId} not implemented.`, file: req.file });
});


// --- Workflow Routes (example) ---
router.post('/:docId/workflows/start', (req, res) => {
    const { docId } = req.params;
    // Body might contain workflow type, assigned reviewers etc.
    res.status(501).json({ message: `Starting workflow for doc ${docId} not implemented.` });
});

router.put('/workflows/:workflowId/step/:stepId', (req, res) => {
    const { workflowId, stepId } = req.params;
    // Body might contain approval/rejection status, comments
    res.status(501).json({ message: `Updating workflow ${workflowId}, step ${stepId} not implemented.` });
});


module.exports = router;
