const fetch = require('node-fetch');

// Check API health for different providers
async function checkApiHealth(modelId, config) {
  try {
    switch (modelId) {
      case 'openai':
        return await checkOpenAiHealth(config);
      case 'claude':
        return await checkClaudeHealth(config);
      case 'gemini':
        return await checkGeminiHealth(config);
      case 'bridgebot':
        return await checkBridgeBotHealth(config);
      default:
        return false;
    }
  } catch (error) {
    console.error(`Health check failed for ${modelId}:`, error.message);
    return false;
  }
}

async function checkOpenAiHealth(config) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(`${config.endpoint}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkClaudeHealth(config) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return false;

  try {
    // Claude doesn't have a simple health endpoint, so we'll just check if API key is valid
    const response = await fetch(`${config.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      }),
      timeout: 5000
    });

    return response.status !== 401; // Unauthorized means bad API key
  } catch (error) {
    return false;
  }
}

async function checkGeminiHealth(config) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(`${config.endpoint}/models?key=${apiKey}`, {
      timeout: 5000
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkBridgeBotHealth(config) {
  const token = process.env.BRIDGEBOT_TOKEN;
  const endpoint = process.env.BRIDGEBOT_ENDPOINT_URL;
  
  if (!token || !endpoint) return false;

  try {
    const response = await fetch(`${endpoint}/health`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// Send API request to different providers
async function sendApiRequest(modelId, modelName, message, options = {}) {
  switch (modelId) {
    case 'openai':
      return await sendOpenAiRequest(modelName, message, options);
    case 'claude':
      return await sendClaudeRequest(modelName, message, options);
    case 'gemini':
      return await sendGeminiRequest(modelName, message, options);
    case 'bridgebot':
      return await sendBridgeBotRequest(modelName, message, options);
    default:
      throw new Error(`Unsupported model: ${modelId}`);
  }
}

async function sendOpenAiRequest(modelName, message, options) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName || 'gpt-4o',
      messages: [
        { role: 'user', content: message }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
}

async function sendClaudeRequest(modelName, message, options) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelName || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 2000,
      messages: [
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    usage: data.usage,
    model: data.model
  };
}

async function sendGeminiRequest(modelName, message, options) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const model = modelName || 'gemini-pro';
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    usage: data.usageMetadata,
    model: model
  };
}

async function sendBridgeBotRequest(modelName, message, options) {
  const token = process.env.BRIDGEBOT_TOKEN;
  const endpoint = process.env.BRIDGEBOT_ENDPOINT_URL;
  
  if (!token || !endpoint) {
    throw new Error('BridgeBot configuration not found');
  }

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName || 'bridgebot-tutor',
      messages: [
        { role: 'user', content: message }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      context: options.context
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`BridgeBot API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
}

module.exports = {
  checkApiHealth,
  sendApiRequest
};
