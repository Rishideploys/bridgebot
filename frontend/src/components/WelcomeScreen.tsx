import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Search, 
  FileText, 
  Code,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface WelcomeScreenProps {
  onStartChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat }) => {
  const features = [
    {
      icon: MessageSquare,
      title: 'Multi-Model Chat',
      description: 'Switch between OpenAI, Claude, Gemini, and BridgeBot seamlessly',
      color: 'text-blue-500'
    },
    {
      icon: Search,
      title: 'Knowledge Base',
      description: 'Upload documents and search across your knowledge base',
      color: 'text-green-500'
    },
    {
      icon: FileText,
      title: 'Prompt Templates',
      description: 'Use pre-built templates or create your own for common tasks',
      color: 'text-purple-500'
    },
    {
      icon: Code,
      title: 'Command System',
      description: 'Use @ commands for advanced workflows and integrations',
      color: 'text-orange-500'
    }
  ];

  const quickActions = [
    {
      title: 'Code Review',
      description: 'Get feedback on your code',
      command: '@template code-review'
    },
    {
      title: 'Explain Concept',
      description: 'Break down complex topics',
      command: '@template explain-concept'
    },
    {
      title: 'Search Knowledge',
      description: 'Find information in your docs',
      command: '@kb search'
    },
    {
      title: 'Debug Help',
      description: 'Get help with debugging',
      command: '@template debug-help'
    }
  ];

  const handleQuickAction = (command: string) => {
    onStartChat();
    // TODO: Auto-populate input with command
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-8">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to BridgeBot AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Your professional multi-model AI interface. Switch between different AI providers, 
            manage your knowledge base, and streamline your workflows.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl w-full">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6 max-w-2xl w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Quick Actions</h2>
          <p className="text-muted-foreground">Get started with these common workflows</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 justify-start text-left space-y-2"
              onClick={() => handleQuickAction(action.command)}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{action.title}</h4>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
                <code className="text-xs text-primary font-mono mt-2 block">
                  {action.command}
                </code>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="mt-12">
        <Button onClick={onStartChat} size="lg" className="space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Start New Conversation</span>
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-8 max-w-lg text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>
            Tip: Use <code className="bg-muted px-1 py-0.5 rounded">@help</code> to see all available commands
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
