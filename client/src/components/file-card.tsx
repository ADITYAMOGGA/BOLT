import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  File as FileIcon,
  Copy,
  Link,
  Share,
  Trash2,
  Check,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface FileData {
  id: string;
  originalName: string;
  code: string;
  size: number;
  mimeType: string;
  expiresAt: string;
  downloadCount: number;
  hasPassword?: boolean;
}

interface FileCardProps {
  file: FileData;
}

export function FileCard({ file }: FileCardProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/file/${file.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "File deleted",
        description: "The file has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Film className="w-6 h-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (mimeType.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-6 h-6" />;
    return <FileIcon className="w-6 h-6" />;
  };

  const getIconColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900';
    if (mimeType.startsWith('video/')) return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900';
    if (mimeType.startsWith('audio/')) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900';
    if (mimeType.includes('pdf')) return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
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
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'code' ? 'Code' : 'Link'} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareLink = `${window.location.origin}/d/${file.code}`;

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColor(file.mimeType)}`}>
            {getFileIcon(file.mimeType)}
          </div>
          <div className="flex space-x-2">
            {file.hasPassword && (
              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                <Lock className="w-3 h-3 mr-1" />
                Protected
              </Badge>
            )}
            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
              Active
            </Badge>
          </div>
        </div>
        
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 truncate" title={file.originalName}>
          {file.originalName}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {formatFileSize(file.size)} • Expires in {getTimeLeft(file.expiresAt)}
        </p>
        
        <div className="space-y-3">
          {/* Share Code */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300">
              {file.code}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(file.code, 'code')}
              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </Button>
          </div>
          
          {/* Share Link */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
              bolt.app/d/{file.code}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(shareLink, 'link')}
              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Link className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </Button>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              onClick={() => copyToClipboard(shareLink, 'link')}
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {file.downloadCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Downloaded {file.downloadCount} time{file.downloadCount !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
