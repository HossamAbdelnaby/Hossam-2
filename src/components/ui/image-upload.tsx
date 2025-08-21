"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileImage, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  type?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  aspectRatio?: string;
  width?: number;
  height?: number;
}

export function ImageUpload({
  value,
  onValueChange,
  label = "Logo",
  placeholder = "Upload logo",
  required = false,
  className = "",
  disabled = false,
  type = "logo",
  maxSize = 5, // 5MB default
  acceptedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  aspectRatio = "1:1",
  width = 200,
  height = 200,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError("");
    
    // Debug: Log file details
    console.log('Processing file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      typeParam: type
    });
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('width', width.toString());
      formData.append('height', height.toString());

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      // Handle response
      xhr.addEventListener('load', () => {
        console.log('Upload response status:', xhr.status);
        console.log('Upload response text:', xhr.responseText);
        
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload successful, URL:', response.url);
          onValueChange?.(response.url);
          setUploading(false);
          setUploadProgress(0);
          
          // Show optimization info
          if (response.sizeReduction) {
            console.log(`Image optimized: ${response.sizeReduction}% size reduction`);
          }
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          setError(errorResponse.error || 'Upload failed');
          setUploading(false);
          setUploadProgress(0);
          setPreview(null);
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Network error during upload');
        setError('Network error during upload');
        setUploading(false);
        setUploadProgress(0);
        setPreview(null);
      });

      // Send request
      xhr.open('POST', '/api/upload/image');
      xhr.send(formData);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
      setUploading(false);
      setUploadProgress(0);
      setPreview(null);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onValueChange?.("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!preview ? (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading...</p>
                  <Progress value={uploadProgress} className="w-32" />
                  <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{placeholder}</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max {maxSize}MB • {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                  </p>
                  {aspectRatio && (
                    <p className="text-xs text-muted-foreground">
                      Recommended aspect ratio: {aspectRatio}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div 
                  className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ width: `${width}px`, height: `${height}px` }}
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  {!uploading && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        <p className="text-sm">Uploading...</p>
                        <Progress value={uploadProgress} className="w-24" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">Image uploaded successfully</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}