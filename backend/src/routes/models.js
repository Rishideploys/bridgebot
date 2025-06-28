const express = require('express');
const router = express.Router();
const { checkApiHealth } = require('../services/apiService');

// Available AI models configuration
const MODELS_CONFIG = {
  'openai': {
    id: 'openai',
    name: 'OpenAI GPT',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Previous generation flagship' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' }
    ],
    endpoint: 'https://api.openai.com/v1',
    requiresKey: true,
    status: 'unknown'
  },
  'claude': {
    id: 'claude',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced model' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest model' }
    ],
    endpoint: 'https://api.anthropic.com/v1',
    requiresKey: true,
    status: 'unknown'
  },
  'gemini': {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced model' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Multimodal capabilities' }
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1',
    requiresKey: true,
    status: 'unknown'
  },
  'bridgebot': {
    id: 'bridgebot',
    name: 'BridgeBot',
    models: [
      { id: 'bridgebot-tutor', name: 'BridgeBot Tutor', description: 'Educational AI assistant' },
      { id: 'bridgebot-general', name: 'BridgeBot General', description: 'General purpose assistant' }
    ],
    endpoint: process.env.BRIDGEBOT_ENDPOINT_URL || 'http://localhost:8000',
    requiresKey: true,
    status: 'unknown'
  }
};

// Get all available models
router.get('/', async (req, res) => {
  try {
    // Check API health for each model
    const modelsWithStatus = {};
    
    for (const [key, config] of Object.entries(MODELS_CONFIG)) {
      const isHealthy = await checkApiHealth(key, config);
      modelsWithStatus[key] = {
        ...config,
        status: isHealthy ? 'healthy' : 'unavailable',
        lastChecked: new Date().toISOString()
      };
    }

    res.json({
      models: modelsWithStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: 'Failed to fetch model information',
      message: error.message
    });
  }
});

// Get specific model details
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const modelConfig = MODELS_CONFIG[modelId];

    if (!modelConfig) {
      return res.status(404).json({
        error: 'Model not found',
        modelId
      });
    }

    // Check health for this specific model
    const isHealthy = await checkApiHealth(modelId, modelConfig);
    
    res.json({
      ...modelConfig,
      status: isHealthy ? 'healthy' : 'unavailable',
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching model ${req.params.modelId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch model details',
      message: error.message
    });
  }
});

// Check model health
router.post('/:modelId/health', async (req, res) => {
  try {
    const { modelId } = req.params;
    const modelConfig = MODELS_CONFIG[modelId];

    if (!modelConfig) {
      return res.status(404).json({
        error: 'Model not found',
        modelId
      });
    }

    const isHealthy = await checkApiHealth(modelId, modelConfig);
    
    res.json({
      modelId,
      status: isHealthy ? 'healthy' : 'unavailable',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error checking health for ${req.params.modelId}:`, error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

module.exports = router;
