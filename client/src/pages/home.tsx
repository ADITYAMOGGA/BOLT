import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Navigation } from '@/components/navigation';
import { UploadOptions, type UploadOptions as UploadOptionsType } from '@/components/upload-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Eye, ArrowRight, Globe, Mail, Shield, Clock, Zap, ArrowLeft, Link, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [downloadCode, setDownloadCode] = useState('');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload state management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<'initial' | 'uploading' | 'sharing' | 'waiting'>('initial');
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);
  const [sharingMethod, setSharingMethod] = useState<'code' | 'link' | 'email'>('code');
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  
  // Receive state management
  const [receiveStep, setReceiveStep] = useState<'initial' | 'loading' | 'found'>('initial');
  const [foundFile, setFoundFile] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options?: UploadOptionsType }) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add upload options to form data
        if (options?.password) {
          formData.append('password', options.password);
        }
        if (options?.maxDownloads) {
          formData.append('maxDownloads', options.maxDownloads.toString());
        }
        if (options?.expirationType) {
          formData.append('expirationType', options.expirationType);
        }
        if (options?.customMessage) {
          formData.append('customMessage', options.customMessage);
        }
        
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
      setShowUploadOptions(true);
    }
  };

  const handleUploadWithOptions = (file: File, options: UploadOptionsType) => {
    setShowUploadOptions(false);
    setUploadStep('uploading');
    setUploadStartTime(Date.now());
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadedBytes(0);
    uploadMutation.mutate({ file, options });
  };

  const handleUploadCancel = () => {
    setShowUploadOptions(false);
    setSelectedFile(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="min-h-screen bg-background relative">
      {/* Layout Grid Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/4 w-px h-full bg-border/30"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-border/50"></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-border/30"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-border/30"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-border/30"></div>
      </div>
      <Navigation />
      

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 max-w-7xl mx-auto relative">
          {/* Premium Central Divider */}
          <div className="hidden lg:block absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>
          <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-card border-2 border-primary/50 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          {/* Left Panel - Core Action Area */}
          <div className="space-y-8 w-full max-w-sm mx-auto lg:mx-0 lg:ml-[-2rem] animate-slide-in-left">
            {/* Section Label */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-px bg-primary mr-4"></div>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('actions.title')}</span>
              <div className="flex-1 h-px bg-border/50 ml-4"></div>
            </div>
            {/* Send Box - Dynamic content based on upload state */}
            <div className="bg-card backdrop-blur-sm rounded-2xl border-2 border-border shadow-2xl p-8 w-full transition-all duration-500 hover:shadow-3xl hover:border-primary/50 hover:-translate-y-1 relative overflow-hidden" style={{ minHeight: uploadStep === 'initial' ? '240px' : 'auto' }}>
              {/* Card Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
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
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground mb-2">{t('send.title')}</h2>
                      <p className="text-sm text-foreground/70">{t('send.description')}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div 
                    className="group cursor-pointer transition-all duration-500 flex items-center justify-center h-28 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/10 rounded-2xl border-2 border-dashed border-primary/50 hover:border-primary hover:bg-gradient-to-br hover:from-primary/15 hover:via-primary/25 hover:to-primary/15 relative overflow-hidden z-10"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-send"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Plus className="w-20 h-20 text-primary group-hover:scale-110 transition-transform duration-300 relative z-10" />
                  </div>
                </>
              )}

              {uploadStep === 'uploading' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('upload.uploading')}</h2>
                  <div className="space-y-4">
                    <div className="text-base font-medium text-gray-700 truncate p-3 bg-gray-50 rounded-lg" data-testid="text-filename">
                      {selectedFile?.name}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{uploadProgress}% {t('upload.complete')}</span>
                        <span className="text-gray-600">
                          {uploadSpeed > 0 ? (
                            uploadSpeed > 1024 * 1024 
                              ? `${(uploadSpeed / (1024 * 1024)).toFixed(1)} MB/s`
                              : uploadSpeed > 1024
                              ? `${(uploadSpeed / 1024).toFixed(1)} KB/s`
                              : `${uploadSpeed.toFixed(0)} B/s`
                          ) : '---'}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-300 ease-out relative"
                          style={{ width: `${uploadProgress}%` }}
                          data-testid="upload-progress-bar"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>
                          {uploadedBytes > 0 && selectedFile ? (
                            `${(uploadedBytes / (1024 * 1024)).toFixed(1)} MB of ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                          ) : (
                            t('upload.preparing')
                          )}
                        </span>
                        <span>
                          {uploadSpeed > 0 && selectedFile && uploadedBytes > 0 ? (
                            `ETA: ${Math.max(0, Math.ceil((selectedFile.size - uploadedBytes) / uploadSpeed))}s`
                          ) : (
                            t('upload.calculating')
                          )}
                        </span>
                      </div>
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
            <div className="bg-card backdrop-blur-sm rounded-2xl border-2 border-border shadow-2xl p-8 w-full transition-all duration-500 hover:shadow-3xl hover:border-primary/50 hover:-translate-y-1 relative overflow-hidden" style={{ minHeight: receiveStep === 'initial' ? '240px' : 'auto' }}>
              {/* Card Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
              {receiveStep === 'initial' && (
                <>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground mb-2">{t('receive.title')}</h2>
                      <p className="text-sm text-foreground/70">{t('receive.description')}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Download className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <form onSubmit={handleCodeSubmit}>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="download-code"
                        type="text"
                        placeholder={t('receive.placeholder')}
                        value={downloadCode}
                        onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="flex-1 text-lg font-mono font-bold text-foreground bg-background/80 border-2 border-border/50 focus:border-primary rounded-xl h-16 px-6 tracking-widest placeholder:text-muted-foreground/50 backdrop-blur-sm"
                        data-testid="input-download-code"
                      />
                      <Button type="submit" variant="default" size="lg" className="px-8 h-16 bg-primary hover:bg-primary/90 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="button-search">
                        <Download className="w-6 h-6" />
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
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate(`/d/${foundFile.code}`)}
                        variant="outline"
                        className="w-full h-14 border-primary text-primary hover:bg-primary/10 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        data-testid="button-preview-file"
                      >
                        <Eye className="w-5 h-5 mr-3" />
                        Preview & Download
                      </Button>
                      <Button
                        onClick={handleDownload}
                        className="w-full h-16 bg-primary text-white hover:bg-primary/90 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        data-testid="button-download-file"
                      >
                        <Download className="w-6 h-6 mr-3" />
                        Download Directly
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Introduction & Features */}
          <div className="space-y-12 lg:pl-12 border-l border-border/30 lg:border-l lg:pl-16 relative animate-slide-in-right">
            {/* Section Label */}
            <div className="flex items-center mb-8">
              <div className="w-12 h-px bg-primary mr-4"></div>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('overview.title')}</span>
              <div className="flex-1 h-px bg-border/50 ml-4"></div>
            </div>
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="text-center p-4 bg-card backdrop-blur-sm rounded-xl border border-border shadow-lg animate-stagger opacity-0">
                <div className="text-2xl font-bold text-primary mb-1">256-bit</div>
                <div className="text-xs text-foreground/70 uppercase tracking-wide">{t('stats.encryption')}</div>
              </div>
              <div className="text-center p-4 bg-card backdrop-blur-sm rounded-xl border border-border shadow-lg animate-stagger opacity-0">
                <div className="text-2xl font-bold text-primary mb-1">200MB</div>
                <div className="text-xs text-foreground/70 uppercase tracking-wide">{t('stats.maxSize')}</div>
              </div>
              <div className="text-center p-4 bg-card backdrop-blur-sm rounded-xl border border-border shadow-lg animate-stagger opacity-0">
                <div className="text-2xl font-bold text-primary mb-1">24hrs</div>
                <div className="text-xs text-foreground/70 uppercase tracking-wide">{t('stats.autoDelete')}</div>
              </div>
            </div>
            
            {/* Main Introduction */}
            <div className="text-left p-8 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl border border-border/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full border border-primary/20 mb-6">
                  <Shield className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium text-primary">Enterprise Security</span>
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Professional File
                  <br />
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Sharing Platform</span>
                </h2>
                
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-lg">
                  Enterprise-grade security meets simplicity. Share files instantly with military-level encryption, automatic expiration, and zero-knowledge architecture.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="button-see-features">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="outline" className="border-border hover:bg-muted font-medium px-8 py-4 rounded-xl transition-all duration-300">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>

            {/* Feature Showcase */}
            <div className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-3xl p-8 border border-border/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20"></div>
              <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Live Transfer Demo</h3>
                    <p className="text-sm text-muted-foreground">Real-time progress tracking</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="font-semibold text-foreground">document.pdf</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 mr-1" />
                      <span>Encrypted</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono font-bold text-primary">87%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-1000 relative" style={{width: '87%'}}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>2.1 MB/s</span>
                      <span>Code: XYZ789</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Features Grid */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground mb-8">Enterprise Features</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="group bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm p-6 rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center relative z-10">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mr-4">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Military-Grade Encryption</h4>
                      <p className="text-sm text-muted-foreground">AES-256 encryption for maximum security</p>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm p-6 rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center relative z-10">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mr-4">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Auto-Expiration</h4>
                      <p className="text-sm text-muted-foreground">Files automatically delete after 24 hours</p>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm p-6 rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center relative z-10">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mr-4">
                      <Globe className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Global Access</h4>
                      <p className="text-sm text-muted-foreground">Access your files from anywhere, anytime</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Options Modal */}
      <UploadOptions
        isOpen={showUploadOptions}
        onClose={handleUploadCancel}
        onUpload={handleUploadWithOptions}
        file={selectedFile}
        isUploading={uploadMutation.isPending}
      />
    </div>
  );
}
