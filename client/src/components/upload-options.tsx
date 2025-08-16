import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Lock, Clock, Download, MessageSquare, Settings, X } from 'lucide-react';

interface UploadOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, options: UploadOptions) => void;
  file: File | null;
  isUploading: boolean;
}

export interface UploadOptions {
  password?: string;
  maxDownloads?: number;
  expirationType: '1h' | '6h' | '24h' | '7d' | '30d' | 'never';
  customMessage?: string;
}

export function UploadOptions({ isOpen, onClose, onUpload, file, isUploading }: UploadOptionsProps) {
  const [options, setOptions] = useState<UploadOptions>({
    expirationType: '24h'
  });
  const [usePassword, setUsePassword] = useState(false);
  const [useDownloadLimit, setUseDownloadLimit] = useState(false);
  const [useCustomMessage, setUseCustomMessage] = useState(false);

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOptions: UploadOptions = {
      expirationType: options.expirationType,
      ...(usePassword && options.password && { password: options.password }),
      ...(useDownloadLimit && options.maxDownloads && { maxDownloads: options.maxDownloads }),
      ...(useCustomMessage && options.customMessage && { customMessage: options.customMessage }),
    };
    onUpload(file, finalOptions);
  };

  const expirationLabels: Record<string, string> = {
    '1h': '1 hour',
    '6h': '6 hours', 
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
    'never': 'Never (permanent)'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Upload Options
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Expiration Settings */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Expiration Time
              </Label>
              <Select
                value={options.expirationType}
                onValueChange={(value) => setOptions(prev => ({ 
                  ...prev, 
                  expirationType: value as UploadOptions['expirationType']
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expirationLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                File will be automatically deleted after this time
              </p>
            </div>

            <Separator />

            {/* Password Protection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password Protection
                </Label>
                <Switch
                  checked={usePassword}
                  onCheckedChange={setUsePassword}
                />
              </div>
              {usePassword && (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={options.password || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, password: e.target.value }))}
                    required={usePassword}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recipients will need this password to download the file
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Download Limit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download Limit
                </Label>
                <Switch
                  checked={useDownloadLimit}
                  onCheckedChange={setUseDownloadLimit}
                />
              </div>
              {useDownloadLimit && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="e.g., 5"
                    value={options.maxDownloads || ''}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      maxDownloads: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    required={useDownloadLimit}
                  />
                  <p className="text-xs text-muted-foreground">
                    File will be deleted after this many downloads
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Custom Message */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Custom Message
                </Label>
                <Switch
                  checked={useCustomMessage}
                  onCheckedChange={setUseCustomMessage}
                />
              </div>
              {useCustomMessage && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a message for recipients..."
                    value={options.customMessage || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, customMessage: e.target.value }))}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be shown on the download page
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                disabled={isUploading || (usePassword && !options.password)}
                className="w-full h-12 text-lg font-semibold"
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}