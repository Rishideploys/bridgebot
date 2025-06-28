const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const { auth } = require('../middleware/auth');

// Built-in prompt templates
const BUILTIN_TEMPLATES = {
  'code-review': {
    id: 'code-review',
    name: 'Code Review',
    category: 'development',
    description: 'Review code for best practices and improvements',
    prompt: `Please review the following code and provide feedback on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance improvements
4. Security considerations
5. Readability and maintainability

Code to review:
{code}`,
    variables: ['code'],
    isBuiltin: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  'explain-concept': {
    id: 'explain-concept',
    name: 'Explain Concept',
    category: 'education',
    description: 'Explain a complex concept in simple terms',
    prompt: `Please explain the concept of "{concept}" in simple terms that a {level} can understand. Include:
1. A clear definition
2. Real-world examples
3. Why it's important
4. Common misconceptions
5. Related concepts

Make the explanation engaging and easy to follow.`,
    variables: ['concept', 'level'],
    isBuiltin: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  'debug-help': {
    id: 'debug-help',
    name: 'Debug Help',
    category: 'development',
    description: 'Help debug code issues',
    prompt: `I'm having trouble with this code. Please help me debug it:

**Problem Description:**
{problem}

**Code:**
{code}

**Error Message (if any):**
{error}

Please provide:
1. Likely causes of the issue
2. Step-by-step debugging approach
3. Suggested fixes
4. Prevention tips for the future`,
    variables: ['problem', 'code', 'error'],
    isBuiltin: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  'summarize-document': {
    id: 'summarize-document',
    name: 'Summarize Document',
    category: 'productivity',
    description: 'Create a comprehensive summary of a document',
    prompt: `Please create a comprehensive summary of the following document:

{document}

Include:
1. **Main Points** - Key ideas and arguments
2. **Key Details** - Important facts and figures
3. **Conclusions** - Main takeaways
4. **Action Items** - Any tasks or recommendations mentioned
5. **Questions** - Any unclear points or areas needing clarification

Format the summary in a clear, structured way.`,
    variables: ['document'],
    isBuiltin: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  'api-documentation': {
    id: 'api-documentation',
    name: 'API Documentation',
    category: 'development',
    description: 'Generate API documentation',
    prompt: `Please create comprehensive API documentation for the following endpoint:

**Endpoint:** {endpoint}
**Method:** {method}
**Description:** {description}

Include:
1. **Overview** - What this endpoint does
2. **Parameters** - Request parameters with types and descriptions
3. **Request Example** - Sample request with proper formatting
4. **Response Example** - Sample response with status codes
5. **Error Handling** - Possible error responses
6. **Usage Notes** - Important implementation details

Make it clear and developer-friendly.`,
    variables: ['endpoint', 'method', 'description'],
    isBuiltin: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  'meeting-notes': {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    category: 'productivity',
    description: 'Structure and organize meeting notes',
    prompt: `Please organize and structure these meeting notes:

{notes}

Format them with:
1. **Meeting Overview**
   - Date and participants
   - Main purpose/agenda

2. **Key Discussions**
   - Main topics discussed
   - Important points raised

3. **Decisions Made**
   - Clear list of decisions
   - Who is responsible for what

4. **Action Items**
   - Specific tasks
   - Assigned person
   - Due dates (if mentioned)

5. **Next Steps**
   - Follow-up meetings
   - Outstanding issues

Make it professional and easy to reference later.`,
    variables: ['notes'],
    isBuiltin: true,
    createdAt: '2025-01-01T00:00:00Z'
  }
};

// Mock user templates storage
const userTemplates = new Map();

// Get all templates
router.get('/', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const userId = req.user?.id;

    // Get user's custom templates
    const customTemplates = userTemplates.get(userId) || {};

    // Combine builtin and user templates
    const allTemplates = { ...BUILTIN_TEMPLATES, ...customTemplates };

    // Filter by category if specified
    let filteredTemplates = Object.values(allTemplates);
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.prompt.toLowerCase().includes(searchLower)
      );
    }

    // Get unique categories
    const categories = [...new Set(Object.values(allTemplates).map(t => t.category))];

    res.json({
      templates: filteredTemplates,
      categories,
      total: filteredTemplates.length,
      filters: { category, search }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

// Get specific template
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check builtin templates first
    let template = BUILTIN_TEMPLATES[id];

    // If not found, check user templates
    if (!template) {
      const userTemplateMap = userTemplates.get(userId) || {};
      template = userTemplateMap[id];
    }

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        templateId: id
      });
    }

    res.json(template);

  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      error: 'Failed to fetch template',
      message: error.message
    });
  }
});

// Create new template
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, prompt, variables } = req.body;
    const userId = req.user?.id;

    if (!name || !prompt) {
      return res.status(400).json({
        error: 'Name and prompt are required'
      });
    }

    const template = {
      id: generateTemplateId(),
      name,
      description: description || '',
      category: category || 'custom',
      prompt,
      variables: variables || [],
      isBuiltin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId
    };

    // Save to user templates
    const userTemplateMap = userTemplates.get(userId) || {};
    userTemplateMap[template.id] = template;
    userTemplates.set(userId, userTemplateMap);

    res.status(201).json({
      success: true,
      template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      error: 'Failed to create template',
      message: error.message
    });
  }
});

// Update template
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, prompt, variables } = req.body;
    const userId = req.user?.id;

    // Check if template exists and belongs to user
    const userTemplateMap = userTemplates.get(userId) || {};
    const template = userTemplateMap[id];

    if (!template) {
      return res.status(404).json({
        error: 'Template not found or not accessible'
      });
    }

    if (template.isBuiltin) {
      return res.status(403).json({
        error: 'Cannot modify builtin templates'
      });
    }

    // Update template
    const updatedTemplate = {
      ...template,
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(prompt && { prompt }),
      ...(variables && { variables }),
      updatedAt: new Date().toISOString()
    };

    userTemplateMap[id] = updatedTemplate;
    userTemplates.set(userId, userTemplateMap);

    res.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      error: 'Failed to update template',
      message: error.message
    });
  }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const userTemplateMap = userTemplates.get(userId) || {};
    const template = userTemplateMap[id];

    if (!template) {
      return res.status(404).json({
        error: 'Template not found or not accessible'
      });
    }

    if (template.isBuiltin) {
      return res.status(403).json({
        error: 'Cannot delete builtin templates'
      });
    }

    delete userTemplateMap[id];
    userTemplates.set(userId, userTemplateMap);

    res.json({
      success: true,
      message: 'Template deleted successfully',
      templateId: id
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      message: error.message
    });
  }
});

// Render template with variables
router.post('/:id/render', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;
    const userId = req.user?.id;

    // Get template
    let template = BUILTIN_TEMPLATES[id];
    if (!template) {
      const userTemplateMap = userTemplates.get(userId) || {};
      template = userTemplateMap[id];
    }

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        templateId: id
      });
    }

    // Render template with variables
    let renderedPrompt = template.prompt;
    
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        renderedPrompt = renderedPrompt.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    res.json({
      templateId: id,
      templateName: template.name,
      variables: variables || {},
      renderedPrompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Render template error:', error);
    res.status(500).json({
      error: 'Failed to render template',
      message: error.message
    });
  }
});

function generateTemplateId() {
  return 'template_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

module.exports = router;
