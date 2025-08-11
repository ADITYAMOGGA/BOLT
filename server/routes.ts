import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { supabaseUserStorage } from "./supabase";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const uploadDir = path.join(process.cwd(), 'uploads');

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
      const existingUser = await supabaseUserStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user in Supabase
      await supabaseUserStorage.createUser(username, passwordHash);

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
      const user = await supabaseUserStorage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Return user data (excluding password hash)
      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Upload file
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const fileData = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
        password: req.body.password || null,
        userId: req.body.userId || null, // Optional user ID for logged in users
      };

      const file = await storage.createFile(fileData);
      storage.setFilePath(file.id, req.file.path);

      res.json({
        id: file.id,
        originalName: file.originalName,
        code: file.code,
        size: file.size,
        mimeType: file.mimeType,
        expiresAt: file.expiresAt,
        downloadCount: file.downloadCount,
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
      const file = await storage.getFileByCode(code);
      
      if (!file) {
        return res.status(404).json({ message: "File not found or expired" });
      }

      res.json({
        id: file.id,
        originalName: file.originalName,
        code: file.code,
        size: file.size,
        mimeType: file.mimeType,
        expiresAt: file.expiresAt,
        downloadCount: file.downloadCount,
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
      const file = await storage.getFileByCode(code);
      
      if (!file) {
        return res.status(404).json({ message: "File not found or expired" });
      }

      // Check password if file is protected
      if (file.password && file.password !== password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const filePath = storage.getFilePath(file.id);
      if (!filePath) {
        return res.status(404).json({ message: "File data not found" });
      }

      await storage.incrementDownloadCount(file.id);

      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.sendFile(path.resolve(filePath));
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
        files = await storage.getUserFiles(userId);
      } else {
        // Get all active files (admin view or anonymous files)
        files = await storage.getActiveFiles();
      }
      
      const fileList = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        code: file.code,
        size: file.size,
        mimeType: file.mimeType,
        expiresAt: file.expiresAt,
        downloadCount: file.downloadCount,
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
      await storage.deleteFile(id);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
