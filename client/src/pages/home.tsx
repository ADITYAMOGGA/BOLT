import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, ArrowRight, Globe, Mail, Shield, Clock, Zap, ArrowLeft, Link, QrCode, Copy, CheckCircle, Upload, FileText, Users, Star } from 'lucide-react';
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
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  
  // Receive state management
  const [receiveStep, setReceiveStep] = useState<'initial' | 'loading' | 'found'>('initial');
  const [foundFile, setFoundFile] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            setUploadedBytes(event.loaded);
            
            // Calculate upload speed
            const currentTime = Date.now();
            const timeElapsed = (currentTime - uploadStartTime) / 1000; // seconds
            if (timeElapsed > 0) {
              const speed = event.loaded / timeElapsed; // bytes per second
              setUploadSpeed(speed);
            }
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`${xhr.status}: ${xhr.responseText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });
        
        xhr.open('POST', '/api/upload');
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      setUploadedFileData(data);
      setUploadStep('sharing');
      // Reset progress states
      setUploadProgress(0);
      setUploadSpeed(0);
      setUploadedBytes(0);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setUploadStep('initial');
      setSelectedFile(null);
      // Reset progress states
      setUploadProgress(0);
      setUploadSpeed(0);
      setUploadedBytes(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStep('uploading');
      setUploadStartTime(Date.now());
      setUploadProgress(0);
      setUploadSpeed(0);
      setUploadedBytes(0);
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
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadedBytes(0);
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
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Main Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-md mb-6">
              <Zap className="w-5 h-5 text-primary mr-2" />
              <span className="text-sm font-semibold text-foreground">Fast & Secure File Sharing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Share files instantly,<br />
              <span className="text-primary">anywhere in the world</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload files up to 200MB and share them with unique codes. Files automatically delete after 30 minutes for your security.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            
            {/* Upload Section */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-border/20 hover:shadow-3xl transition-all duration-300">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
                data-testid="input-file-upload"
              />
              
              {uploadStep === 'initial' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Send Files</h2>
                  <p className="text-muted-foreground mb-8">
                    Drag & drop or click to upload your files
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-14 text-lg font-semibold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-send"
                  >
                    <Plus className="w-6 h-6 mr-3" />
                    Choose File
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Max file size: 200MB
                  </p>
                </div>
              )}

              {uploadStep === 'uploading' && (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Uploading...</h2>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{selectedFile?.name}</p>
                    </div>
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">{uploadProgress}% Complete</span>
                      <span className="text-sm text-muted-foreground">
                        {uploadSpeed > 0 ? (
                          uploadSpeed > 1024 * 1024 
                            ? `${(uploadSpeed / (1024 * 1024)).toFixed(1)} MB/s`
                            : uploadSpeed > 1024
                            ? `${(uploadSpeed / 1024).toFixed(1)} KB/s`
                            : `${uploadSpeed.toFixed(0)} B/s`
                        ) : 'Calculating...'}
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary/80 h-4 rounded-full transition-all duration-300 ease-out relative"
                        style={{ width: `${uploadProgress}%` }}
                        data-testid="upload-progress-bar"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {uploadedBytes > 0 && selectedFile ? (
                          `${(uploadedBytes / (1024 * 1024)).toFixed(1)} MB of ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                        ) : (
                          'Preparing upload...'
                        )}
                      </span>
                      <span>
                        {uploadSpeed > 0 && selectedFile && uploadedBytes > 0 ? (
                          `ETA: ${Math.max(0, Math.ceil((selectedFile.size - uploadedBytes) / uploadSpeed))}s`
                        ) : (
                          'Calculating...'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 'sharing' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Choose sharing method</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUploadState}
                      data-testid="button-reset"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile?.name}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-16 text-left border-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => handleSharingMethodSelect('code')}
                      data-testid="button-share-code"
                    >
                      <QrCode className="w-6 h-6 mr-4 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">6-digit code</div>
                        <div className="text-sm text-muted-foreground">Free & secure</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start h-16 text-left border-2 hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                      onClick={() => handleSharingMethodSelect('link')}
                      disabled={!user}
                      data-testid="button-share-link"
                    >
                      <Link className="w-6 h-6 mr-4 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">Direct link</div>
                        <div className="text-sm text-muted-foreground">{!user ? 'Login required' : 'Premium feature'}</div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {uploadStep === 'waiting' && uploadedFileData && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUploadState}
                      data-testid="button-back"
                      className="absolute left-4 top-4 text-muted-foreground"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-foreground mb-2">File ready to share!</h2>
                  <p className="text-muted-foreground mb-6">
                    Share this code with the recipient
                  </p>
                  
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 mb-6">
                    <div className="flex justify-center space-x-2 mb-4">
                      {uploadedFileData.code.split('').map((digit: string, index: number) => (
                        <div 
                          key={index}
                          className="w-12 h-12 bg-white border-2 border-primary/20 rounded-xl flex items-center justify-center text-2xl font-bold text-primary shadow-sm"
                          data-testid={`digit-${index}`}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={handleCopyCode}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white"
                      data-testid="button-copy-code"
                    >
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Expires in <span className="font-semibold ml-1" data-testid="text-timer">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download Section */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-border/20 hover:shadow-3xl transition-all duration-300">
              {receiveStep === 'initial' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Download className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Receive Files</h2>
                  <p className="text-muted-foreground mb-8">
                    Enter the 6-digit code to download files
                  </p>
                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={downloadCode}
                      onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="h-14 text-center text-2xl font-bold tracking-widest bg-secondary/30 border-2 border-border focus:border-primary rounded-xl"
                      data-testid="input-download-code"
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-semibold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      data-testid="button-search"
                    >
                      <Download className="w-6 h-6 mr-3" />
                      Find File
                    </Button>
                  </form>
                </div>
              )}

              {receiveStep === 'loading' && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Searching...</h2>
                  <p className="text-muted-foreground">Looking for your file</p>
                </div>
              )}

              {receiveStep === 'found' && foundFile && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">File Found!</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetReceiveState}
                      data-testid="button-back-receive"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-xl p-6 mb-6">
                    <div className="flex items-center mb-4">
                      <FileText className="w-8 h-8 text-primary mr-3" />
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{foundFile.original_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(foundFile.size / 1024 / 1024).toFixed(2)} MB • 
                          Expires at {new Date(foundFile.expires_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full h-16 bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-download-file"
                  >
                    <Download className="w-6 h-6 mr-3" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white/50 rounded-2xl border border-border/20">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Files auto-delete after 30 minutes</p>
            </div>
            
            <div className="text-center p-6 bg-white/50 rounded-2xl border border-border/20">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Upload & share in seconds</p>
            </div>
            
            <div className="text-center p-6 bg-white/50 rounded-2xl border border-border/20">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">No registration required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}