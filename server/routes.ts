import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertFileSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { supabaseStorage, supabaseEnabled } from "./supabase";
import { MemStorage } from "./storage";
import { cloudinary } from "./cloudinary";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const uploadDir = path.join(process.cwd(), 'uploads');

// Use in-memory storage if Supabase is not configured
const storage = supabaseEnabled ? supabaseStorage : new MemStorage();

// Configure multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      // Validate input data
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      
      if (password.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters" });
      }
      
      // Check if user already exists
      const existingUser = await supabaseStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user in Supabase
      await supabaseStorage.createUser({ username, password, passwordHash });

      res.status(201).json({ message: "Account created successfully! Please login." });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Get user from Supabase
      const user = await supabaseStorage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Store user ID in session
      (req as any).session.userId = user.id;

      // Return user data (excluding password hash)
      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Check auth status
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await supabaseStorage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Auth check failed" });
    }
  });

  // Get user files
  app.get("/api/files/user", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const files = await supabaseStorage.getUserFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching user files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Upload file
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Get user ID from session if logged in
      const userId = (req as any).session?.userId || null;

      const fileData = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
        filePath: req.file.path, // Local file path for Cloudinary upload
        password: req.body.password || null,
        userId: userId, // Use session user ID for logged in users
      };

      const file = await supabaseStorage.createFile(fileData);
      
      // Store Cloudinary URL instead of local path
      const cloudinaryUrl = cloudinary.url(file.filename, { secure: true });
      supabaseStorage.setFilePath(file.id, cloudinaryUrl);
      
      // Clean up temporary local file
      try {
        await import('fs/promises').then(fs => fs.unlink(req.file!.path));
      } catch (error) {
        console.warn('Failed to clean up temporary file:', error);
      }

      res.json({
        id: file.id,
        original_name: file.originalName,
        code: file.code,
        size: file.size,
        mime_type: file.mimeType,
        expires_at: file.expiresAt,
        download_count: file.downloadCount,
        hasPassword: !!file.password,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Get file info by code
  app.get("/api/file/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const file = await supabaseStorage.getFileByCode(code);
      
      if (!file) {
        return res.status(404).json({ message: "File not found or expired" });
      }

      res.json({
        id: file.id,
        original_name: file.originalName,
        code: file.code,
        size: file.size,
        mime_type: file.mimeType,
        expires_at: file.expiresAt,
        download_count: file.downloadCount,
        hasPassword: !!file.password,
      });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({ message: "Failed to get file info" });
    }
  });

  // Download file
  app.post("/api/download/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { password } = req.body;
      const file = await supabaseStorage.getFileByCode(code);
      
      if (!file) {
        return res.status(404).json({ message: "File not found or expired" });
      }

      // Check password if file is protected
      if (file.password && file.password !== password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Get Cloudinary URL for the file
      const cloudinaryUrl = cloudinary.url(file.filename, { 
        secure: true,
        flags: 'attachment',
        resource_type: 'auto'
      });

      if (!cloudinaryUrl) {
        return res.status(404).json({ message: "File data not found" });
      }

      await supabaseStorage.incrementDownloadCount(file.id);

      // Redirect to Cloudinary URL for download
      res.redirect(cloudinaryUrl);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  // Get all active files (for file manager)
  app.get("/api/files", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      
      let files;
      if (userId) {
        // Get files for specific user
        files = await supabaseStorage.getUserFiles(userId);
      } else {
        // Get all active files (admin view or anonymous files)
        files = await supabaseStorage.getActiveFiles();
      }
      
      const fileList = files.map(file => ({
        id: file.id,
        original_name: file.originalName || file.original_name,
        code: file.code,
        size: file.size,
        mime_type: file.mimeType || file.mime_type,
        expires_at: file.expiresAt || file.expires_at,
        download_count: file.downloadCount || file.download_count,
        created_at: file.createdAt || file.created_at,
        hasPassword: !!file.password,
        isOwned: !!file.userId,
      }));
      
      res.json(fileList);
    } catch (error) {
      console.error("Get files error:", error);
      res.status(500).json({ message: "Failed to get files" });
    }
  });

  // Delete file
  app.delete("/api/file/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await supabaseStorage.deleteFile(id);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
