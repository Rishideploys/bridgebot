const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async register(username: string, password: string, email?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email })
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateSettings(settings: any) {
    return this.request('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Models endpoints
  async getModels() {
    return this.request('/models');
  }

  async getModel(modelId: string) {
    return this.request(`/models/${modelId}`);
  }

  async checkModelHealth(modelId: string) {
    return this.request(`/models/${modelId}/health`, {
      method: 'POST'
    });
  }

  // Chat endpoints
  async sendMessage(data: {
    message: string;
    modelId: string;
    modelName?: string;
    conversationId?: string;
    context?: any;
    temperature?: number;
    maxTokens?: number;
  }) {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getConversations() {
    return this.request('/chat/conversations');
  }

  async exportConversation(conversationId: string, format: string = 'json') {
    return this.request(`/chat/conversations/${conversationId}/export?format=${format}`);
  }

  // Knowledge base endpoints
  async uploadDocument(file: File, metadata: {
    title?: string;
    description?: string;
    category?: string;
  }) {
    const formData = new FormData();
    formData.append('document', file);
    
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);

    return this.request('/knowledge/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async searchKnowledge(query: string, options?: {
    limit?: number;
    category?: string;
  }) {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);

    return this.request(`/knowledge/search?${params.toString()}`);
  }

  async getDocuments(options?: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

    return this.request(`/knowledge/documents?${params.toString()}`);
  }

  async getDocument(documentId: string) {
    return this.request(`/knowledge/documents/${documentId}`);
  }

  async deleteDocument(documentId: string) {
    return this.request(`/knowledge/documents/${documentId}`, {
      method: 'DELETE'
    });
  }

  async updateDocument(documentId: string, metadata: {
    title?: string;
    description?: string;
    category?: string;
  }) {
    return this.request(`/knowledge/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(metadata)
    });
  }

  async getKnowledgeStats() {
    return this.request('/knowledge/stats');
  }

  // Template endpoints
  async getTemplates(options?: {
    category?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.search) params.append('search', options.search);

    return this.request(`/templates?${params.toString()}`);
  }

  async getTemplate(templateId: string) {
    return this.request(`/templates/${templateId}`);
  }

  async createTemplate(template: {
    name: string;
    description?: string;
    category: string;
    prompt: string;
    variables: string[];
  }) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template)
    });
  }

  async updateTemplate(templateId: string, template: {
    name?: string;
    description?: string;
    category?: string;
    prompt?: string;
    variables?: string[];
  }) {
    return this.request(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template)
    });
  }

  async deleteTemplate(templateId: string) {
    return this.request(`/templates/${templateId}`, {
      method: 'DELETE'
    });
  }

  async renderTemplate(templateId: string, variables: Record<string, string>) {
    return this.request(`/templates/${templateId}/render`, {
      method: 'POST',
      body: JSON.stringify({ variables })
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();

// Set token when available
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('bridgebot-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.token) {
        apiService.setToken(parsed.state.token);
      }
    } catch (error) {
      console.error('Failed to parse stored token:', error);
    }
  }
}
