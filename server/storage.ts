import { type File, type InsertFile, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // File operations
  createFile(file: InsertFile & { filename: string }): Promise<File>;
  getFileByCode(code: string): Promise<File | undefined>;
  getFileById(id: string): Promise<File | undefined>;
  incrementDownloadCount(id: string): Promise<void>;
  deleteFile(id: string): Promise<void>;
  getActiveFiles(): Promise<File[]>;
  getUserFiles(userId: string): Promise<File[]>;
  cleanupExpiredFiles(): Promise<void>;
  
  // User operations
  createUser(user: InsertUser & { passwordHash: string }): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private files: Map<string, File>;
  private users: Map<string, User>;
  private uploads: Map<string, string>; // Maps file id to file path

  constructor() {
    this.files = new Map();
    this.users = new Map();
    this.uploads = new Map();
    
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

  async createFile(insertFile: InsertFile & { filename: string }): Promise<File> {
    const id = randomUUID();
    const code = this.generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    const file: File = {
      id,
      filename: insertFile.filename,
      originalName: insertFile.originalName,
      mimeType: insertFile.mimeType,
      size: insertFile.size,
      code,
      password: insertFile.password || null,
      downloadCount: 0,
      userId: insertFile.userId || null,
      createdAt: now,
      expiresAt,
    };

    this.files.set(id, file);
    return file;
  }

  async getFileByCode(code: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(file => file.code === code && file.expiresAt > new Date());
  }

  async getFileById(id: string): Promise<File | undefined> {
    const file = this.files.get(id);
    if (file && file.expiresAt > new Date()) {
      return file;
    }
    return undefined;
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      file.downloadCount += 1;
      this.files.set(id, file);
    }
  }

  async deleteFile(id: string): Promise<void> {
    this.files.delete(id);
    const filePath = this.uploads.get(id);
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
      this.uploads.delete(id);
    }
  }

  async getActiveFiles(): Promise<File[]> {
    const now = new Date();
    return Array.from(this.files.values()).filter(file => file.expiresAt > now);
  }

  async cleanupExpiredFiles(): Promise<void> {
    const now = new Date();
    const expiredFiles = Array.from(this.files.values()).filter(file => file.expiresAt <= now);
    
    for (const file of expiredFiles) {
      await this.deleteFile(file.id);
    }
  }

  setFilePath(id: string, filePath: string): void {
    this.uploads.set(id, filePath);
  }

  getFilePath(id: string): string | undefined {
    return this.uploads.get(id);
  }

  async getUserFiles(userId: string): Promise<File[]> {
    const now = new Date();
    return Array.from(this.files.values()).filter(file => 
      file.userId === userId && file.expiresAt > now
    );
  }

  // User operations
  async createUser(insertUser: InsertUser & { passwordHash: string }): Promise<User> {
    const id = randomUUID();
    const now = new Date();

    const user: User = {
      id,
      username: insertUser.username,
      passwordHash: insertUser.passwordHash,
      createdAt: now,
    };

    this.users.set(id, user);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
}

export const storage = new MemStorage();
