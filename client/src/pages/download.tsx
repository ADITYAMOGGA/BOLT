import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Image, Film, Music, Archive, File as FileIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DownloadPage() {
  const { code } = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: file, isLoading, error } = useQuery<any>({
    queryKey: ['/api/file', code],
    enabled: !!code,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/download/${code}`);
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
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "Your file download has begun.",
      });
    },
    onError: () => {
      toast({
        title: "Download failed",
        description: "Could not download the file. It may have expired.",
        variant: "destructive",
      });
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
              
              {/* Download Button */}
              <Button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg mb-6"
              >
                <Download className="w-6 h-6 mr-3" />
                {downloadMutation.isPending ? 'Downloading...' : 'Download File'}
              </Button>
              
              {/* File Details */}
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>
                  File expires in{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {getTimeLeft(file.expiresAt)}
                  </span>
                </p>
                <p>
                  Downloaded{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {file.downloadCount}
                  </span>{' '}
                  time{file.downloadCount !== 1 ? 's' : ''}
                </p>
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
