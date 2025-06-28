import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  User, 
  Bot, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  error?: boolean;
}

interface ChatMessageProps {
  message: ChatMessage;
  currentModel: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, currentModel }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy message",
        variant: "destructive"
      });
    }
  };

  const handleRegenerate = () => {
    // TODO: Implement regenerate functionality
    toast({
      title: "Regenerate",
      description: "Regenerating response...",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex items-start space-x-4 ${
      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
    }`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${message.role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : message.error
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-muted text-muted-foreground'
        }
      `}>
        {message.role === 'user' ? (
          <User className="h-4 w-4" />
        ) : message.error ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`
        flex-1 min-w-0 space-y-2
        ${message.role === 'user' ? 'max-w-[80%]' : 'max-w-[90%]'}
      `}>
        {/* Message Header */}
        <div className={`flex items-center space-x-2 text-xs text-muted-foreground ${
          message.role === 'user' ? 'justify-end' : ''
        }`}>
          <span className="font-medium">
            {message.role === 'user' ? 'You' : (message.model || currentModel)}
          </span>
          <span>•</span>
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>

        {/* Message Bubble */}
        <div className={`
          rounded-lg px-4 py-3 prose prose-sm max-w-none
          ${message.role === 'user' 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : message.error
              ? 'bg-destructive/10 border border-destructive/20'
              : 'bg-muted'
          }
        `}>
          {message.role === 'user' ? (
            <p className="text-primary-foreground whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <div className={`prose prose-sm max-w-none ${
              message.error ? 'prose-red' : 'prose-foreground'
            }`}>
              <ReactMarkdown
                components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !props.node || props.node.position?.start.line === props.node.position?.end.line;
                  
                  return !isInline && match ? (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-border px-3 py-2">
                      {children}
                    </td>
                  );
                }
              }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Actions (only for assistant messages) */}
        {message.role === 'assistant' && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            {!message.error && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-green-600"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-red-600"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
