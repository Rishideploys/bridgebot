const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');

// Mock document storage (in production, use a database)
const documents = new Map();
const documentIndex = new Map(); // Simple text search index

// Process uploaded document
async function processDocument(options) {
  const { file, title, description, category, userId } = options;

  try {
    const document = {
      id: generateDocumentId(),
      title,
      description,
      category,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      userId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Extract text based on file type
    let extractedText = '';
    
    switch (file.mimetype) {
      case 'application/pdf':
        extractedText = await extractPdfText(file.path);
        break;
      case 'text/plain':
      case 'text/markdown':
        extractedText = await fs.readFile(file.path, 'utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    // Process and chunk text for better search
    const chunks = chunkText(extractedText, 1000); // 1000 character chunks
    
    document.extractedText = extractedText;
    document.chunks = chunks;
    document.wordCount = extractedText.split(/\s+/).length;
    document.status = 'processed';
    document.processedAt = new Date().toISOString();

    // Save document
    const userDocs = documents.get(userId) || new Map();
    userDocs.set(document.id, document);
    documents.set(userId, userDocs);

    // Index for search
    indexDocument(document);

    console.log(`Document processed: ${document.id} (${document.wordCount} words)`);

    return document;

  } catch (error) {
    console.error('Document processing error:', error);
    
    // Clean up file on error
    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }

    throw error;
  }
}

// Extract text from PDF
async function extractPdfText(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Chunk text for better search and context
function chunkText(text, chunkSize = 1000, overlap = 100) {
  const chunks = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push({
        text: chunk,
        startIndex: i,
        wordCount: Math.min(chunkSize, words.length - i)
      });
    }
  }
  
  return chunks;
}

// Index document for search
function indexDocument(document) {
  const terms = extractSearchTerms(document.extractedText);
  
  terms.forEach(term => {
    if (!documentIndex.has(term)) {
      documentIndex.set(term, new Set());
    }
    documentIndex.get(term).add({
      documentId: document.id,
      userId: document.userId,
      title: document.title,
      category: document.category
    });
  });
}

// Extract search terms from text
function extractSearchTerms(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2)
    .filter(term => !isStopWord(term));
}

// Simple stop words list
function isStopWord(word) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);
  return stopWords.has(word);
}

// Search knowledge base
async function searchKnowledgeBase(query, userId, options = {}) {
  try {
    const { limit = 10, category } = options;
    const searchTerms = extractSearchTerms(query);
    const userDocs = documents.get(userId) || new Map();
    
    // Score documents based on term matches
    const documentScores = new Map();
    
    searchTerms.forEach(term => {
      const matchingDocs = documentIndex.get(term) || new Set();
      matchingDocs.forEach(docInfo => {
        if (docInfo.userId === userId) {
          const currentScore = documentScores.get(docInfo.documentId) || 0;
          documentScores.set(docInfo.documentId, currentScore + 1);
        }
      });
    });

    // Get top documents and find relevant chunks
    const results = [];
    const sortedDocs = Array.from(documentScores.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);

    for (const [documentId, score] of sortedDocs) {
      const doc = userDocs.get(documentId);
      if (!doc) continue;

      // Filter by category if specified
      if (category && doc.category !== category) continue;

      // Find most relevant chunks
      const relevantChunks = findRelevantChunks(doc.chunks, searchTerms, 3);

      results.push({
        document: {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category,
          fileName: doc.fileName,
          createdAt: doc.createdAt
        },
        score,
        relevantChunks,
        matchedTerms: searchTerms.filter(term => 
          doc.extractedText.toLowerCase().includes(term)
        )
      });
    }

    return results;

  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// Find most relevant text chunks
function findRelevantChunks(chunks, searchTerms, maxChunks = 3) {
  const chunkScores = chunks.map(chunk => {
    const chunkText = chunk.text.toLowerCase();
    const score = searchTerms.reduce((acc, term) => {
      const matches = (chunkText.match(new RegExp(term, 'g')) || []).length;
      return acc + matches;
    }, 0);
    
    return { ...chunk, score };
  });

  return chunkScores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .filter(chunk => chunk.score > 0);
}

// Get user documents
async function getDocuments(userId, options = {}) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;

    const userDocs = documents.get(userId) || new Map();
    let docArray = Array.from(userDocs.values());

    // Filter by category
    if (category) {
      docArray = docArray.filter(doc => doc.category === category);
    }

    // Sort documents
    docArray.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedDocs = docArray.slice(startIndex, startIndex + limit);

    // Remove extracted text from list view (too large)
    const cleanedDocs = paginatedDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      wordCount: doc.wordCount,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return cleanedDocs;

  } catch (error) {
    console.error('Get documents error:', error);
    throw error;
  }
}

// Delete document
async function deleteDocument(documentId, userId) {
  try {
    const userDocs = documents.get(userId) || new Map();
    const document = userDocs.get(documentId);

    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // Remove from storage
    userDocs.delete(documentId);
    documents.set(userId, userDocs);

    // Remove from search index
    removeFromIndex(documentId);

    // Delete physical file
    try {
      await fs.unlink(document.filePath);
    } catch (fileError) {
      console.error('File deletion error:', fileError);
    }

    console.log(`Document deleted: ${documentId}`);

    return { 
      success: true, 
      documentId,
      deletedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
}

// Remove document from search index
function removeFromIndex(documentId) {
  for (const [term, docSet] of documentIndex.entries()) {
    const toRemove = Array.from(docSet).filter(doc => doc.documentId === documentId);
    toRemove.forEach(doc => docSet.delete(doc));
    
    if (docSet.size === 0) {
      documentIndex.delete(term);
    }
  }
}

function generateDocumentId() {
  return 'doc_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

module.exports = {
  processDocument,
  searchKnowledgeBase,
  getDocuments,
  deleteDocument
};
