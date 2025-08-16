import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Eye, FileText, Image, Film, Music, Archive, File as FileIcon, AlertCircle, Lock, Calendar, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { format } from 'date-fns';

export default function DownloadPage() {
  const { code } = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const { toast } = useToast();

  const { data: file, isLoading, error } = useQuery<any>({
    queryKey: ['/api/file', code],
    enabled: !!code,
  });

  const { data: previewData } = useQuery<any>({
    queryKey: ['/api/preview', code],
    enabled: !!code && !!file,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/download/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.status === 401) {
        setShowPasswordInput(true);
        throw new Error('Invalid password');
      }
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : file?.originalName || 'download';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setPassword('');
      setShowPasswordInput(false);
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "Your file download has begun.",
      });
    },
    onError: (error: any) => {
      if (error.message === 'Invalid password') {
        toast({
          title: "Invalid password",
          description: "Please enter the correct password to download this file.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Download failed",
          description: "Could not download the file. It may have expired.",
          variant: "destructive",
        });
      }
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (mimeType?.startsWith('video/')) return <Film className="w-8 h-8" />;
    if (mimeType?.startsWith('audio/')) return <Music className="w-8 h-8" />;
    if (mimeType?.includes('pdf')) return <FileText className="w-8 h-8" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <Archive className="w-8 h-8" />;
    return <FileIcon className="w-8 h-8" />;
  };

  const getIconColor = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900';
    if (mimeType?.startsWith('video/')) return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900';
    if (mimeType?.startsWith('audio/')) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900';
    if (mimeType?.includes('pdf')) return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
    return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading file...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navigation />
        <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                File Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The file you're looking for doesn't exist or has expired.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navigation />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Download File
          </h2>
          
          <Card className="bg-white dark:bg-slate-800 shadow-xl">
            <CardContent className="p-8">
              {/* File Info */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getIconColor(file.mimeType)}`}>
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {file.originalName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              {/* Custom Message */}
              {file.custom_message && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300 mb-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">Message from sender</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-center italic">
                    "{file.custom_message}"
                  </p>
                </div>
              )}

              {/* Password Protection Notice */}
              {file.hasPassword && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-orange-700 dark:text-orange-300">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">This file is password protected</span>
                  </div>
                </div>
              )}

              {/* Download Limit Warning */}
              {file.max_downloads && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-yellow-700 dark:text-yellow-300">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">
                      Downloads remaining: {file.max_downloads - file.download_count}
                    </span>
                  </div>
                </div>
              )}

              {/* Password Input */}
              {(file.hasPassword || showPasswordInput) && (
                <div className="mb-6">
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password to download"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full max-w-md mx-auto bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        downloadMutation.mutate();
                      }
                    }}
                  />
                </div>
              )}

              {/* Preview Section */}
              {previewData?.canPreview && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    File Preview
                  </h4>
                  <div className="w-full max-h-96 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden border">
                    {file.mime_type.startsWith('image/') && (
                      <img 
                        src={previewData.previewUrl} 
                        alt={file.original_name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    )}
                    {file.mime_type.startsWith('video/') && (
                      <video 
                        src={previewData.previewUrl} 
                        controls
                        className="w-full h-full"
                        preload="metadata"
                      >
                        Your browser does not support video preview.
                      </video>
                    )}
                    {file.mime_type.includes('pdf') && (
                      <img 
                        src={previewData.previewUrl} 
                        alt="PDF Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    )}
                    <div className="hidden w-full h-96 flex items-center justify-center">
                      <p className="text-gray-600 dark:text-gray-300">Preview unavailable</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <Button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending || (file.hasPassword && !password)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-6 h-6 mr-3" />
                {downloadMutation.isPending ? 'Downloading...' : 'Download File'}
              </Button>
              
              {/* File Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {file.expiration_type === 'never' ? (
                      <span>Never expires</span>
                    ) : (
                      <>Expires in <strong className="text-gray-900 dark:text-white">{getTimeLeft(file.expires_at)}</strong></>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <HardDrive className="w-4 h-4" />
                  <span>
                    Downloaded <strong className="text-gray-900 dark:text-white">{file.download_count}</strong> time{file.download_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Lock className={`w-4 h-4 ${file.hasPassword ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span>
                    {file.hasPassword ? 'Protected' : 'No password'}
                  </span>
                </div>
                {file.max_downloads && (
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>
                      Limit: <strong className="text-gray-900 dark:text-white">{file.max_downloads}</strong>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Upload Your Own Files
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
