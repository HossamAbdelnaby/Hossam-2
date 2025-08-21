"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  X,
  FileArchive,
  FileCode,
  Database
} from "lucide-react";

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  category: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          setMessage({ type: 'success', text: 'File uploaded successfully!' });
          fetchFiles();
        } else {
          setMessage({ type: 'error', text: 'Failed to upload file' });
        }
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      xhr.onerror = () => {
        setMessage({ type: 'error', text: 'Network error during upload' });
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.open('POST', '/api/admin/files/upload');
      xhr.send(formData);
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed' });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'File deleted successfully!' });
        fetchFiles();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete file' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      const response = await fetch(`/api/admin/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download file' });
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || file.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (mimeType: string, category: string) => {
    if (category === 'IMAGE') return ImageIcon;
    if (category === 'VIDEO') return Video;
    if (category === 'AUDIO') return Music;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
    if (mimeType.includes('json') || mimeType.includes('xml')) return FileCode;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryStats = () => {
    const stats = {
      IMAGE: 0,
      DOCUMENT: 0,
      VIDEO: 0,
      AUDIO: 0,
      OTHER: 0
    };

    files.forEach(file => {
      stats[file.category]++;
    });

    return stats;
  };

  const categoryStats = getCategoryStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
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
          <h1 className="text-3xl font-bold">File Manager</h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage website files and media
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading file...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <File className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{files.length}</div>
            <div className="text-xs text-muted-foreground">Total Files</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{categoryStats.IMAGE}</div>
            <div className="text-xs text-muted-foreground">Images</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{categoryStats.DOCUMENT}</div>
            <div className="text-xs text-muted-foreground">Documents</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Video className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{categoryStats.VIDEO}</div>
            <div className="text-xs text-muted-foreground">Videos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Music className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{categoryStats.AUDIO}</div>
            <div className="text-xs text-muted-foreground">Audio</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search files by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="IMAGE">Images</option>
                <option value="DOCUMENT">Documents</option>
                <option value="VIDEO">Videos</option>
                <option value="AUDIO">Audio</option>
                <option value="OTHER">Other</option>
              </select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType, file.category);
            
            return (
              <Card key={file.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <FileIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm truncate" title={file.originalName}>
                      {file.originalName}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(file)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType, file.category);
            
            return (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileIcon className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{file.originalName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <Badge variant="outline">{file.category}</Badge>
                          <span>Uploaded {new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(file)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredFiles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "Upload your first file to get started"
              }
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.originalName}</DialogTitle>
              <DialogDescription>
                File details and preview
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <span className="ml-2">{selectedFile.mimeType}</span>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <span className="ml-2">{selectedFile.category}</span>
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>
                  <span className="ml-2">{new Date(selectedFile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {selectedFile.category === 'IMAGE' && (
                <div className="border rounded-lg p-4 bg-center bg-cover bg-no-repeat bg-gray-100 min-h-[200px] flex items-center justify-center">
                  <img 
                    src={`/api/files/${selectedFile.id}`} 
                    alt={selectedFile.originalName}
                    className="max-w-full max-h-64 object-contain"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => handleDownloadFile(selectedFile)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteFile(selectedFile.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}