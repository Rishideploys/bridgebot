// Shared types for BridgeBot AI Frontend

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  models: AIModel[];
  endpoint: string;
  requiresKey: boolean;
  status: 'healthy' | 'unavailable' | 'unknown';
  lastChecked?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  usage?: TokenUsage;
  error?: boolean;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface Conversation {
  id: string;
  title?: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  settings: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  defaultModel: string;
  temperature: number;
  apiKeys?: {
    openai?: string;
    claude?: string;
    gemini?: string;
    bridgebot?: string;
  };
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  wordCount?: number;
  status: 'processing' | 'processed' | 'error';
  createdAt: string;
  updatedAt: string;
  extractedText?: string;
}

export interface SearchResult {
  document: Document;
  score: number;
  relevantChunks: TextChunk[];
  matchedTerms: string[];
}

export interface TextChunk {
  text: string;
  startIndex: number;
  wordCount: number;
  score?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: string[];
  isBuiltin: boolean;
  createdAt: string;
  updatedAt?: string;
  usage?: number;
  rating?: number;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  modelId: string;
  modelName?: string;
  conversationId?: string;
  context?: ChatContext;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatContext {
  documents?: string;
  workflow?: boolean;
  [key: string]: any;
}

export interface Command {
  command: string;
  args: string[];
  type: 'bridgebot' | 'gpt' | 'claude' | 'kb' | 'template' | 'help';
}

export interface CommandResult {
  success: boolean;
  type: string;
  response?: string;
  data?: any;
  error?: string;
  command?: string;
}

// Frontend specific types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  models: ModelProvider[];
  currentModel: string;
  conversations: Conversation[];
  activeConversation: string | null;
  documents: Document[];
  templates: PromptTemplate[];
  loading: boolean;
  error: string | null;
}

export interface ChatPanelState {
  messages: ChatMessage[];
  isTyping: boolean;
  inputText: string;
  showTemplates: boolean;
  selectedTemplate: PromptTemplate | null;
}

export interface SidebarState {
  isOpen: boolean;
  activeTab: 'models' | 'knowledge' | 'templates';
  searchQuery: string;
  selectedCategory: string | null;
}
