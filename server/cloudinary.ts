import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with trimmed environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

// Validate configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary environment variables');
}

export { cloudinary };

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  bytes: number;
  format: string;
  resource_type: string;
}

export async function uploadToCloudinary(
  filePath: string,
  options?: {
    folder?: string;
    public_id?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
  }
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options?.folder || 'bolt-files',
      public_id: options?.public_id,
      resource_type: options?.resource_type || 'auto',
      use_filename: false,
      unique_filename: true,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

export function getCloudinaryUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
}): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}