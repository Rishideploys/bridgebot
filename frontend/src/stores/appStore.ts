import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  settings: {
    theme: 'light' | 'dark';
    defaultModel: string;
    temperature: number;
    apiKeys?: {
      openai?: string;
      claude?: string;
      gemini?: string;
      bridgebot?: string;
    };
  };
}

interface ModelProvider {
  id: string;
  name: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  status: 'healthy' | 'unavailable' | 'unknown';
  requiresKey: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  error?: boolean;
}

interface Conversation {
  id: string;
  title?: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  status: 'processing' | 'processed' | 'error';
  createdAt: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: string[];
  isBuiltin: boolean;
  usage?: number;
  rating?: number;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Models
  models: ModelProvider[];
  currentModel: string;
  
  // Chat
  conversations: Conversation[];
  activeConversation: string | null;
  isTyping: boolean;
  
  // Knowledge Base
  documents: Document[];
  
  // Templates
  templates: PromptTemplate[];
  
  // UI State
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setModels: (models: ModelProvider[]) => void;
  setCurrentModel: (modelId: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  createConversation: (modelId: string) => string;
  setActiveConversation: (id: string | null) => void;
  setDocuments: (documents: Document[]) => void;
  setTemplates: (templates: PromptTemplate[]) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTyping: (typing: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      models: [],
      currentModel: 'openai',
      conversations: [],
      activeConversation: null,
      isTyping: false,
      documents: [],
      templates: [],
      leftSidebarOpen: false,
      rightSidebarOpen: true,
      theme: 'dark',
      loading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setModels: (models) => set({ models }),
      
      setCurrentModel: (modelId) => set({ currentModel: modelId }),
      
      addMessage: (conversationId, message) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? { 
                ...conv, 
                messages: [...conv.messages, message],
                updatedAt: new Date().toISOString()
              }
            : conv
        )
      })),
      
      createConversation: (modelId) => {
        const id = `conv_${Date.now()}`;
        const conversation: Conversation = {
          id,
          modelId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversation: id
        }));
        
        return id;
      },
      
      setActiveConversation: (id) => set({ activeConversation: id }),
      
      setDocuments: (documents) => set({ documents }),
      
      setTemplates: (templates) => set({ templates }),
      
      toggleLeftSidebar: () => set((state) => ({ 
        leftSidebarOpen: !state.leftSidebarOpen 
      })),
      
      toggleRightSidebar: () => set((state) => ({ 
        rightSidebarOpen: !state.rightSidebarOpen 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setTyping: (isTyping) => set({ isTyping })
    }),
    {
      name: 'bridgebot-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        currentModel: state.currentModel,
        conversations: state.conversations,
        theme: state.theme,
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen
      })
    }
  )
);
