import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, ArrowRight, Globe, Mail, Shield, Clock, Zap, ArrowLeft, Link, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [downloadCode, setDownloadCode] = useState('');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload state management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<'initial' | 'uploading' | 'sharing' | 'waiting'>('initial');
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);
  const [sharingMethod, setSharingMethod] = useState<'code' | 'link' | 'email'>('code');
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds
  
  // Receive state management
  const [receiveStep, setReceiveStep] = useState<'initial' | 'loading' | 'found'>('initial');
  const [foundFile, setFoundFile] = useState<any>(null);

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
      setUploadedFileData(data);
      setUploadStep('sharing');
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setUploadStep('initial');
      setSelectedFile(null);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStep('uploading');
      uploadMutation.mutate(file);
    }
  };

  const handleSharingMethodSelect = (method: 'code' | 'link' | 'email') => {
    setSharingMethod(method);
    if (method === 'code') {
      setUploadStep('waiting');
      // Start countdown timer
      setTimeLeft(30 * 60);
    }
  };

  // Timer effect for countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadStep === 'waiting' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [uploadStep, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setUploadStep('initial');
    setUploadedFileData(null);
    setSharingMethod('code');
    setTimeLeft(30 * 60);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadCode.trim()) return;

    setReceiveStep('loading');
    
    try {
      const response = await fetch(`/api/file/${downloadCode}`);
      
      if (response.ok) {
        const fileData = await response.json();
        setFoundFile(fileData);
        setReceiveStep('found');
      } else {
        const error = await response.json();
        toast({
          title: "File not found",
          description: error.message || "Invalid code or file expired.",
          variant: "destructive",
        });
        setReceiveStep('initial');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      setReceiveStep('initial');
    }
  };

  const handleDownload = async () => {
    if (!foundFile) return;
    
    try {
      const response = await fetch(`/api/download/${downloadCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = foundFile.original_name || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: "Your file is being downloaded.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Download failed",
          description: error.message || "File not found or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = () => {
    if (uploadedFileData?.code) {
      navigator.clipboard.writeText(uploadedFileData.code);
      toast({
        title: "Code copied!",
        description: "Share code copied to clipboard.",
      });
    }
  };

  const resetReceiveState = () => {
    setReceiveStep('initial');
    setFoundFile(null);
    setDownloadCode('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-foreground mb-6">
              Share Files Securely
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Upload files up to 200MB and share them with unique codes. Files automatically delete after 30 minutes for your security.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
          
          {/* Send Section */}
          <div className="space-y-6">
            <div className="bg-card rounded-3xl border border-border shadow-lg p-8 hover:shadow-xl transition-all duration-300" style={{ minHeight: uploadStep === 'initial' ? '200px' : 'auto' }}>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
                data-testid="input-file-upload"
              />
              
              {uploadStep === 'initial' && (
                <>
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Upload File</h2>
                  <div 
                    className="cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center h-32 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/10"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-send"
                  >
                    <Plus className="w-20 h-20 text-primary mb-2" />
                    <span className="text-primary font-medium">Click to upload</span>
                  </div>
                </>
              )}

              {uploadStep === 'uploading' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Uploading...</h2>
                  <div className="space-y-4">
                    <div className="text-base font-medium text-gray-700 truncate p-3 bg-gray-50 rounded-lg" data-testid="text-filename">
                      {selectedFile?.name}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-base text-gray-600">Uploading file...</span>
                    </div>
                  </div>
                </>
              )}

              {uploadStep === 'sharing' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Choose sharing method</h2>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={resetUploadState}
                      data-testid="button-reset"
                      className="hover:bg-gray-100 rounded-xl"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="text-base font-medium text-gray-700 mb-6 p-3 bg-gray-50 rounded-lg truncate" data-testid="text-uploaded-filename">
                    {selectedFile?.name}
                  </div>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-16 text-lg border-2 hover:border-primary hover:bg-primary/5 rounded-xl"
                      onClick={() => handleSharingMethodSelect('code')}
                      data-testid="button-share-code"
                    >
                      <QrCode className="w-6 h-6 mr-4" />
                      <div className="text-left">
                        <div className="font-semibold">6-digit code</div>
                        <div className="text-sm text-gray-500">Free</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-16 text-lg border-2 hover:border-primary hover:bg-primary/5 rounded-xl disabled:opacity-50"
                      onClick={() => handleSharingMethodSelect('link')}
                      disabled={!user}
                      data-testid="button-share-link"
                    >
                      <Link className="w-6 h-6 mr-4" />
                      <div className="text-left">
                        <div className="font-semibold">Direct link</div>
                        <div className="text-sm text-gray-500">{!user ? 'Login required' : 'Premium feature'}</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-16 text-lg border-2 hover:border-primary hover:bg-primary/5 rounded-xl disabled:opacity-50"
                      onClick={() => handleSharingMethodSelect('email')}
                      disabled={!user}
                      data-testid="button-share-email"
                    >
                      <Mail className="w-6 h-6 mr-4" />
                      <div className="text-left">
                        <div className="font-semibold">Email</div>
                        <div className="text-sm text-gray-500">{!user ? 'Login required' : 'Premium feature'}</div>
                      </div>
                    </Button>
                  </div>
                </>
              )}

              {uploadStep === 'waiting' && uploadedFileData && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={resetUploadState}
                      data-testid="button-back"
                      className="hover:bg-gray-100 rounded-xl"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Waiting...
                    </Button>
                  </div>
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-700">
                        Enter the 6-digit key on the receiving device
                      </p>
                      <p className="text-base text-red-600 font-semibold">
                        Expires in <span data-testid="text-timer" className="font-bold">{formatTime(timeLeft)}</span>
                      </p>
                    </div>
                    
                    {/* 6-digit code display */}
                    <div className="flex justify-center space-x-3 my-8">
                      {uploadedFileData.code.split('').map((digit: string, index: number) => (
                        <div 
                          key={index}
                          className="w-16 h-16 border-2 border-primary/30 bg-primary/5 rounded-xl flex items-center justify-center text-3xl font-bold text-primary shadow-sm"
                          data-testid={`digit-${index}`}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    {/* QR Code placeholder and Copy button */}
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-40 h-40 border-2 border-gray-200 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <QrCode className="w-20 h-20 text-gray-400" />
                      </div>
                      <Button 
                        onClick={handleCopyCode}
                        variant="outline"
                        className="w-full h-14 text-lg font-semibold border-2 hover:border-primary hover:bg-primary/5 rounded-xl"
                        data-testid="button-copy-code"
                      >
                        <Copy className="w-5 h-5 mr-3" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
          
          {/* Receive Section */}
          <div className="space-y-6">
            <div className="bg-card rounded-3xl border border-border shadow-lg p-8 hover:shadow-xl transition-all duration-300" style={{ minHeight: receiveStep === 'initial' ? '200px' : 'auto' }}>
              {receiveStep === 'initial' && (
                <>
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Download File</h2>
                  <form onSubmit={handleCodeSubmit} className="space-y-6">
                    <Input
                      id="download-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={downloadCode}
                      onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="text-xl font-mono text-center bg-muted border border-border focus:border-primary rounded-xl h-16 tracking-widest"
                      data-testid="input-download-code"
                    />
                    <Button type="submit" className="w-full h-16 text-lg font-semibold" data-testid="button-search">
                      <Download className="w-5 h-5 mr-2" />
                      Download
                    </Button>
                  </form>
                </>
              )}

              {receiveStep === 'loading' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Searching...</h2>
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-base text-gray-600">Looking for file...</span>
                  </div>
                </>
              )}

              {receiveStep === 'found' && foundFile && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">File Found</h2>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={resetReceiveState}
                      data-testid="button-back-receive"
                      className="hover:bg-gray-100 rounded-xl"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="space-y-5">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-base font-medium text-gray-700 truncate" data-testid="text-found-filename">
                        <strong className="text-gray-900">Name:</strong> {foundFile.original_name}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Size</div>
                        <div className="text-base font-bold text-blue-700">{(foundFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm font-medium text-orange-900">Expires</div>
                        <div className="text-base font-bold text-orange-700">{new Date(foundFile.expires_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownload}
                      className="w-full h-16 bg-primary text-white hover:bg-primary/90 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      data-testid="button-download-file"
                    >
                      <Download className="w-6 h-6 mr-3" />
                      Download File
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          </div>
          
          {/* Features Section */}
          <div className="mt-20">
            <h2 className="text-4xl font-bold text-center text-foreground mb-12">Why choose BOLT?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Secure</h3>
                <p className="text-muted-foreground">End-to-end encryption for all files</p>
              </div>
              <div className="text-center p-8 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Temporary</h3>
                <p className="text-muted-foreground">Auto-delete after 30 minutes</p>
              </div>
              <div className="text-center p-8 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow">
                <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Accessible</h3>
                <p className="text-muted-foreground">Access from anywhere</p>
              </div>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
}
