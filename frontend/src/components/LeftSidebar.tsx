import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  Settings, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Key
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';

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

const LeftSidebar: React.FC = () => {
  const { models, currentModel, setCurrentModel, user, setError } = useAppStore();
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set(['openai']));
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    claude: '',
    gemini: '',
    bridgebot: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load API keys from user settings
    if (user?.settings?.apiKeys) {
      setApiKeys(prev => ({ ...prev, ...user.settings.apiKeys }));
    }
  }, [user]);

  const toggleProvider = (providerId: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(providerId)) {
      newExpanded.delete(providerId);
    } else {
      newExpanded.add(providerId);
    }
    setExpandedProviders(newExpanded);
  };

  const handleModelSelect = (providerId: string, modelId: string) => {
    setCurrentModel(providerId);
    toast({
      title: "Model Selected",
      description: `Switched to ${models.find(p => p.id === providerId)?.name} - ${modelId}`,
    });
  };

  const handleApiKeyUpdate = async (provider: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    
    try {
      await apiService.updateSettings({
        apiKeys: { ...apiKeys, [provider]: key }
      });
      
      toast({
        title: "API Key Updated",
        description: `${provider.toUpperCase()} API key has been saved.`,
      });
      
      // Refresh model status
      await checkModelHealth(provider);
    } catch (error) {
      console.error('Failed to update API key:', error);
      toast({
        title: "Error",
        description: "Failed to update API key.",
        variant: "destructive"
      });
    }
  };

  const checkModelHealth = async (providerId: string) => {
    try {
      await apiService.checkModelHealth(providerId);
    } catch (error) {
      console.error(`Health check failed for ${providerId}:`, error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'unavailable':
        return <WifiOff className="h-3 w-3 text-red-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Online</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="h-full bg-background border-r border-border overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">AI Models</h2>
          <p className="text-sm text-muted-foreground">
            Select and configure AI models
          </p>
        </div>

        {/* Model Providers */}
        <div className="space-y-3">
          {models.map((provider: ModelProvider) => (
            <div key={provider.id} className="border border-border rounded-lg overflow-hidden">
              <Collapsible
                open={expandedProviders.has(provider.id)}
                onOpenChange={() => toggleProvider(provider.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto"
                  >
                    <div className="flex items-center space-x-3">
                      <Bot className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">{provider.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(provider.status)}
                          <span className="text-xs text-muted-foreground">
                            {provider.models.length} models
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(provider.status)}
                      {expandedProviders.has(provider.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border p-4 space-y-3">
                    {/* API Key Section */}
                    {provider.requiresKey && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center space-x-1">
                          <Key className="h-3 w-3" />
                          <span>API Key</span>
                        </Label>
                        <Input
                          type="password"
                          placeholder={`Enter ${provider.name} API key`}
                          value={apiKeys[provider.id as keyof typeof apiKeys] || ''}
                          onChange={(e) => handleApiKeyUpdate(provider.id, e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    )}

                    {/* Models List */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Available Models</Label>
                      {provider.models.map((model) => (
                        <Button
                          key={model.id}
                          variant={currentModel === provider.id ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => handleModelSelect(provider.id, model.id)}
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{model.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {model.description}
                            </div>
                          </div>
                          {currentModel === provider.id && (
                            <Zap className="h-3 w-3 ml-auto text-primary" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>

        {/* Global Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Settings</h3>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Temperature</Label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              defaultValue="0.7"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Max Tokens</Label>
            <Input
              type="number"
              min="1"
              max="4000"
              defaultValue="2000"
              className="text-xs"
            />
          </div>
        </div>

        {/* Connection Status */}
        <div className="pt-4 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Connection Status</h3>
            {models.map((provider: ModelProvider) => (
              <div key={provider.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{provider.name}</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(provider.status)}
                  <span className={
                    provider.status === 'healthy' ? 'text-green-600' :
                    provider.status === 'unavailable' ? 'text-red-600' :
                    'text-yellow-600'
                  }>
                    {provider.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
