const express = require('express');
const router = express.Router();
const { sendChatMessage } = require('../services/chatService');
const { auth } = require('../middleware/auth');

// Send chat message to AI model
router.post('/send', auth, async (req, res) => {
  try {
    const { 
      message, 
      modelId, 
      modelName, 
      conversationId, 
      context,
      temperature = 0.7,
      maxTokens = 2000 
    } = req.body;

    if (!message || !modelId) {
      return res.status(400).json({
        error: 'Message and modelId are required',
        received: { message: !!message, modelId: !!modelId }
      });
    }

    // Check if this is a command
    if (message.startsWith('@')) {
      const result = await handleCommand(message, req.user, { modelId, context });
      return res.json(result);
    }

    const response = await sendChatMessage({
      message,
      modelId,
      modelName,
      conversationId,
      context,
      temperature,
      maxTokens,
      userId: req.user?.id
    });

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      modelUsed: modelId
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    // Handle specific API errors
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or missing API key',
        modelId: req.body.modelId
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: error.retryAfter || 60
      });
    }

    res.status(500).json({
      error: 'Chat request failed',
      message: error.message,
      modelId: req.body.modelId
    });
  }
});

// Handle special commands
async function handleCommand(command, user, options) {
  const [cmd, ...args] = command.slice(1).split(' ');
  
  switch (cmd.toLowerCase()) {
    case 'bridgebot':
      return await handleBridgeBotCommand(args, user, options);
    
    case 'gpt':
      return await handleGptCommand(args, user, options);
    
    case 'claude':
      return await handleClaudeCommand(args, user, options);
    
    case 'kb':
    case 'knowledge':
      return await handleKnowledgeCommand(args, user, options);
    
    case 'template':
      return await handleTemplateCommand(args, user, options);
    
    case 'help':
      return getCommandHelp();
    
    default:
      return {
        success: false,
        error: `Unknown command: ${cmd}`,
        availableCommands: ['bridgebot', 'gpt', 'claude', 'kb', 'template', 'help']
      };
  }
}

async function handleBridgeBotCommand(args, user, options) {
  const action = args[0];
  const query = args.slice(1).join(' ');
  
  switch (action) {
    case 'run':
      // Execute a BridgeBot specific workflow
      const response = await sendChatMessage({
        message: `Execute workflow: ${query}`,
        modelId: 'bridgebot',
        modelName: 'bridgebot-tutor',
        userId: user?.id,
        context: { ...options.context, workflow: true }
      });
      
      return {
        success: true,
        type: 'workflow',
        response,
        command: `bridgebot run ${query}`
      };
    
    default:
      return {
        success: false,
        error: 'BridgeBot commands: run <workflow_name>'
      };
  }
}

async function handleGptCommand(args, user, options) {
  const action = args[0];
  const query = args.slice(1).join(' ');
  
  const response = await sendChatMessage({
    message: `${action}: ${query}`,
    modelId: 'openai',
    modelName: 'gpt-4o',
    userId: user?.id,
    context: options.context
  });
  
  return {
    success: true,
    type: 'gpt_command',
    response,
    command: `gpt ${action} ${query}`
  };
}

async function handleClaudeCommand(args, user, options) {
  const action = args[0];
  const query = args.slice(1).join(' ');
  
  const response = await sendChatMessage({
    message: `${action}: ${query}`,
    modelId: 'claude',
    modelName: 'claude-3-sonnet-20240229',
    userId: user?.id,
    context: options.context
  });
  
  return {
    success: true,
    type: 'claude_command',
    response,
    command: `claude ${action} ${query}`
  };
}

async function handleKnowledgeCommand(args, user, options) {
  const { searchKnowledgeBase } = require('../services/knowledgeService');
  
  const action = args[0];
  const query = args.slice(1).join(' ');
  
  if (action === 'search') {
    const results = await searchKnowledgeBase(query, user?.id);
    return {
      success: true,
      type: 'knowledge_search',
      results,
      query
    };
  }
  
  return {
    success: false,
    error: 'Knowledge commands: search <query>'
  };
}

async function handleTemplateCommand(args, user, options) {
  const { getTemplate } = require('../services/templateService');
  
  const templateName = args[0];
  
  if (!templateName) {
    return {
      success: false,
      error: 'Please specify a template name'
    };
  }
  
  const template = await getTemplate(templateName);
  
  if (!template) {
    return {
      success: false,
      error: `Template '${templateName}' not found`
    };
  }
  
  return {
    success: true,
    type: 'template',
    template,
    templateName
  };
}

function getCommandHelp() {
  return {
    success: true,
    type: 'help',
    commands: [
      {
        command: '@bridgebot run <workflow>',
        description: 'Execute a BridgeBot specific workflow'
      },
      {
        command: '@gpt <action> <query>',
        description: 'Send a command to GPT models'
      },
      {
        command: '@claude <action> <query>',
        description: 'Send a command to Claude models'
      },
      {
        command: '@kb search <query>',
        description: 'Search the knowledge base'
      },
      {
        command: '@template <name>',
        description: 'Load a prompt template'
      },
      {
        command: '@help',
        description: 'Show this help message'
      }
    ]
  };
}

// Get conversation history
router.get('/conversations', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user?.id;
    
    // This would typically fetch from a database
    // For now, return mock data
    const conversations = [
      {
        id: 'conv_1',
        title: 'Discussion about React best practices',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modelId: 'openai',
        messageCount: 15
      }
    ];
    
    res.json({
      conversations,
      pagination: {
        total: conversations.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      message: error.message
    });
  }
});

// Export conversation
router.get('/conversations/:id/export', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    // Mock conversation data
    const conversation = {
      id,
      title: 'Sample Conversation',
      messages: [
        {
          role: 'user',
          content: 'Hello!',
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          timestamp: new Date().toISOString()
        }
      ],
      exportedAt: new Date().toISOString()
    };
    
    switch (format) {
      case 'json':
        res.json(conversation);
        break;
      case 'markdown':
        const markdown = generateMarkdown(conversation);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(markdown);
        break;
      default:
        res.status(400).json({
          error: 'Unsupported format',
          supportedFormats: ['json', 'markdown']
        });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export conversation',
      message: error.message
    });
  }
});

function generateMarkdown(conversation) {
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `*Exported on ${conversation.exportedAt}*\n\n`;
  
  conversation.messages.forEach(message => {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    markdown += `## ${role}\n\n${message.content}\n\n`;
  });
  
  return markdown;
}

module.exports = router;
