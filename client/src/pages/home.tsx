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
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-3">Secure File Sharing</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload files up to 200MB and share them securely with unique codes. Files auto-delete after 24 hours.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <div className="flex items-center mb-4">
                <CloudUpload className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold">Upload File</h2>
              </div>
              <AuthWarning />
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>

          {/* Download Section */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Download className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold">Download File</h2>
              </div>
              <form onSubmit={handleDownloadSubmit} className="space-y-4">
                <div>
                  <label htmlFor="download-code" className="text-sm font-medium text-foreground block mb-2">
                    Enter sharing code
                  </label>
                  <Input
                    id="download-code"
                    type="text"
                    placeholder="e.g. ABC123"
                    value={downloadCode}
                    onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </form>
            </div>

            {/* Quick Features */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="font-semibold mb-4">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Shield className="w-4 h-4 text-green-600 mr-3" />
                  <span>Secure cloud storage</span>
                </div>
                <div className="flex items-center text-sm">
                  <Rocket className="w-4 h-4 text-blue-600 mr-3" />
                  <span>24-hour auto-deletion</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 text-purple-600 mr-3" />
                  <span>No account required</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Manager - Show below if files exist */}
        {showFileManager && (
          <div className="mt-12" id="file-manager">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Your Files</h3>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading files...</p>
                </div>
              ) : files.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {files.map((file: any) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No files uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
