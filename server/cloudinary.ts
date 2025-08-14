import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with trimmed environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (!isCloudinaryConfigured) {
  console.warn('Cloudinary environment variables not set. File uploads will use local storage.');
}

export const cloudinaryEnabled = isCloudinaryConfigured;

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
): Promise<CloudinaryUploadResult | null> {
  if (!isCloudinaryConfigured) {
    console.warn('Cloudinary not configured, skipping upload');
    return null;
  }

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
  if (!isCloudinaryConfigured) {
    console.warn('Cloudinary not configured, skipping delete');
    return;
  }

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
}): string | null {
  if (!isCloudinaryConfigured) {
    return null;
  }

  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}