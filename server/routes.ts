import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertFileSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { supabaseStorage } from "./supabase";
import { cloudinary } from "./cloudinary";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const uploadDir = path.join(process.cwd(), 'uploads');

// Use Supabase storage only
const storage = supabaseStorage;

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
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      await storage.createUser({ username, password, passwordHash });

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

      // Get user
      const user = await storage.getUserByUsername(username);
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

      const user = await storage.getUserById(userId);
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

      const files = await storage.getUserFiles(userId);
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

      // Parse additional form data for enhanced features
      const password = req.body.password || null;
      const maxDownloads = req.body.maxDownloads ? parseInt(req.body.maxDownloads) : null;
      const expirationType = req.body.expirationType || '24h';
      const customMessage = req.body.customMessage || null;

      // Validate max downloads
      if (maxDownloads && (maxDownloads < 1 || maxDownloads > 1000)) {
        return res.status(400).json({ message: "Max downloads must be between 1 and 1000" });
      }

      // Validate expiration type
      const validExpirationTypes = ['1h', '6h', '24h', '7d', '30d', 'never'];
      if (!validExpirationTypes.includes(expirationType)) {
        return res.status(400).json({ message: "Invalid expiration type" });
      }

      const fileData = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
        filePath: req.file.path, // Local file path for Cloudinary upload
        password: password,
        passwordProtected: password ? 1 : 0, // SQLite boolean as integer
        maxDownloads: maxDownloads,
        expirationType: expirationType,
        customMessage: customMessage,
        userId: userId, // Use session user ID for logged in users
      };

      const file = await storage.createFile(fileData);
      
      // Clean up temporary local file after upload
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
        expiration_type: file.expirationType,
        download_count: file.downloadCount,
        max_downloads: file.maxDownloads,
        hasPassword: !!file.password,
        custom_message: file.customMessage,
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
        original_name: file.originalName,
        code: file.code,
        size: file.size,
        mime_type: file.mimeType,
        expires_at: file.expiresAt,
        expiration_type: file.expirationType,
        download_count: file.downloadCount,
        max_downloads: file.maxDownloads,
        hasPassword: !!file.passwordHash,
        password_protected: !!file.passwordProtected,
        custom_message: file.customMessage,
        filename: file.filename, // Include Cloudinary public_id for preview generation
      });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({ message: "Failed to get file info" });
    }
  });

  // Get file preview URL
  app.get("/api/preview/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const file = await storage.getFileByCode(code);
      
      if (!file) {
        return res.status(404).json({ message: "File not found or expired" });
      }

      // Generate preview URL based on file type
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const isImageFile = file.mimeType.startsWith('image/');
      const isVideoFile = file.mimeType.startsWith('video/');
      const isPdfFile = file.mimeType.includes('pdf');
      
      let previewUrl = null;
      let canPreview = false;

      if (isImageFile) {
        // For images, use Cloudinary's transformation capabilities
        previewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_600,c_limit,f_auto,q_auto/${file.filename}`;
        canPreview = true;
      } else if (isVideoFile) {
        // For videos, use Cloudinary's video preview
        previewUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${file.filename}`;
        canPreview = true;
      } else if (isPdfFile) {
        // For PDFs, convert first page to image
        previewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_jpg,pg_1/${file.filename}`;
        canPreview = true;
      }

      res.json({
        canPreview,
        previewUrl,
        file: {
          id: file.id,
          original_name: file.originalName,
          code: file.code,
          size: file.size,
          mime_type: file.mimeType,
          expires_at: file.expiresAt,
          download_count: file.downloadCount,
          hasPassword: !!file.password,
        }
      });
    } catch (error) {
      console.error("Get preview error:", error);
      res.status(500).json({ message: "Failed to get preview" });
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
      if (file.passwordProtected && file.passwordHash) {
        if (!password) {
          return res.status(401).json({ message: "Password required" });
        }
        const isPasswordValid = await bcrypt.compare(password, file.passwordHash);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid password" });
        }
      }

      // Check download count limit
      const canDownload = await storage.incrementDownloadCount(file.id);
      if (!canDownload) {
        return res.status(403).json({ message: "Download limit reached" });
      }

      // Using Supabase storage with Cloudinary
      {
        // For Supabase storage, use Cloudinary URL
        // The filename field contains the Cloudinary public_id
        // Use 'raw' resource type for non-image files
        const isImageFile = file.mimeType.startsWith('image/');
        const resourceType = isImageFile ? 'image' : 'raw';
        
        // Build Cloudinary URL manually to avoid problematic query parameters
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${file.filename}`;

        if (!cloudinaryUrl) {
          return res.status(404).json({ message: "File data not found" });
        }

        console.log(`Downloading file: ${file.originalName} from Cloudinary URL: ${cloudinaryUrl}`);
        console.log(`File.filename (public_id): ${file.filename}`);
        
        // Test if the Cloudinary URL is accessible first
        try {
          const response = await fetch(cloudinaryUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.error(`Cloudinary URL not accessible: ${response.status} ${response.statusText}`);
            return res.status(404).json({ message: "File not found in cloud storage" });
          }
        } catch (error) {
          console.error('Error checking Cloudinary URL:', error);
          return res.status(500).json({ message: "Error accessing file storage" });
        }
        
        // Set proper headers for download
        res.set({
          'Content-Disposition': `attachment; filename="${file.originalName}"`,
          'Content-Type': file.mimeType
        });
        
        // Redirect to Cloudinary URL for download
        res.redirect(cloudinaryUrl);
      }
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
