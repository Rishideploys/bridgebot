const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  processDocument, 
  searchKnowledgeBase, 
  getDocuments,
  deleteDocument 
} = require('../services/knowledgeService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, TXT, and MD files
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, TXT, MD, DOC, or DOCX files.'));
    }
  }
});

// Upload document to knowledge base
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        supportedTypes: ['pdf', 'txt', 'md', 'doc', 'docx']
      });
    }

    const { title, description, category } = req.body;
    const userId = req.user?.id;

    const document = await processDocument({
      file: req.file,
      title: title || req.file.originalname,
      description: description || '',
      category: category || 'general',
      userId
    });

    res.status(201).json({
      success: true,
      document,
      message: 'Document uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if processing failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to process document',
      message: error.message
    });
  }
});

// Search knowledge base
router.get('/search', auth, async (req, res) => {
  try {
    const { q: query, limit = 10, category } = req.query;
    const userId = req.user?.id;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
        parameter: 'q'
      });
    }

    const results = await searchKnowledgeBase(query, userId, {
      limit: parseInt(limit),
      category
    });

    res.json({
      query,
      results,
      totalResults: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Get all documents
router.get('/documents', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    const userId = req.user?.id;

    const documents = await getDocuments(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      sortBy,
      sortOrder
    });

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: documents.length
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: error.message
    });
  }
});

// Get document details
router.get('/documents/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Mock document data for now
    const document = {
      id,
      title: 'Sample Document',
      description: 'A sample document for testing',
      category: 'general',
      fileName: 'sample.pdf',
      fileSize: 1024000,
      pageCount: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processed',
      extractedText: 'This is the extracted text from the document...'
    };

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        documentId: id
      });
    }

    res.json(document);

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
      message: error.message
    });
  }
});

// Delete document
router.delete('/documents/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await deleteDocument(id, userId);

    if (!result.success) {
      return res.status(404).json({
        error: 'Document not found',
        documentId: id
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
      documentId: id
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// Get knowledge base statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Mock statistics
    const stats = {
      totalDocuments: 12,
      totalSize: 45678000, // bytes
      categories: {
        'research': 5,
        'documentation': 4,
        'general': 3
      },
      recentActivity: [
        {
          action: 'upload',
          document: 'API Documentation.pdf',
          timestamp: new Date().toISOString()
        },
        {
          action: 'search',
          query: 'authentication methods',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      storageUsed: 45678000,
      storageLimit: 1000000000 // 1GB
    };

    res.json(stats);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Update document metadata
router.put('/documents/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const userId = req.user?.id;

    // Mock update
    const updatedDocument = {
      id,
      title: title || 'Updated Document',
      description: description || '',
      category: category || 'general',
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      document: updatedDocument,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      error: 'Failed to update document',
      message: error.message
    });
  }
});

module.exports = router;
