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
            {/* Send Box - Dynamic content based on upload state */}
            <div className="bg-white rounded-xl shadow-lg p-6 w-96" style={{ minHeight: uploadStep === 'initial' ? '144px' : 'auto' }}>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Send</h2>
                  <div 
                    className="cursor-pointer hover:scale-105 transition-transform flex items-center justify-center h-16"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-send"
                  >
                    <Plus className="w-12 h-12 text-primary" />
                  </div>
                </>
              )}

              {uploadStep === 'uploading' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploading...</h2>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 truncate" data-testid="text-filename">
                      {selectedFile?.name}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-500">Uploading file...</span>
                    </div>
                  </div>
                </>
              )}

              {uploadStep === 'sharing' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Choose sharing method</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUploadState}
                      data-testid="button-reset"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 mb-4 truncate" data-testid="text-uploaded-filename">
                    {selectedFile?.name}
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSharingMethodSelect('code')}
                      data-testid="button-share-code"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      6-digit code (Free)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSharingMethodSelect('link')}
                      disabled={!user}
                      data-testid="button-share-link"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Direct link {!user && '(Login required)'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSharingMethodSelect('email')}
                      disabled={!user}
                      data-testid="button-share-email"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email {!user && '(Login required)'}
                    </Button>
                  </div>
                </>
              )}

              {uploadStep === 'waiting' && uploadedFileData && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUploadState}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Waiting...
                    </Button>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit key on the receiving device
                    </p>
                    <p className="text-sm text-red-600">
                      Expires in <span data-testid="text-timer">{formatTime(timeLeft)}</span>
                    </p>
                    
                    {/* 6-digit code display */}
                    <div className="flex justify-center space-x-2 my-6">
                      {uploadedFileData.code.split('').map((digit: string, index: number) => (
                        <div 
                          key={index}
                          className="w-12 h-12 border-2 border-gray-200 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-800"
                          data-testid={`digit-${index}`}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    {/* QR Code placeholder and Copy button */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                      <Button 
                        onClick={handleCopyCode}
                        variant="outline"
                        className="w-full"
                        data-testid="button-copy-code"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Receive Box - Dynamic content based on receive state */}
            <div className="bg-white rounded-xl shadow-lg p-6 w-96" style={{ minHeight: receiveStep === 'initial' ? '144px' : 'auto' }}>
              {receiveStep === 'initial' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Receive</h2>
                  <form onSubmit={handleCodeSubmit}>
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
                      <Button type="submit" variant="ghost" size="sm" className="p-2" data-testid="button-search">
                        <Download className="w-5 h-5 text-gray-400" />
                      </Button>
                    </div>
                  </form>
                </>
              )}

              {receiveStep === 'loading' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Searching...</h2>
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm text-gray-500">Looking for file...</span>
                  </div>
                </>
              )}

              {receiveStep === 'found' && foundFile && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">File Found</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetReceiveState}
                      data-testid="button-back-receive"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 truncate" data-testid="text-found-filename">
                      <strong>Name:</strong> {foundFile.original_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Size:</strong> {(foundFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Expires:</strong> {new Date(foundFile.expires_at).toLocaleString()}
                    </div>
                    <Button
                      onClick={handleDownload}
                      className="w-full bg-primary text-white hover:bg-primary/90"
                      data-testid="button-download-file"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </>
              )}
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
                BOLT makes file sharing simple and secure. Upload files up to 200MB, share them with unique codes, and they automatically delete after 30 minutes for your security.
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
                  <span className="text-white text-lg">30-minute auto-deletion</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-6 h-6 text-purple-400 mr-4" />
                  <span className="text-white text-lg">Access from anywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>



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
