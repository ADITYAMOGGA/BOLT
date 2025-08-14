import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/files/user'] });
      }
      
      toast({
        title: "File uploaded successfully!",
        description: `Share code: ${data.code}`,
      });
      handleUploadSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
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
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl">
          
          {/* Left Panel - Core Action Area */}
          <div className="space-y-6 max-w-lg">
            {/* Send Box */}
            <div className="bg-white rounded-xl shadow-lg p-6 w-96 h-36">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
                data-testid="input-file-upload"
              />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Send</h2>
              <div 
                className="cursor-pointer hover:scale-105 transition-transform flex items-center justify-center h-16"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-send"
              >
                {uploadMutation.isPending ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  <Plus className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>

            {/* Receive Box */}
            <div className="bg-white rounded-xl shadow-lg p-6 w-96 h-36">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Receive</h2>
              <form onSubmit={handleDownloadSubmit}>
                <div className="flex items-center space-x-3">
                  <Input
                    id="download-code"
                    type="text"
                    placeholder="Input key"
                    value={downloadCode}
                    onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="flex-1 text-gray-600 bg-gray-50 border-gray-200 focus:border-primary rounded-lg h-12"
                    data-testid="input-download-code"
                  />
                  <Button type="submit" variant="ghost" size="sm" className="p-2" data-testid="button-download">
                    <Download className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel - Introduction & Features */}
          <div className="space-y-8">
            {/* Main Introduction */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-6">
                Want to send larger files securely?
              </h1>
              <p className="text-white/90 text-xl mb-8 leading-relaxed">
                BOLT makes file sharing simple and secure. Upload files up to 200MB, share them with unique codes, and they automatically delete after 24 hours for your security.
              </p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 py-4 text-lg" data-testid="button-see-features">
                See more features
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Feature Illustration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Secure Transfer</span>
                  <Shield className="w-4 h-4 text-green-500" />
                </div>
                <div className="bg-gray-100 rounded h-2 mb-2">
                  <div className="bg-primary rounded h-2 w-3/4"></div>
                </div>
                <span className="text-xs text-gray-500">Upload complete • Code: ABC123</span>
              </div>
            </div>

            {/* Quick Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="font-bold text-xl text-white mb-6">Why choose BOLT?</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-green-400 mr-4" />
                  <span className="text-white text-lg">End-to-end encryption</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-blue-400 mr-4" />
                  <span className="text-white text-lg">24-hour auto-deletion</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-6 h-6 text-purple-400 mr-4" />
                  <span className="text-white text-lg">Access from anywhere</span>
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
