import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, X, Edit, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface PhotoUploadProps {
  photos: string[];
  onPhotosUpdate: (photos: string[]) => void;
  maxPhotos?: number;
}

// Compress image before upload
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export function PhotoUpload({ photos, onPhotosUpdate, maxPhotos = 6 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadPhoto = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);
      setUploadProgress(10);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Show compressing status
      setUploadProgress(20);

      // Compress the image
      let fileToUpload: Blob | File = file;
      if (file.size > 500 * 1024) { // Compress if larger than 500KB
        try {
          fileToUpload = await compressImage(file);
          setUploadProgress(50);
        } catch (compressError) {
          console.warn('Compression failed, using original file:', compressError);
          // Continue with original file if compression fails
        }
      } else {
        setUploadProgress(50);
      }

      // Check final size (allow up to 5MB after compression attempt)
      if (fileToUpload.size > 5 * 1024 * 1024) {
        throw new Error('Image is too large. Please select a smaller image.');
      }

      // Create a unique filename
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      setUploadProgress(60);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileToUpload, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add to photos array
      const newPhotos = [...photos, publicUrl];
      onPhotosUpdate(newPhotos);

      setUploadProgress(90);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setUploadProgress(100);

      toast({
        title: 'Photo uploaded',
        description: 'Your photo has been added successfully.',
      });

    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload photo. Please try again.',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    if (!user) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const filePath = `${user.id}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Remove from photos array
      const newPhotos = photos.filter(photo => photo !== photoUrl);
      onPhotosUpdate(newPhotos);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Photo deleted',
        description: 'Your photo has been removed.',
      });

    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message || 'Failed to delete photo. Please try again.',
      });
    }

    setShowDeleteDialog(null);
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    onPhotosUpdate(newPhotos);

    // Update database
    if (user) {
      supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('user_id', user.id);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Photos</h3>
          <p className="text-sm text-muted-foreground">
            Add up to {maxPhotos} photos. First photo will be your main profile picture.
          </p>
        </div>
        {photos.length < maxPhotos && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
            className="flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {uploading ? 'Uploading...' : 'Add Photo'}
          </Button>
        )}
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {uploadProgress < 50 ? 'Compressing image...' : 'Uploading...'}
            </span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo}
            className="relative group aspect-square bg-muted rounded-lg overflow-hidden"
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            
            {/* Main photo badge */}
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">
                Main
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-white hover:bg-red-500/50"
                onClick={() => setShowDeleteDialog(photo)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Drag handle for reordering */}
            {photos.length > 1 && (
              <div className="absolute top-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-black/50 rounded flex items-center justify-center">
                  <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add photo placeholder */}
        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square bg-muted rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
            <span className="text-sm">Add Photo</span>
          </button>
        )}
      </div>

      {/* Photo viewer dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={selectedPhoto}
                alt="Selected photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && deletePhoto(showDeleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}