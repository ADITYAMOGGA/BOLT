import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CloudUpload, Plus, Loader2, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (usePassword && password) {
        formData.append('password', password);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 20, 90));
      }, 200);

      try {
        // Use fetch directly for file uploads to avoid setting Content-Type header
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      setUploadProgress(0);
      setPassword('');
      setUsePassword(false);
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      
      const protectionMessage = data.hasPassword ? " (Password protected)" : "";
      toast({
        title: "File uploaded successfully!",
        description: `Share this code: ${data.code}${protectionMessage}`,
      });

      setTimeout(() => {
        onUploadSuccess?.();
      }, 1000);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 200 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 200MB.",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024,
  });

  if (uploadMutation.isPending) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-12 text-center transition-all duration-300">
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Uploading...</h3>
          <div className="max-w-xs mx-auto">
            <Progress value={uploadProgress} className="h-3" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{uploadProgress.toFixed(0)}% complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Protection Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="password-toggle"
              checked={usePassword}
              onCheckedChange={setUsePassword}
              className="data-[state=checked]:bg-orange-600"
            />
            <Label htmlFor="password-toggle" className="flex items-center space-x-2 cursor-pointer">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Protect with password
              </span>
            </Label>
          </div>
        </div>

        {usePassword && (
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-500" />
              <Input
                type="password"
                placeholder="Enter password for file protection"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-8">
              Recipients will need this password to download the file
            </p>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-102'
            : 'border-gray-300 dark:border-slate-600'
        }`}
      >
      <input {...getInputProps()} />
      
      <div className="space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center animate-bounce">
          <CloudUpload className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Drop your files here
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            or click to browse from your device
          </p>
        </div>
        
        <div className="space-y-4">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Choose Files
          </Button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Maximum file size: 200MB • Supported: All file types
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
