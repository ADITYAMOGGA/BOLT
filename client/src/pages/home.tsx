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
      
      {/* Top Announcement Bar */}
      <div className="bg-accent border-2 border-border py-3">
        <div className="container mx-auto px-4 text-center">
          <span className="text-sm font-medium text-accent-foreground">🎉 New plans are newly released!</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 border-2 border-border bg-background/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-6xl mx-auto">
          
          {/* Left Panel - Core Action Area */}
          <div className="space-y-8 w-full max-w-lg mx-auto lg:mx-0 p-6 border-2 border-border bg-background/30 rounded-2xl">
            {/* Send Box - Dynamic content based on upload state */}
            <div className="bg-white rounded-2xl border-2 border-border shadow-xl p-8 w-full transition-all duration-300 hover:shadow-2xl" style={{ minHeight: uploadStep === 'initial' ? '160px' : 'auto' }}>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Send</h2>
                  <div 
                    className="cursor-pointer hover:scale-105 transition-all duration-300 flex items-center justify-center h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-send"
                  >
                    <Plus className="w-16 h-16 text-primary" />
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

            {/* Receive Box - Dynamic content based on receive state */}
            <div className="bg-white rounded-2xl border-2 border-border shadow-xl p-8 w-full transition-all duration-300 hover:shadow-2xl" style={{ minHeight: receiveStep === 'initial' ? '160px' : 'auto' }}>
              {receiveStep === 'initial' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Receive</h2>
                  <form onSubmit={handleCodeSubmit}>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="download-code"
                        type="text"
                        placeholder="Enter 6-digit key"
                        value={downloadCode}
                        onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="flex-1 text-lg font-medium text-gray-700 bg-gray-50 border-2 border-gray-200 focus:border-primary rounded-xl h-14 px-4"
                        data-testid="input-download-code"
                      />
                      <Button type="submit" variant="default" size="lg" className="px-6 h-14 bg-primary hover:bg-primary/90" data-testid="button-search">
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
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

          {/* Right Panel - Introduction & Features */}
          <div className="space-y-10 lg:pl-8 p-6 border-2 border-border bg-primary/20 rounded-2xl">
            {/* Main Introduction */}
            <div className="text-center lg:text-left p-6 border-2 border-border bg-background/40 rounded-xl">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
                Want to send larger files securely?
              </h1>
              <p className="text-foreground/80 text-xl lg:text-2xl mb-10 leading-relaxed">
                BOLT makes file sharing simple and secure. Upload files up to 200MB, share them with unique codes, and they automatically delete after 30 minutes for your security.
              </p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 py-6 text-xl rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-see-features">
                See more features
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>

            {/* Feature Illustration */}
            <div className="bg-background/60 backdrop-blur-sm rounded-3xl p-8 text-center border-2 border-border">
              <div className="w-20 h-20 bg-primary rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 border-2 border-border">
                <Zap className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="bg-white rounded-2xl border-2 border-border shadow-lg p-6 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-medium text-foreground">Secure Transfer</span>
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div className="bg-muted rounded-full h-3 mb-4 border border-border">
                  <div className="bg-primary rounded-full h-3 w-3/4 transition-all duration-500"></div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">Upload complete • Code: ABC123</span>
              </div>
            </div>

            {/* Quick Features */}
            <div className="bg-background/60 backdrop-blur-sm rounded-3xl p-8 border-2 border-border">
              <h3 className="font-bold text-2xl text-foreground mb-8">Why choose BOLT?</h3>
              <div className="space-y-6">
                <div className="flex items-center p-4 bg-primary/20 rounded-xl border-2 border-border">
                  <Shield className="w-8 h-8 text-green-600 mr-5" />
                  <span className="text-foreground text-xl font-medium">End-to-end encryption</span>
                </div>
                <div className="flex items-center p-4 bg-primary/20 rounded-xl border-2 border-border">
                  <Clock className="w-8 h-8 text-blue-600 mr-5" />
                  <span className="text-foreground text-xl font-medium">30-minute auto-deletion</span>
                </div>
                <div className="flex items-center p-4 bg-primary/20 rounded-xl border-2 border-border">
                  <Globe className="w-8 h-8 text-purple-600 mr-5" />
                  <span className="text-foreground text-xl font-medium">Access from anywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Language Selector - Bottom Right */}
        <div className="fixed bottom-6 right-6">
          <Button variant="ghost" size="lg" className="text-foreground hover:text-primary bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full p-4 border-2 border-border">
            <Globe className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
