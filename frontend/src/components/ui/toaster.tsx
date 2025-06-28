import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start space-x-3 p-4 rounded-lg shadow-lg border max-w-sm
            ${toast.variant === 'destructive' 
              ? 'bg-destructive text-destructive-foreground border-destructive' 
              : 'bg-background text-foreground border-border'
            }
          `}
        >
          <div className="flex-shrink-0">
            {toast.variant === 'destructive' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{toast.title}</h4>
            {toast.description && (
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            )}
          </div>
          
          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
