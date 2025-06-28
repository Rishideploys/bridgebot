import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { apiService } from './services/api';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import ChatPanel from './components/ChatPanel';
import RightSidebar from './components/RightSidebar';
import LoginModal from './components/LoginModal';
import { Toaster } from './components/ui/toaster';

function App() {
  const {
    isAuthenticated,
    token,
    leftSidebarOpen,
    rightSidebarOpen,
    theme,
    setModels,
    setTemplates,
    setError
  } = useAppStore();

  useEffect(() => {
    // Set API token
    if (token) {
      apiService.setToken(token);
    }

    // Load initial data if authenticated
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    // Apply theme
    document.documentElement.className = theme;
  }, [theme]);

  const loadInitialData = async () => {
    try {
      // Load models
      const modelsResponse = await apiService.getModels() as any;
      setModels(modelsResponse.models ? Object.values(modelsResponse.models) : []);

      // Load templates
      const templatesResponse = await apiService.getTemplates() as any;
      setTemplates(templatesResponse.templates || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load application data');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <LoginModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${theme}`}>
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Model Selection & Configuration */}
        <div className={`
          transition-all duration-300 ease-in-out border-r border-border
          ${leftSidebarOpen ? 'w-80' : 'w-0'}
          ${leftSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          <LeftSidebar />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0">
          <ChatPanel />
        </div>

        {/* Right Sidebar - Tools & Resources */}
        <div className={`
          transition-all duration-300 ease-in-out border-l border-border
          ${rightSidebarOpen ? 'w-80' : 'w-0'}
          ${rightSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          <RightSidebar />
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
