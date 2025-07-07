const db = require('../config/db');
const path = require('path');
const fs = require('fs'); // Required for file system operations like ensuring download path exists or deleting files

// Assuming UPLOAD_PATH is configured in .env and accessible
const UPLOAD_DIR = process.env.UPLOAD_PATH || './uploads/documents';

const uploadDocument = async (req, res) => {
    const { title, description, category_name, tags, uploader_user_id, confidentiality_level, review_due_date, retention_period_days } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    if (!title || !uploader_user_id) {
        // For now, uploader_user_id is assumed to come from the request body.
        // In a real system, this would come from the authenticated user's JWT token.
        return res.status(400).json({ message: 'Title and uploader_user_id are required.' });
    }

    const { filename: file_name, path: storage_path, mimetype: mime_type, size: file_size_bytes } = req.file;

    try {
        let categoryId = null;
        if (category_name) {
            const catResult = await db.query('SELECT category_id FROM document_categories WHERE name = $1', [category_name]);
            if (catResult.rows.length > 0) {
                categoryId = catResult.rows[0].category_id;
            } else {
                // Optionally create category if it doesn't exist, or return error
                console.warn(`Category '${category_name}' not found. Document will be uploaded without a category.`);
            }
        }

        const newDoc = await db.query(
            `INSERT INTO documents
             (title, description, file_name, storage_path, mime_type, file_size_bytes, uploader_user_id, category_id, confidentiality_level, review_due_date, retention_period_days, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved')
             RETURNING *`, // 'approved' or 'pending_review' depending on workflow
            [title, description, file_name, storage_path, mime_type, file_size_bytes, uploader_user_id, categoryId, confidentiality_level, review_due_date ? new Date(review_due_date) : null, retention_period_days ? parseInt(retention_period_days) : null]
        );

        const docId = newDoc.rows[0].doc_id;

        // Handle tags
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
            for (const tagName of tagArray) {
                if (tagName) {
                    let tagResult = await db.query('SELECT tag_id FROM document_tags WHERE name = $1', [tagName]);
                    let tagId;
                    if (tagResult.rows.length > 0) {
                        tagId = tagResult.rows[0].tag_id;
                    } else {
                        // Create tag if it doesn't exist
                        tagResult = await db.query('INSERT INTO document_tags (name) VALUES ($1) RETURNING tag_id', [tagName]);
                        tagId = tagResult.rows[0].tag_id;
                    }
                    await db.query('INSERT INTO document_tag_mappings (doc_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [docId, tagId]);
                }
            }
        }

        // Create initial version entry
        await db.query(
            `INSERT INTO document_versions (doc_id, version_number, file_name, storage_path, mime_type, file_size_bytes, uploader_user_id, change_description)
             VALUES ($1, 1, $2, $3, $4, $5, $6, 'Initial upload')`,
            [docId, file_name, storage_path, mime_type, file_size_bytes, uploader_user_id]
        );


        res.status(201).json({ message: 'Document uploaded successfully.', document: newDoc.rows[0] });
    } catch (error) {
        console.error('Error uploading document:', error);
        // If error, try to delete the uploaded file to prevent orphans
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
            });
        }
        res.status(500).json({ message: 'Server error during document upload.' });
    }
};

const getDocumentById = async (req, res) => {
    const { docId } = req.params;
    try {
        const docResult = await db.query(
            `SELECT d.*, c.name as category_name, u.username as uploader_username
             FROM documents d
             LEFT JOIN document_categories c ON d.category_id = c.category_id
             LEFT JOIN users u ON d.uploader_user_id = u.user_id
             WHERE d.doc_id = $1`, [docId]
        );

        if (docResult.rows.length === 0) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        const document = docResult.rows[0];

        // Get tags for the document
        const tagsResult = await db.query(
            `SELECT t.name
             FROM document_tags t
             JOIN document_tag_mappings dtm ON t.tag_id = dtm.tag_id
             WHERE dtm.doc_id = $1`, [docId]
        );
        document.tags = tagsResult.rows.map(row => row.name);

        // Get versions for the document
        const versionsResult = await db.query(
            `SELECT dv.version_id, dv.version_number, dv.file_name, dv.change_description, dv.created_at, u.username as version_uploader_username
             FROM document_versions dv
             LEFT JOIN users u ON dv.uploader_user_id = u.user_id
             WHERE dv.doc_id = $1 ORDER BY dv.version_number DESC`, [docId]
        );
        document.versions = versionsResult.rows;


        res.status(200).json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: 'Server error fetching document.' });
    }
};

const downloadDocumentFile = async (req, res) => {
    const { docId, versionNumber } = req.params; // versionNumber is optional

    try {
        let fileMetadata;
        if (versionNumber) {
            const versionResult = await db.query(
                'SELECT storage_path, file_name, mime_type FROM document_versions WHERE doc_id = $1 AND version_number = $2',
                [docId, parseInt(versionNumber)]
            );
            if (versionResult.rows.length === 0) {
                return res.status(404).json({ message: 'Document version not found.' });
            }
            fileMetadata = versionResult.rows[0];
        } else {
            // Download current version from documents table
            const docResult = await db.query(
                'SELECT storage_path, file_name, mime_type FROM documents WHERE doc_id = $1',
                [docId]
            );
            if (docResult.rows.length === 0) {
                return res.status(404).json({ message: 'Document not found.' });
            }
            fileMetadata = docResult.rows[0];
        }

        const filePath = path.resolve(fileMetadata.storage_path); // Use absolute path

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found at path: ${filePath} for docId ${docId}`);
            return res.status(404).json({ message: 'File not found on server.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.file_name}"`);
        if(fileMetadata.mime_type) {
            res.setHeader('Content-Type', fileMetadata.mime_type);
        } else {
            res.setHeader('Content-Type', 'application/octet-stream'); // Generic binary type
        }

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading document file:', error);
        res.status(500).json({ message: 'Server error during file download.' });
    }
};


const listDocuments = async (req, res) => {
    // Basic listing, TODO: Add filtering, pagination, sorting, searching
    try {
        const docsResult = await db.query(
            `SELECT d.doc_id, d.title, d.status, d.current_version_number, d.updated_at,
                    c.name as category_name, u.username as uploader_username
             FROM documents d
             LEFT JOIN document_categories c ON d.category_id = c.category_id
             LEFT JOIN users u ON d.uploader_user_id = u.user_id
             ORDER BY d.updated_at DESC` // Example sorting
        );
        res.status(200).json(docsResult.rows);
    } catch (error) {
        console.error('Error listing documents:', error);
        res.status(500).json({ message: 'Server error listing documents.' });
    }
};

// TODO: Implement updateDocument, deleteDocument (archive), manageVersions, manageWorkflows

module.exports = {
    uploadDocument,
    getDocumentById,
    downloadDocumentFile,
    listDocuments,
};
