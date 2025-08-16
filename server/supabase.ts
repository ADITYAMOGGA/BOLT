import { createClient } from '@supabase/supabase-js';
import { type IStorage } from './storage';
import { type File, type InsertFile, type User, type InsertUser } from '@shared/schema';
import { randomUUID } from 'crypto';
import { uploadToCloudinary, deleteFromCloudinary, cloudinaryEnabled, type CloudinaryUploadResult } from './cloudinary';
import { sql } from 'drizzle-orm';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables not set. Using in-memory storage.');
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

export const supabaseEnabled = isSupabaseConfigured;

export class SupabaseStorage implements IStorage {
  private uploads: Map<string, string> = new Map(); // Maps file id to cloudinary public_id
  
  constructor() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    if (!cloudinaryEnabled) {
      console.error('Cloudinary is not configured but SupabaseStorage requires it');
      throw new Error('Cloudinary must be configured to use SupabaseStorage');
    }
    // Cleanup expired files every hour
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 60 * 60 * 1000);
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // File operations
  async createFile(insertFile: InsertFile & { filename: string; filePath?: string }): Promise<File> {
    const id = randomUUID();
    const code = this.generateCode();
    const now = new Date();
    
    // Calculate expiration based on expirationType
    let expiresAt: Date;
    const expirationType = insertFile.expirationType || '24h';
    
    switch (expirationType) {
      case '1h':
        expiresAt = new Date(now.getTime() + 1 * 60 * 60 * 1000);
        break;
      case '6h':
        expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      case '24h':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case '7d':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'never':
        expiresAt = new Date('2099-12-31T23:59:59Z'); // Far future date
        break;
      default:
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24h
    }

    // Debug logging can be removed in production
    // console.log(`CreateFile called with:`, insertFile);

    let cloudinaryPublicId = '';
    
    // Upload to Cloudinary if file path is provided
    if (insertFile.filePath) {
      try {
        console.log(`Uploading file to Cloudinary: ${insertFile.filePath}`);
        const cloudinaryResult = await uploadToCloudinary(insertFile.filePath, {
          public_id: `bolt-${id}`,
          folder: 'bolt-files'
        });
        
        if (!cloudinaryResult) {
          console.error('Cloudinary upload returned null - Cloudinary not configured');
          throw new Error('Cloudinary not configured - file upload failed');
        }
        
        cloudinaryPublicId = cloudinaryResult.public_id;
        console.log(`Successfully uploaded to Cloudinary with public_id: ${cloudinaryPublicId}`);
      } catch (error) {
        console.error('Failed to upload to Cloudinary:', error);
        throw new Error('File upload to cloud storage failed');
      }
    } else {
      console.warn('No file path provided for upload');
    }

    const { data, error } = await supabase!
      .from('files')
      .insert({
        id,
        filename: cloudinaryPublicId || insertFile.filename, // Store Cloudinary public_id
        original_name: insertFile.originalName,
        mime_type: insertFile.mimeType,
        size: insertFile.size,
        code,
        password: insertFile.password || null,
        password_hash: insertFile.password ? await import('bcryptjs').then(bcrypt => bcrypt.hash(insertFile.password!, 10)) : null,
        password_protected: insertFile.passwordProtected || 0,
        max_downloads: insertFile.maxDownloads || null,
        expiration_type: insertFile.expirationType || '24h',
        custom_message: insertFile.customMessage || null,
        user_id: insertFile.userId || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      filename: data.filename,
      originalName: data.original_name,
      mimeType: data.mime_type,
      size: data.size,
      code: data.code,
      password: data.password,
      passwordHash: data.password_hash,
      passwordProtected: data.password_protected,
      maxDownloads: data.max_downloads,
      downloadCount: data.download_count,
      expirationType: data.expiration_type,
      customMessage: data.custom_message,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
    };
  }

  async getFileByCode(code: string): Promise<File | undefined> {
    const { data, error } = await supabase!
      .from('files')
      .select('*')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return undefined;

    // Check download count limit
    if (data.max_downloads && data.download_count >= data.max_downloads) {
      return undefined; // File has reached download limit
    }

    return {
      id: data.id,
      filename: data.filename,
      originalName: data.original_name,
      mimeType: data.mime_type,
      size: data.size,
      code: data.code,
      password: data.password,
      passwordHash: data.password_hash,
      passwordProtected: data.password_protected,
      maxDownloads: data.max_downloads,
      downloadCount: data.download_count,
      expirationType: data.expiration_type,
      customMessage: data.custom_message,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
    };
  }

  async getFileById(id: string): Promise<File | undefined> {
    const { data, error } = await supabase!
      .from('files')
      .select('*')
      .eq('id', id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return undefined;

    return {
      id: data.id,
      filename: data.filename,
      originalName: data.original_name,
      mimeType: data.mime_type,
      size: data.size,
      code: data.code,
      password: data.password,
      passwordHash: data.password_hash,
      passwordProtected: data.password_protected,
      maxDownloads: data.max_downloads,
      downloadCount: data.download_count,
      expirationType: data.expiration_type,
      customMessage: data.custom_message,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
    };
  }

  async incrementDownloadCount(id: string): Promise<boolean> {
    // Get current count first, then check limits
    const file = await this.getFileById(id);
    if (!file) return false;
    
    // Check download count limit
    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      return false; // Download limit reached
    }
    
    const { error } = await supabase!
      .from('files')
      .update({ download_count: file.downloadCount + 1 })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async deleteFile(id: string): Promise<void> {
    // Get file info first to get Cloudinary public_id
    const file = await this.getFileById(id);
    
    // Remove from database
    const { error } = await supabase!
      .from('files')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Clean up file from Cloudinary
    if (file?.filename) {
      try {
        await deleteFromCloudinary(file.filename);
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
      }
    }
    
    this.uploads.delete(id);
  }

  async getActiveFiles(): Promise<File[]> {
    const { data, error } = await supabase!
      .from('files')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      mimeType: file.mime_type,
      size: file.size,
      code: file.code,
      password: file.password,
      downloadCount: file.download_count,
      userId: file.user_id,
      createdAt: new Date(file.created_at),
      expiresAt: new Date(file.expires_at),
    }));
  }

  async getUserFiles(userId: string): Promise<any[]> {
    const { data, error } = await supabase!
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Return data in the format expected by the frontend
    return data.map(file => ({
      id: file.id,
      filename: file.filename,
      original_name: file.original_name,
      mime_type: file.mime_type,
      size: file.size,
      code: file.code,
      download_count: file.download_count,
      created_at: file.created_at,
      expires_at: file.expires_at,
    }));
  }

  async cleanupExpiredFiles(): Promise<void> {
    const { data, error } = await supabase!
      .from('files')
      .select('id')
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    for (const file of data) {
      await this.deleteFile(file.id);
    }
  }

  setFilePath(id: string, cloudinaryUrl: string): void {
    this.uploads.set(id, cloudinaryUrl);
  }

  getFilePath(id: string): string | undefined {
    return this.uploads.get(id);
  }

  // User operations
  async createUser(insertUser: InsertUser & { passwordHash: string }): Promise<User> {
    const id = randomUUID();

    const { data, error } = await supabase!
      .from('users')
      .insert({
        id,
        username: insertUser.username,
        password_hash: insertUser.passwordHash,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      username: data.username,
      passwordHash: data.password_hash,
      createdAt: new Date(data.created_at),
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return undefined;

    return {
      id: data.id,
      username: data.username,
      passwordHash: data.password_hash,
      createdAt: new Date(data.created_at),
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return undefined;

    return {
      id: data.id,
      username: data.username,
      passwordHash: data.password_hash,
      createdAt: new Date(data.created_at),
    };
  }
}

export const supabaseStorage = new SupabaseStorage();