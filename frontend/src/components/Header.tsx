import React from 'react';
import { 
  Bot, 
  Menu, 
  PanelLeft, 
  PanelRight, 
  Settings,
  LogOut,
  Sun,
  Moon,
  User
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header: React.FC = () => {
  const {
    user,
    theme,
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    setTheme,
    setUser,
    setToken
  } = useAppStore();

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      apiService.setToken(null);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4">
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center space-x-4">
        {/* Left Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelLeft className={`h-5 w-5 transition-colors ${leftSidebarOpen ? 'text-primary' : ''}`} />
        </Button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              BridgeBot AI
            </h1>
            <p className="text-xs text-muted-foreground">
              Multi-Model Interface
            </p>
          </div>
        </div>
      </div>

      {/* Center - Status Indicators */}
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Connected</span>
        </div>
      </div>

      {/* Right side - User Menu and Controls */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* Right Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRightSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelRight className={`h-5 w-5 transition-colors ${rightSidebarOpen ? 'text-primary' : ''}`} />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="space-x-2">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="hidden md:inline text-sm font-medium">
                {user?.username || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bot className="h-4 w-4 mr-2" />
              API Keys
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
