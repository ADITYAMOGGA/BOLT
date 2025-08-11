import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCard } from '@/components/file-card';
import { Navigation } from '@/components/navigation';
import { 
  User, 
  Files, 
  Download, 
  Clock, 
  HardDrive, 
  Calendar,
  Trash2,
  Share2,
  Eye,
  Settings,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileData {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  code: string;
  download_count: number;
  created_at: string;
  expires_at: string;
}

interface UserStats {
  totalFiles: number;
  totalDownloads: number;
  totalSize: number;
  activeFiles: number;
  expiredFiles: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch user files
  const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery<FileData[]>({
    queryKey: ['/api/files/user'],
    enabled: !!user,
  });

  // Calculate user statistics
  const stats: UserStats = {
    totalFiles: files.length,
    totalDownloads: files.reduce((sum: number, file: FileData) => sum + file.download_count, 0),
    totalSize: files.reduce((sum: number, file: FileData) => sum + file.size, 0),
    activeFiles: files.filter((file: FileData) => new Date(file.expires_at) > new Date()).length,
    expiredFiles: files.filter((file: FileData) => new Date(file.expires_at) <= new Date()).length,
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | null | undefined) => {
    if (!mimeType) return <FileText className="w-4 h-4" />;
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getFileTypeColor = (mimeType: string | null | undefined) => {
    if (!mimeType) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    if (mimeType.startsWith('image/')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (mimeType.startsWith('video/')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    if (mimeType.startsWith('audio/')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const handleDeleteFiles = async () => {
    // Implementation for bulk delete
    console.log('Delete files:', selectedFiles);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                Welcome back, {user.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your files and track your sharing activity
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
                data-testid="button-upload-new"
              >
                <Plus className="w-4 h-4" />
                Upload New File
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Files
              </CardTitle>
              <Files className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalFiles}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.activeFiles} active, {stats.expiredFiles} expired
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Downloads
              </CardTitle>
              <Download className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalDownloads}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across all files
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Storage Used
              </CardTitle>
              <HardDrive className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatFileSize(stats.totalSize)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Of unlimited storage
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Account Age
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.createdAt ? formatDistanceToNow(new Date(user.createdAt)) : 'New'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Member since
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage your files and account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={files.length === 0}
                data-testid="button-select-all"
              >
                {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteFiles}
                disabled={selectedFiles.length === 0}
                className="text-red-600 hover:text-red-700"
                data-testid="button-delete-selected"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected ({selectedFiles.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchFiles()}
                data-testid="button-refresh"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Files className="w-5 h-5" />
              Your Files ({files.length})
            </CardTitle>
            <CardDescription>
              All files you've uploaded with BOLT
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Loading files...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <Files className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No files yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start by uploading your first file to share with others.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                  data-testid="button-upload-first"
                >
                  <Plus className="w-4 h-4" />
                  Upload Your First File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => {
                  const isExpired = new Date(file.expires_at) <= new Date();
                  const isSelected = selectedFiles.includes(file.id);
                  
                  return (
                    <div
                      key={file.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950' 
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      } ${isExpired ? 'opacity-60' : ''}`}
                      data-testid={`file-item-${file.code}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles([...selectedFiles, file.id]);
                              } else {
                                setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            data-testid={`checkbox-${file.code}`}
                          />
                          
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.mime_type)}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {file.original_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                                <span>{formatFileSize(file.size)}</span>
                                <span>Code: {file.code}</span>
                                <span>{formatDistanceToNow(new Date(file.created_at))} ago</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={getFileTypeColor(file.mime_type)}>
                            {file.mime_type ? file.mime_type.split('/')[0] : 'unknown'}
                          </Badge>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Download className="w-4 h-4" />
                            {file.download_count}
                          </div>
                          
                          {isExpired ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(file.expires_at))} left
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/d/${file.code}`)}
                              data-testid={`button-share-${file.code}`}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/d/${file.code}`, '_blank')}
                              data-testid={`button-view-${file.code}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-8 border-0 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TrendingUp className="w-5 h-5" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>• Files automatically expire after 24 hours to keep your data secure</p>
            <p>• Share files quickly by copying the download link</p>
            <p>• Use bulk actions to manage multiple files at once</p>
            <p>• Your account keeps track of all your uploads and download statistics</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}