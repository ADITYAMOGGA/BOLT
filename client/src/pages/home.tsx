import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Navigation } from '@/components/navigation';
import { FileUpload } from '@/components/file-upload';
import { FileCard } from '@/components/file-card';
import { AuthWarning } from '@/components/auth-warning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, Shield, Users, Download, ArrowRight, CloudUpload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [showFileManager, setShowFileManager] = useState(false);
  const [downloadCode, setDownloadCode] = useState('');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: user ? ['/api/files', user.id] : ['/api/files'],
    queryFn: async () => {
      const url = user ? `/api/files?userId=${user.id}` : '/api/files';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    enabled: showFileManager,
  });

  const handleUploadSuccess = () => {
    setShowFileManager(true);
    // Scroll to file manager
    setTimeout(() => {
      document.getElementById('file-manager')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadCode.trim()) {
      const code = downloadCode.trim().toUpperCase();
      navigate(`/d/${code}`);
    } else {
      toast({
        title: "Enter a code",
        description: "Please enter a 6-character sharing code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <Navigation />
      
      {/* Main Grid Layout */}
      <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid Background Pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Left Section - Hero Content */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-8 relative z-10">
          {/* Brand and Title */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BOLT</h1>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Share Files{' '}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Instantly
              </span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
              Upload, generate a secure link, and share files up to 200MB. No registration required. Fast, secure, and simple.
            </p>
            
            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Secure & Encrypted</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">24H Auto-Delete</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">No Registration Required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Upload and Download */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 relative z-10">
          {/* Authentication Warning */}
          <div className="mb-6">
            <AuthWarning />
          </div>

          {/* Upload Section */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <CloudUpload className="w-6 h-6 mr-3 text-blue-600" />
                Upload Files
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Drag and drop files or click to select. Up to 200MB per file.
              </p>
            </div>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Download Section */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Download className="w-6 h-6 mr-3 text-emerald-600" />
                Download Files
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter a 6-character sharing code to download files
              </p>
            </div>

            <form onSubmit={handleDownloadSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter sharing code (e.g., ABC123)"
                    value={downloadCode}
                    onChange={(e) => setDownloadCode(e.target.value)}
                    maxLength={6}
                    className="h-12 text-lg text-center font-mono uppercase tracking-wider bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 rounded-xl"
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Codes are case-insensitive and expire after 24 hours
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* File Manager - Full Width Below Main Content */}
      {showFileManager && (
        <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 p-8">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Your Files
              </h3>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">Loading files...</p>
                </div>
              ) : files.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {files.map((file: any) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-300">No files uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
