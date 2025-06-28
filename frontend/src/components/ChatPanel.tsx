import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Paperclip, Mic, Sparkles, Terminal, Upload } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import ChatMessage from './ChatMessage';
import WelcomeScreen from './WelcomeScreen';

const ChatPanel: React.FC = () => {
  const {
    conversations,
    activeConversation,
    currentModel,
    models,
    isTyping,
    addMessage,
    createConversation,
    setActiveConversation,
    setTyping
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeConv = conversations.find(c => c.id === activeConversation);
  const currentProvider = models.find(m => m.id === currentModel);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, isTyping]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    let conversationId = activeConversation;
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation(currentModel);
    }

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user' as const,
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message
    addMessage(conversationId, userMessage);
    setInputText('');
    setTyping(true);

    try {
      // Send to API
      const response = await apiService.sendMessage({
        message: userMessage.content,
        modelId: currentModel,
        conversationId,
        temperature: 0.7,
        maxTokens: 2000
      }) as any;

      // Handle command responses
      if (response.type) {
        handleCommandResponse(response, conversationId);
      } else {
        // Regular AI response
        const aiMessage = {
          id: `msg_${Date.now()}_ai`,
          role: 'assistant' as const,
          content: response.response?.content || response.content || 'No response received',
          timestamp: new Date().toISOString(),
          model: response.modelUsed || currentModel,
          error: response.error
        };

        addMessage(conversationId, aiMessage);
      }

    } catch (error) {
      console.error('Send message error:', error);
      
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant' as const,
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date().toISOString(),
        error: true
      };

      addMessage(conversationId, errorMessage);
      
      toast({
        title: "Message Failed",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setTyping(false);
    }
  };

  const handleCommandResponse = (response: any, conversationId: string) => {
    let content = '';

    switch (response.type) {
      case 'workflow':
        content = `🤖 **BridgeBot Workflow Executed**\n\n${response.response?.content || 'Workflow completed'}`;
        break;
      
      case 'gpt_command':
      case 'claude_command':
        content = `✨ **${response.type.split('_')[0].toUpperCase()} Response**\n\n${response.response?.content || 'Command executed'}`;
        break;
      
      case 'knowledge_search':
        content = `🔍 **Knowledge Base Search Results**\n\nQuery: "${response.query}"\n\n`;
        if (response.results && response.results.length > 0) {
          response.results.forEach((result: any, index: number) => {
            content += `**${index + 1}. ${result.document.title}**\n`;
            content += `${result.document.description || 'No description'}\n`;
            if (result.relevantChunks && result.relevantChunks.length > 0) {
              content += `*Relevant excerpt: "${result.relevantChunks[0].text.substring(0, 200)}..."*\n\n`;
            }
          });
        } else {
          content += 'No results found.';
        }
        break;
      
      case 'template':
        content = `📋 **Template Loaded: ${response.templateName}**\n\n${response.template.description}\n\n**Prompt:**\n${response.template.prompt}`;
        if (response.template.variables && response.template.variables.length > 0) {
          content += `\n\n**Variables:** ${response.template.variables.join(', ')}`;
        }
        break;
      
      case 'help':
        content = `💡 **Available Commands**\n\n`;
        response.commands.forEach((cmd: any) => {
          content += `**${cmd.command}** - ${cmd.description}\n`;
        });
        break;
      
      default:
        content = response.response?.content || JSON.stringify(response, null, 2);
    }

    const aiMessage = {
      id: `msg_${Date.now()}_ai`,
      role: 'assistant' as const,
      content,
      timestamp: new Date().toISOString(),
      model: currentModel
    };

    addMessage(conversationId, aiMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    // Show commands when typing @
    if (e.key === '@' || inputText.startsWith('@')) {
      setShowCommands(true);
    } else if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  const insertCommand = (command: string) => {
    setInputText(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const commands = [
    { command: '@bridgebot run', description: 'Execute BridgeBot workflow' },
    { command: '@gpt', description: 'Send command to GPT models' },
    { command: '@claude', description: 'Send command to Claude models' },
    { command: '@kb search', description: 'Search knowledge base' },
    { command: '@template', description: 'Load prompt template' },
    { command: '@help', description: 'Show all commands' }
  ];

  if (!activeConv) {
    return <WelcomeScreen onStartChat={() => createConversation(currentModel)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {activeConv.title || 'New Conversation'}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{currentProvider?.name || 'AI Model'}</span>
              <span>•</span>
              <span>{activeConv.messages.length} messages</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => createConversation(currentModel)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeConv.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            currentModel={currentProvider?.name || 'AI'}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Commands Dropdown */}
      {showCommands && (
        <div className="mx-4 mb-2 bg-background border border-border rounded-lg shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Available Commands</span>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {commands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => insertCommand(cmd.command)}
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
              >
                <div className="font-mono text-sm text-primary">{cmd.command}</div>
                <div className="text-xs text-muted-foreground">{cmd.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-3">
          {/* Additional Actions */}
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... Use @ for commands"
              className="min-h-[44px] max-h-[120px] resize-none pr-12"
              disabled={isTyping}
            />
            
            {/* Character indicator for @ commands */}
            {inputText.startsWith('@') && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <Terminal className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            size="sm"
            className="h-[44px] px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Input hints */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="mx-2">•</span>
          <span>Use @ for commands</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
