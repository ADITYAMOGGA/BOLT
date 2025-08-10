import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const uploadDir = path.join(process.cwd(), 'uploads');

// Configure multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
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
      const files = await storage.getActiveFiles();
      const fileList = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        code: file.code,
        size: file.size,
        mimeType: file.mimeType,
        expiresAt: file.expiresAt,
        downloadCount: file.downloadCount,
        hasPassword: !!file.password,
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
