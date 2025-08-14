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
import { Plus, Download, ArrowRight, Globe, Mail, Shield, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [showFileManager, setShowFileManager] = useState(false);
  const [downloadCode, setDownloadCode] = useState('');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/files'],
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Top Announcement Bar */}
      <div className="bg-yellow-100 border-b border-yellow-200 py-2">
        <div className="container mx-auto px-4 text-center">
          <span className="text-sm text-gray-700">🎉 New plans are newly released!</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
          
          {/* Left Panel - Core Action Area */}
          <div className="space-y-8">
            {/* Send Box */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send</h2>
                <p className="text-gray-600">Upload files up to 200MB</p>
              </div>
              <AuthWarning />
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Receive Box */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Receive</h2>
                <p className="text-gray-600">Enter 6-digit key</p>
              </div>
              <form onSubmit={handleDownloadSubmit} className="space-y-4">
                <Input
                  id="download-code"
                  type="text"
                  placeholder="6-digit key"
                  value={downloadCode}
                  onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-xl font-mono tracking-widest h-14 border-2 border-gray-200 focus:border-primary"
                  data-testid="input-download-code"
                />
                <Button type="submit" className="w-full h-14 text-lg font-semibold" size="lg" data-testid="button-download">
                  <Download className="w-5 h-5 mr-2" />
                  Receive
                </Button>
              </form>
            </div>
          </div>

          {/* Right Panel - Promotional & Feature Area */}
          <div className="space-y-8">
            {/* Main Feature Highlight */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Want to send larger files securely?
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                BOLT makes file sharing simple and secure. No email attachments, no file size limits, no account required.
              </p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 py-3" data-testid="button-see-features">
                See more features
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Feature Illustration */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-12 h-12 text-primary" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Secure Transfer</span>
                    <Shield className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="bg-gray-100 rounded h-2 mb-2">
                    <div className="bg-primary rounded h-2 w-3/4"></div>
                  </div>
                  <span className="text-xs text-gray-500">Upload complete • Code: XYZ123</span>
                </div>
              </div>
            </div>

            {/* Quick Features */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Why choose BOLT?</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">End-to-end encryption</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-700">24-hour auto-deletion</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="text-gray-700">Access from anywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Manager - Show below if files exist */}
        {showFileManager && (
          <div className="mt-12" id="file-manager">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Your Files</h3>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading files...</p>
                </div>
              ) : files.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {files.map((file: any) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No files uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Language Selector - Bottom Right */}
        <div className="fixed bottom-4 right-4">
          <Button variant="ghost" size="sm" className="text-white hover:text-gray-200">
            <Globe className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
