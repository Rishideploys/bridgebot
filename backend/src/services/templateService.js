// Template service for managing prompt templates

// Get template by ID
async function getTemplate(templateId) {
  // This would typically query a database
  // For now, return mock data
  
  const templates = {
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
      usage: 150,
      rating: 4.8,
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
      usage: 89,
      rating: 4.6,
      createdAt: '2025-01-01T00:00:00Z'
    }
  };

  return templates[templateId] || null;
}

// Render template with variables
function renderTemplate(template, variables = {}) {
  if (!template) {
    throw new Error('Template not found');
  }

  let renderedPrompt = template.prompt;
  
  // Replace variable placeholders
  template.variables.forEach(variable => {
    const placeholder = `{${variable}}`;
    const value = variables[variable] || `[${variable}]`;
    renderedPrompt = renderedPrompt.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    templateId: template.id,
    templateName: template.name,
    variables,
    renderedPrompt,
    missingVariables: template.variables.filter(v => !variables[v]),
    timestamp: new Date().toISOString()
  };
}

// Validate template structure
function validateTemplate(template) {
  const errors = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!template.prompt || template.prompt.trim().length === 0) {
    errors.push('Template prompt is required');
  }

  if (!template.category || template.category.trim().length === 0) {
    errors.push('Template category is required');
  }

  // Check for variables in prompt
  const promptVariables = extractVariablesFromPrompt(template.prompt);
  const declaredVariables = template.variables || [];
  
  // Find undeclared variables
  const undeclaredVars = promptVariables.filter(v => !declaredVariables.includes(v));
  if (undeclaredVars.length > 0) {
    errors.push(`Undeclared variables found in prompt: ${undeclaredVars.join(', ')}`);
  }

  // Find unused declared variables
  const unusedVars = declaredVariables.filter(v => !promptVariables.includes(v));
  if (unusedVars.length > 0) {
    errors.push(`Declared variables not used in prompt: ${unusedVars.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    variables: {
      declared: declaredVariables,
      found: promptVariables,
      undeclared: undeclaredVars,
      unused: unusedVars
    }
  };
}

// Extract variables from prompt text
function extractVariablesFromPrompt(prompt) {
  const variableRegex = /\{(\w+)\}/g;
  const variables = new Set();
  let match;

  while ((match = variableRegex.exec(prompt)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

// Get template suggestions based on query
function getTemplateSuggestions(query, limit = 5) {
  // Mock suggestions based on query
  const allTemplates = [
    { id: 'code-review', name: 'Code Review', category: 'development', description: 'Review code for best practices' },
    { id: 'explain-concept', name: 'Explain Concept', category: 'education', description: 'Explain complex concepts simply' },
    { id: 'debug-help', name: 'Debug Help', category: 'development', description: 'Help debug code issues' },
    { id: 'summarize-document', name: 'Summarize Document', category: 'productivity', description: 'Create document summaries' },
    { id: 'api-documentation', name: 'API Documentation', category: 'development', description: 'Generate API docs' }
  ];

  if (!query) {
    return allTemplates.slice(0, limit);
  }

  const queryLower = query.toLowerCase();
  const scored = allTemplates.map(template => {
    let score = 0;
    
    // Name match
    if (template.name.toLowerCase().includes(queryLower)) score += 3;
    
    // Category match
    if (template.category.toLowerCase().includes(queryLower)) score += 2;
    
    // Description match
    if (template.description.toLowerCase().includes(queryLower)) score += 1;

    return { ...template, score };
  });

  return scored
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Get popular templates
function getPopularTemplates(limit = 10) {
  // Mock popular templates with usage stats
  return [
    { id: 'code-review', usage: 150, rating: 4.8 },
    { id: 'explain-concept', usage: 89, rating: 4.6 },
    { id: 'debug-help', usage: 76, rating: 4.7 },
    { id: 'summarize-document', usage: 65, rating: 4.5 },
    { id: 'api-documentation', usage: 54, rating: 4.4 }
  ].slice(0, limit);
}

// Track template usage
function trackTemplateUsage(templateId, userId) {
  // In production, this would update database usage stats
  console.log(`Template usage tracked: ${templateId} by user ${userId}`);
  
  return {
    templateId,
    userId,
    usedAt: new Date().toISOString()
  };
}

module.exports = {
  getTemplate,
  renderTemplate,
  validateTemplate,
  extractVariablesFromPrompt,
  getTemplateSuggestions,
  getPopularTemplates,
  trackTemplateUsage
};
