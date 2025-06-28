import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  Search, 
  FolderOpen, 
  FileText as Template,
  Plus,
  X,
  File,
  Download,
  Trash2,
  BookOpen,
  Filter
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';

const RightSidebar: React.FC = () => {
  const { documents, templates, setDocuments, setTemplates } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileId = `${file.name}_${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileId] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [fileId]: current + 10 };
          });
        }, 200);

        const response = await apiService.uploadDocument(file, {
          title: file.name,
          category: 'general'
        });

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        // Refresh documents list
        loadDocuments();

        toast({
          title: "Upload Complete",
          description: `${file.name} has been processed and added to your knowledge base.`,
        });

        // Remove progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 2000);

      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
        
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const loadDocuments = async () => {
    try {
      const response = await apiService.getDocuments() as any;
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.getTemplates() as any;
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await apiService.searchKnowledge(searchQuery) as any;
      console.log('Search results:', response);
      
      toast({
        title: "Search Complete",
        description: `Found ${response.results?.length || 0} results`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search knowledge base",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiService.deleteDocument(documentId);
      loadDocuments();
      
      toast({
        title: "Document Deleted",
        description: "Document has been removed from your knowledge base.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('text')) return '📝';
    if (mimeType.includes('word')) return '📘';
    return '📄';
  };

  const categories = ['all', 'general', 'research', 'documentation', 'development'];

  return (
    <div className="h-full bg-background border-l border-border overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Tools & Resources</h2>
      </div>

      <Tabs defaultValue="knowledge" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="knowledge" className="flex-1">Knowledge</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
        </TabsList>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="flex-1 flex flex-col m-4 mt-0 space-y-4">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, TXT, MD, DOC, DOCX
            </p>
          </div>

          {/* Upload Progress */}
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate">
                  {fileId.split('_')[0]}
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}

          {/* Search */}
          <div className="space-y-2">
            <Label>Search Knowledge Base</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Documents ({documents.length})</Label>
              <Button variant="ghost" size="sm" onClick={loadDocuments}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents uploaded</p>
                <p className="text-xs">Upload files to build your knowledge base</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFileIcon(doc.mimeType || '')}</span>
                        <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(doc.fileSize)} • {doc.category}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={doc.status === 'processed' ? 'secondary' : 'outline'}>
                      {doc.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 flex flex-col m-4 mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Prompt Templates ({templates.length})</Label>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={loadTemplates}>
                <Template className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Template className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No templates available</p>
                <p className="text-xs">Create templates for common workflows</p>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/50 cursor-pointer">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{template.isBuiltin ? 'Built-in' : 'Custom'}</span>
                      {template.usage && (
                        <span>{template.usage} uses</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RightSidebar;
