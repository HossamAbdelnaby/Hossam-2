import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ImageUtils } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'logo';
    const width = parseInt(formData.get('width') as string) || 200;
    const height = parseInt(formData.get('height') as string) || 200;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate image using utility
    const validation = await ImageUtils.validateImage(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = ImageUtils.generateFilename(file.name, `${type}-`);
    const optimizedFilename = ImageUtils.generateFilename(file.name, `${type}-optimized-`);

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Define file paths
    const originalPath = join(uploadDir, filename);
    const optimizedPath = join(uploadDir, optimizedFilename);

    // Process and optimize image
    let processedBuffer: Buffer;
    let processedMetadata: any;

    try {
      // Process image with optimization
      const result = await ImageUtils.processImage(buffer, {
        maxWidth: width,
        maxHeight: height,
        quality: 80,
        format: 'webp',
        fit: 'contain'
      });

      processedBuffer = result.buffer;
      processedMetadata = result.metadata;

      // Save optimized image
      await writeFile(optimizedPath, processedBuffer);

      // Also save original if needed (for future reference)
      await writeFile(originalPath, buffer);

    } catch (processingError) {
      console.error('Image processing error:', processingError);
      console.error('Error details:', {
        name: processingError.name,
        message: processingError.message,
        stack: processingError.stack,
        code: processingError.code
      });
      return NextResponse.json(
        { error: `Failed to process image: ${processingError.message}` },
        { status: 500 }
      );
    }

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const optimizedUrl = `${baseUrl}/uploads/${type}/${optimizedFilename}`;
    const originalUrl = `${baseUrl}/uploads/${type}/${filename}`;

    return NextResponse.json({
      success: true,
      url: optimizedUrl,
      originalUrl: originalUrl,
      filename: optimizedFilename,
      originalFilename: filename,
      size: processedBuffer.length,
      originalSize: buffer.length,
      sizeReduction: Math.round((1 - processedBuffer.length / buffer.length) * 100),
      type: file.type,
      dimensions: {
        width: processedMetadata.width,
        height: processedMetadata.height
      },
      originalDimensions: validation.metadata ? {
        width: validation.metadata.width,
        height: validation.metadata.height
      } : null,
      format: processedMetadata.format,
      humanReadableSize: ImageUtils.formatFileSize(processedBuffer.length)
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}