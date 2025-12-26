import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileText, Camera, Shield, CheckCircle, Clock, XCircle, Star } from 'lucide-react';

interface IDVerificationProps {
  onVerificationSubmitted?: () => void;
}

type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function IDVerification({ onVerificationSubmitted }: IDVerificationProps) {
  const [documentType, setDocumentType] = useState<string>('');
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('none');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Check existing verification status
  useState(() => {
    if (user) {
      checkVerificationStatus();
    }
  });

  const checkVerificationStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_verifications')
      .select('status, rejection_reason')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setVerificationStatus(data.status as VerificationStatus);
      setRejectionReason(data.rejection_reason);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please select an image file.',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Image must be less than 10MB.',
        });
        return;
      }
      setter(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage
      .from('verifications')
      .upload(path, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('verifications')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !documentType || !documentFront) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a document type and upload the front of your document.',
      });
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      
      // Upload front
      const frontPath = `${user.id}/${timestamp}-front.${documentFront.name.split('.').pop()}`;
      const frontUrl = await uploadFile(documentFront, frontPath);
      if (!frontUrl) throw new Error('Failed to upload document front');

      // Upload back if provided
      let backUrl = null;
      if (documentBack) {
        const backPath = `${user.id}/${timestamp}-back.${documentBack.name.split('.').pop()}`;
        backUrl = await uploadFile(documentBack, backPath);
      }

      // Upload selfie if provided
      let selfieUrl = null;
      if (selfie) {
        const selfiePath = `${user.id}/${timestamp}-selfie.${selfie.name.split('.').pop()}`;
        selfieUrl = await uploadFile(selfie, selfiePath);
      }

      // Create verification record
      const { error } = await supabase.from('user_verifications').insert({
        user_id: user.id,
        document_type: documentType,
        document_url: frontUrl,
        document_back_url: backUrl,
        selfie_url: selfieUrl,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Verification submitted',
        description: 'Your documents have been submitted for review. This usually takes 24-48 hours.',
      });

      setVerificationStatus('pending');
      setDialogOpen(false);
      onVerificationSubmitted?.();

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.message || 'Failed to submit verification. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-500">
            <Clock className="w-4 h-4" />
            <span>Verification pending review</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <Star className="w-4 h-4 fill-blue-500" />
            <span>ID Verified</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-4 h-4" />
              <span>Verification rejected</span>
            </div>
            {rejectionReason && (
              <p className="text-sm text-muted-foreground">{rejectionReason}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            ID Verification
          </h3>
          <p className="text-sm text-muted-foreground">
            Get a verification badge on your profile (optional)
          </p>
        </div>
      </div>

      {getStatusDisplay()}

      {(verificationStatus === 'none' || verificationStatus === 'rejected') && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {verificationStatus === 'rejected' ? 'Submit New Verification' : 'Verify Your ID'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ID Verification</DialogTitle>
              <DialogDescription>
                Upload a valid ID document to get a verification badge. Your documents will be reviewed within 24-48 hours.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type *</label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student_id">Student ID</SelectItem>
                    <SelectItem value="government_id">Government ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document Front */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Front *</label>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setDocumentFront)}
                  className="hidden"
                />
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {documentFront ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm">{documentFront.name}</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Click to upload front of document</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Back (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Back (Optional)</label>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setDocumentBack)}
                  className="hidden"
                />
                <div
                  onClick={() => backInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {documentBack ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm">{documentBack.name}</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Back of document (if applicable)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Selfie Verification (Optional)</label>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setSelfie)}
                  className="hidden"
                />
                <div
                  onClick={() => selfieInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {selfie ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Camera className="w-5 h-5" />
                      <span className="text-sm">{selfie.name}</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Take a selfie holding your ID</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={uploading || !documentType || !documentFront}>
                {uploading ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
