const { sendApiRequest } = require('./apiService');

// Send chat message to AI model
async function sendChatMessage(options) {
  const {
    message,
    modelId,
    modelName,
    conversationId,
    context,
    temperature,
    maxTokens,
    userId
  } = options;

  try {
    // Add context to message if provided
    let enhancedMessage = message;
    if (context && context.documents) {
      enhancedMessage = `Context from knowledge base:\n${context.documents}\n\nUser question: ${message}`;
    }

    // Send request to AI API
    const response = await sendApiRequest(modelId, modelName, enhancedMessage, {
      temperature,
      maxTokens,
      context
    });

    // Log conversation (in production, save to database)
    const conversationEntry = {
      id: generateMessageId(),
      conversationId,
      userId,
      modelId,
      modelName,
      userMessage: message,
      aiResponse: response.content,
      context,
      usage: response.usage,
      timestamp: new Date().toISOString()
    };

    console.log('Chat logged:', {
      conversationId,
      modelId,
      tokens: response.usage
    });

    return {
      id: conversationEntry.id,
      content: response.content,
      model: response.model,
      usage: response.usage,
      conversationId,
      timestamp: conversationEntry.timestamp
    };

  } catch (error) {
    console.error('Chat service error:', error);
    
    // Provide fallback response for certain errors
    if (error.message.includes('API key not configured')) {
      return {
        content: `❌ **${modelId.toUpperCase()} API Key Required**\n\nTo use ${modelId} models, please configure your API key in the settings panel.\n\n**Steps:**\n1. Get your API key from the ${modelId} website\n2. Go to Settings > API Keys\n3. Add your ${modelId} API key\n4. Try your request again`,
        model: modelId,
        usage: null,
        error: true,
        timestamp: new Date().toISOString()
      };
    }

    if (error.message.includes('Rate limit') || error.message.includes('429')) {
      return {
        content: `⏳ **Rate Limit Reached**\n\nYou've hit the rate limit for ${modelId}. Please wait a moment before trying again.\n\n**Tip:** Consider using a different model or upgrading your API plan for higher limits.`,
        model: modelId,
        usage: null,
        error: true,
        timestamp: new Date().toISOString()
      };
    }

    throw error;
  }
}

// Generate conversation summary
async function generateConversationSummary(conversationId, userId) {
  try {
    // In production, fetch conversation history from database
    const mockHistory = [
      { role: 'user', content: 'How do I implement authentication in React?' },
      { role: 'assistant', content: 'Here are several approaches for implementing authentication in React...' }
    ];

    const summaryPrompt = `Please create a brief summary of this conversation:\n\n${
      mockHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
    }`;

    const response = await sendApiRequest('openai', 'gpt-3.5-turbo', summaryPrompt, {
      temperature: 0.3,
      maxTokens: 150
    });

    return {
      conversationId,
      summary: response.content,
      messageCount: mockHistory.length,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      conversationId,
      summary: 'Unable to generate summary',
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
}

// Get conversation history
async function getConversationHistory(conversationId, userId, options = {}) {
  try {
    const { limit = 50, offset = 0 } = options;

    // In production, fetch from database
    const mockHistory = [
      {
        id: 'msg_1',
        conversationId,
        role: 'user',
        content: 'Hello!',
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'msg_2',
        conversationId,
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        model: 'gpt-4o',
        timestamp: new Date().toISOString()
      }
    ];

    return {
      conversationId,
      messages: mockHistory.slice(offset, offset + limit),
      pagination: {
        total: mockHistory.length,
        limit,
        offset,
        hasMore: offset + limit < mockHistory.length
      }
    };

  } catch (error) {
    console.error('Get conversation history error:', error);
    throw error;
  }
}

// Delete conversation
async function deleteConversation(conversationId, userId) {
  try {
    // In production, delete from database
    console.log(`Deleting conversation ${conversationId} for user ${userId}`);

    return {
      success: true,
      conversationId,
      deletedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Delete conversation error:', error);
    throw error;
  }
}

// Export conversation in different formats
async function exportConversation(conversationId, userId, format = 'json') {
  try {
    const history = await getConversationHistory(conversationId, userId);

    switch (format) {
      case 'json':
        return {
          format: 'json',
          data: history,
          filename: `conversation_${conversationId}.json`
        };

      case 'markdown':
        const markdown = generateMarkdownExport(history);
        return {
          format: 'markdown',
          data: markdown,
          filename: `conversation_${conversationId}.md`
        };

      case 'txt':
        const text = generateTextExport(history);
        return {
          format: 'text',
          data: text,
          filename: `conversation_${conversationId}.txt`
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

  } catch (error) {
    console.error('Export conversation error:', error);
    throw error;
  }
}

function generateMarkdownExport(history) {
  let markdown = `# Conversation Export\n\n`;
  markdown += `**Conversation ID:** ${history.conversationId}\n`;
  markdown += `**Exported:** ${new Date().toISOString()}\n`;
  markdown += `**Messages:** ${history.messages.length}\n\n`;
  markdown += `---\n\n`;

  history.messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `## ${role}\n\n`;
    markdown += `${msg.content}\n\n`;
    if (msg.model) {
      markdown += `*Model: ${msg.model}*\n\n`;
    }
    markdown += `---\n\n`;
  });

  return markdown;
}

function generateTextExport(history) {
  let text = `CONVERSATION EXPORT\n`;
  text += `Conversation ID: ${history.conversationId}\n`;
  text += `Exported: ${new Date().toISOString()}\n`;
  text += `Messages: ${history.messages.length}\n\n`;
  text += `${'='.repeat(50)}\n\n`;

  history.messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    text += `[${role}]\n`;
    text += `${msg.content}\n\n`;
    if (msg.model) {
      text += `Model: ${msg.model}\n\n`;
    }
    text += `-`.repeat(30) + '\n\n';
  });

  return text;
}

function generateMessageId() {
  return 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

module.exports = {
  sendChatMessage,
  generateConversationSummary,
  getConversationHistory,
  deleteConversation,
  exportConversation
};
