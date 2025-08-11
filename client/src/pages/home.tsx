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
import { Rocket, Shield, Users, Download, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-all duration-300">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Share Files{' '}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Instantly
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload, generate a secure link, and share files up to 200MB. No registration required. Fast, secure, and simple.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Secure Transfer</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <Rocket className="w-5 h-5 text-blue-500" />
                <span className="font-medium">24H Auto-Delete</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Up to 200MB</span>
              </div>
            </div>
          </div>

          {/* Authentication Warning */}
          <div className="max-w-4xl mx-auto mb-8">
            <AuthWarning />
          </div>

          {/* Upload Zone */}
          <div className="max-w-4xl mx-auto mb-16">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Download Section */}
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Download Files
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter a 6-character sharing code to download files
              </p>
            </div>

            <form onSubmit={handleDownloadSubmit} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter sharing code (e.g., ABC123)"
                    value={downloadCode}
                    onChange={(e) => setDownloadCode(e.target.value)}
                    maxLength={6}
                    className="h-12 text-lg text-center font-mono uppercase tracking-wider bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Codes are case-insensitive and expire after 24 hours
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* File Manager */}
      {showFileManager && (
        <section id="file-manager" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
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
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose BOLT?
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Fast, secure, and incredibly simple file sharing for everyone
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Lightning Fast
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Upload and share files in seconds with our optimized infrastructure
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure & Private
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                End-to-end encryption with automatic file deletion after 24 hours
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No Registration
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Start sharing immediately without any signup or personal information
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <h2 className="text-2xl font-bold">BOLT</h2>
            </div>
            
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Fast, secure, and simple file sharing. No registration required.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">FAQ</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              <p>&copy; 2024 BOLT. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
