"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Plus, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertTriangle,
  Search,
  Image as ImageIcon,
  Code,
  File,
  Globe,
  Type,
  Hash
} from "lucide-react";

interface WebsiteContent {
  id: string;
  key: string;
  title?: string;
  content: string;
  type: 'TEXT' | 'HTML' | 'MARKDOWN' | 'IMAGE_URL';
  isActive: boolean;
  updatedAt: string;
}

export default function ContentManagementPage() {
  const [contents, setContents] = useState<WebsiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", type: "TEXT" as const });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContent, setNewContent] = useState({ key: "", title: "", content: "", type: "TEXT" as const });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content');
      if (response.ok) {
        const data = await response.json();
        setContents(data.contents || []);
      }
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content: WebsiteContent) => {
    setEditingContent(content.id);
    setEditForm({ 
      title: content.title || "", 
      content: content.content, 
      type: content.type 
    });
  };

  const handleSave = async (contentId: string) => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Content updated successfully!' });
        setEditingContent(null);
        fetchContents();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update content' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleAddContent = async () => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Content added successfully!' });
        setShowAddDialog(false);
        setNewContent({ key: "", title: "", content: "", type: "TEXT" });
        fetchContents();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to add content' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleToggleActive = async (contentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Content ${isActive ? 'activated' : 'deactivated'} successfully!` });
        fetchContents();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update content status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = 
      content.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || content.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT': return Type;
      case 'HTML': return Code;
      case 'MARKDOWN': return FileText;
      case 'IMAGE_URL': return ImageIcon;
      default: return File;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TEXT': return 'default';
      case 'HTML': return 'secondary';
      case 'MARKDOWN': return 'outline';
      case 'IMAGE_URL': return 'default';
      default: return 'secondary';
    }
  };

  const formatContentPreview = (content: string, type: string, maxLength = 100) => {
    if (type === 'IMAGE_URL') {
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    }
    
    const plainText = content.replace(/<[^>]*>/g, '').replace(/^[#*`-]\s*/gm, '');
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage website content, text, and media
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Content</DialogTitle>
              <DialogDescription>
                Create new website content with custom key and type
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Content Key</Label>
                <Input
                  id="key"
                  value={newContent.key}
                  onChange={(e) => setNewContent(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., homepage_hero_title, footer_copyright"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier for this content
                </p>
              </div>
              
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={newContent.title}
                  onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Content title or description"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Content Type</Label>
                <Select value={newContent.type} onValueChange={(value: any) => setNewContent(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Plain Text</SelectItem>
                    <SelectItem value="HTML">HTML</SelectItem>
                    <SelectItem value="MARKDOWN">Markdown</SelectItem>
                    <SelectItem value="IMAGE_URL">Image URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newContent.content}
                  onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your content here..."
                  rows={6}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddContent} disabled={!newContent.key || !newContent.content}>
                  Add Content
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search content by key, title, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="TEXT">Text</option>
              <option value="HTML">HTML</option>
              <option value="MARKDOWN">Markdown</option>
              <option value="IMAGE_URL">Image URL</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-4">
        {filteredContents.map((content) => {
          const TypeIcon = getTypeIcon(content.type);
          
          return (
            <Card key={content.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <code className="text-sm bg-muted px-2 py-1 rounded">{content.key}</code>
                      <Badge variant={getTypeColor(content.type)} className="text-xs">
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {content.type}
                      </Badge>
                      <Badge variant={content.isActive ? 'default' : 'secondary'} className="text-xs">
                        {content.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {content.title && (
                      <h3 className="font-medium">{content.title}</h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(content.id, !content.isActive)}
                    >
                      {content.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(content)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {editingContent === content.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`title-${content.id}`}>Title</Label>
                      <Input
                        id={`title-${content.id}`}
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Content title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`type-${content.id}`}>Type</Label>
                      <Select value={editForm.type} onValueChange={(value: any) => setEditForm(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEXT">Plain Text</SelectItem>
                          <SelectItem value="HTML">HTML</SelectItem>
                          <SelectItem value="MARKDOWN">Markdown</SelectItem>
                          <SelectItem value="IMAGE_URL">Image URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`content-${content.id}`}>Content</Label>
                      <Textarea
                        id={`content-${content.id}`}
                        value={editForm.content}
                        onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter your content here..."
                        rows={6}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(content.id)}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingContent(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Content Preview</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                        {formatContentPreview(content.content, content.type)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Last updated: {new Date(content.updatedAt).toLocaleDateString()}</span>
                      {content.type === 'IMAGE_URL' && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={content.content} target="_blank" rel="noopener noreferrer">
                            <ImageIcon className="w-4 h-4 mr-1" />
                            View Image
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters, or create new content
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}