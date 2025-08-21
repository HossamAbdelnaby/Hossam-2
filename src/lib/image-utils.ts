import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import sharp from 'sharp';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'contain' | 'cover' | 'fill';
}

export class ImageUtils {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly DEFAULT_OPTIONS: Required<ImageProcessOptions> = {
    maxWidth: 200,
    maxHeight: 200,
    quality: 80,
    format: 'webp',
    fit: 'contain'
  };

  /**
   * Validate an image file before processing
   */
  static async validateImage(file: File): Promise<ImageValidationResult> {
    try {
      // Check file type
      if (!this.ACCEPTED_FORMATS.includes(file.type)) {
        return {
          isValid: false,
          error: `Invalid file type. Accepted formats: ${this.ACCEPTED_FORMATS.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
        };
      }

      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
      }

      // Check if file is actually a valid image by trying to read its metadata
      const buffer = Buffer.from(await file.arrayBuffer());
      
      try {
        const metadata = await sharp(buffer).metadata();
        
        if (!metadata.width || !metadata.height) {
          return {
            isValid: false,
            error: 'Invalid image file: unable to read dimensions'
          };
        }

        // Check for reasonable dimensions (prevent extremely large images)
        if (metadata.width > 5000 || metadata.height > 5000) {
          return {
            isValid: false,
            error: 'Image dimensions too large. Maximum allowed: 5000x5000px'
          };
        }

        return {
          isValid: true,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format || 'unknown',
            size: file.size
          }
        };
      } catch (error) {
        return {
          isValid: false,
          error: 'Invalid image file: unable to process'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to validate image'
      };
    }
  }

  /**
   * Process and optimize an image
   */
  static async processImage(
    buffer: Buffer,
    options: ImageProcessOptions = {}
  ): Promise<{ buffer: Buffer; metadata: any }> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Check if sharp is available
      let sharp;
      try {
        sharp = await import('sharp');
        // If sharp is available, use the default export
        sharp = sharp.default || sharp;
      } catch (sharpError) {
        console.warn('Sharp library not available, using fallback processing:', sharpError.message);
        return this.fallbackProcessImage(buffer, finalOptions);
      }

      // Get original metadata
      const metadata = await sharp(buffer).metadata();

      // Calculate dimensions to maintain aspect ratio
      let { width, height } = finalOptions;
      
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        
        if (aspectRatio > 1) {
          // Landscape
          height = Math.round(width / aspectRatio);
        } else {
          // Portrait or square
          width = Math.round(height * aspectRatio);
        }
      }

      // Validate calculated dimensions
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.warn('Invalid dimensions calculated, using defaults:', { width, height, metadata });
        width = finalOptions.maxWidth;
        height = finalOptions.maxHeight;
      }

      // Build processing pipeline
      let pipeline = sharp(buffer).resize(width, height, {
        fit: finalOptions.fit,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      });

      // Apply format-specific optimizations
      switch (finalOptions.format) {
        case 'webp':
          pipeline = pipeline.webp({ 
            quality: finalOptions.quality, 
            effort: 6 
          });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({ 
            quality: finalOptions.quality,
            mozjpeg: true 
          });
          break;
        case 'png':
          pipeline = pipeline.png({ 
            quality: finalOptions.quality,
            compressionLevel: 9 
          });
          break;
      }

      // Process the image
      const processedBuffer = await pipeline.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      return {
        buffer: processedBuffer,
        metadata: processedMetadata
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      // Try fallback processing
      try {
        console.log('Attempting fallback image processing...');
        return this.fallbackProcessImage(buffer, finalOptions);
      } catch (fallbackError) {
        console.error('Fallback processing also failed:', fallbackError);
        throw new Error(`Failed to process image: ${error.message}`);
      }
    }
  }

  /**
   * Fallback image processing when Sharp is not available
   */
  private static async fallbackProcessImage(
    buffer: Buffer,
    options: Required<ImageProcessOptions>
  ): Promise<{ buffer: Buffer; metadata: any }> {
    // For fallback, we'll just return the original buffer with basic metadata
    // This ensures the upload doesn't fail completely
    console.log('Using fallback image processing - no optimization applied');
    
    return {
      buffer: buffer,
      metadata: {
        width: options.maxWidth,
        height: options.maxHeight,
        format: options.format,
        size: buffer.length
      }
    };
  }

  /**
   * Generate a unique filename for uploaded images
   */
  static generateFilename(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'webp';
    return `${prefix}${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Clean up old uploaded files (utility function for maintenance)
   */
  static async cleanupOldFiles(uploadDir: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const now = Date.now();
      
      if (!existsSync(uploadDir)) {
        return;
      }

      const files = readdirSync(uploadDir);
      
      for (const file of files) {
        const filePath = join(uploadDir, file);
        const stats = statSync(filePath);
        
        // Delete files older than maxAge
        if (now - stats.mtime.getTime() > maxAge) {
          await unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
    }
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get supported file formats for display
   */
  static getSupportedFormats(): string[] {
    return this.ACCEPTED_FORMATS.map(format => format.split('/')[1].toUpperCase());
  }
}