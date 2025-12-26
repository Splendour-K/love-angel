import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, X, Star, MessageCircle, User, Sparkles, ChevronLeft, ChevronRight, Info, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  university: string;
  course_of_study: string;
  year_of_study: number;
  photos: string[];
  interests: string[];
  relationship_goal: string;
  birth_date: string;
  gender: string;
  is_verified: boolean;
}

export default function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Photo gallery state
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Full profile view state
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfiles();
  }, [user, navigate]);

  const fetchProfiles = async () => {
    if (!user) return;

    try {
      // Get profiles excluding current user and already matched
      const { data: matchedIds } = await supabase
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', user.id);

      const excludeIds = [user.id, ...(matchedIds?.map(m => m.matched_user_id) || [])];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .eq('is_complete', true)
        .limit(20);

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean, superLike = false) => {
    if (!user || !profiles[currentIndex]) return;

    setSwipeDirection(liked ? 'right' : 'left');

    try {
      await supabase.from('matches').insert({
        user_id: user.id,
        matched_user_id: profiles[currentIndex].user_id,
        is_liked: liked,
        is_super_like: superLike,
      });

      // Check for mutual match
      if (liked) {
        const { data: mutualMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id', profiles[currentIndex].user_id)
          .eq('matched_user_id', user.id)
          .eq('is_liked', true)
          .single();

        if (mutualMatch) {
          toast({
            title: "It's a match! 💕",
            description: `You and ${profiles[currentIndex].display_name} liked each other!`,
          });

          // Create conversation
          await supabase.from('conversations').insert({
            user1_id: user.id,
            user2_id: profiles[currentIndex].user_id,
          });
        }
      }
    } catch (err) {
      console.error('Error recording swipe:', err);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 400);
  };

  const currentProfile = profiles[currentIndex];

  const getRelationshipLabel = (goal: string) => {
    const labels: Record<string, string> = {
      long_term: 'Looking for something serious',
      dating: 'Open to dating',
      friendship: 'Looking for friends',
      not_sure: 'Seeing where things go',
    };
    return labels[goal] || goal;
  };

  // Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Photo gallery navigation
  const openPhotoGallery = (index = 0) => {
    setCurrentPhotoIndex(index);
    setPhotoGalleryOpen(true);
  };

  const nextPhoto = () => {
    if (currentProfile?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev < currentProfile.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevPhoto = () => {
    if (currentProfile?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : currentProfile.photos.length - 1
      );
    }
  };

  // Open full profile view
  const openFullProfile = () => {
    setProfileSheetOpen(true);
  };

  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      {/* Main Content */}
      <main className="container mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Finding matches for you...</p>
            </div>
          </div>
        ) : !currentProfile ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                No More Profiles
              </h2>
              <p className="text-muted-foreground mb-6">
                You've seen everyone for now! Check back later for new students.
              </p>
              <Button variant="hero" onClick={fetchProfiles}>
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto">
            {/* Profile Card */}
            <div
              className={`relative bg-card rounded-3xl shadow-card overflow-hidden transition-all duration-400 ${
                swipeDirection === 'right'
                  ? 'animate-swipe-right'
                  : swipeDirection === 'left'
                  ? 'animate-swipe-left'
                  : ''
              }`}
            >
              {/* Photo - Tappable for gallery */}
              <div 
                className="aspect-[3/4] relative cursor-pointer"
                onClick={() => openPhotoGallery(0)}
              >
                {currentProfile.photos?.length > 0 ? (
                  <img
                    src={currentProfile.photos[0]}
                    alt={currentProfile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
                
                {/* Photo indicators */}
                {currentProfile.photos?.length > 1 && (
                  <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
                    {currentProfile.photos.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i === 0 ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Profile info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-display font-bold">
                      {currentProfile.display_name}
                      {currentProfile.birth_date && (
                        <span className="font-normal">, {calculateAge(currentProfile.birth_date)}</span>
                      )}
                    </h2>
                    {currentProfile.is_verified && (
                      <VerifiedBadge size="md" />
                    )}
                  </div>
                  <p className="text-sm opacity-90 mb-2">
                    {currentProfile.course_of_study} • Year {currentProfile.year_of_study}
                  </p>
                  <p className="text-sm opacity-80">
                    {currentProfile.university}
                  </p>
                </div>
                
                {/* Info button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFullProfile();
                  }}
                  className="absolute bottom-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Info className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                {currentProfile.bio && (
                  <p className="text-foreground">{currentProfile.bio}</p>
                )}
                
                {currentProfile.relationship_goal && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="w-4 h-4 text-primary" />
                    {getRelationshipLabel(currentProfile.relationship_goal)}
                  </div>
                )}

                {currentProfile.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.slice(0, 4).map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="icon"
                size="iconXl"
                onClick={() => handleSwipe(false)}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <X className="w-8 h-8" />
              </Button>
              
              <Button
                variant="icon"
                size="iconLg"
                onClick={() => handleSwipe(true, true)}
                className="hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground"
              >
                <Star className="w-6 h-6" />
              </Button>
              
              <Button
                variant="iconAction"
                size="iconXl"
                onClick={() => handleSwipe(true)}
                className="gradient-primary text-primary-foreground shadow-glow"
              >
                <Heart className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Photo Gallery Dialog */}
      <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/95 border-none">
          {currentProfile?.photos && currentProfile.photos.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <button
                onClick={() => setPhotoGalleryOpen(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Photo counter */}
              <div className="absolute top-4 left-4 z-50 text-white/90 text-sm bg-black/40 px-3 py-1 rounded-full">
                {currentPhotoIndex + 1} / {currentProfile.photos.length}
              </div>

              {/* Main photo */}
              <img
                src={currentProfile.photos[currentPhotoIndex]}
                alt={`${currentProfile.display_name} photo ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Navigation buttons */}
              {currentProfile.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Thumbnail strip */}
              {currentProfile.photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 p-2 rounded-lg">
                  {currentProfile.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-12 h-12 rounded-lg overflow-hidden transition-all ${
                        index === currentPhotoIndex 
                          ? 'ring-2 ring-white scale-105' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Profile Sheet */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          {currentProfile && (
            <div className="pb-24">
              {/* Header with back button */}
              <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setProfileSheetOpen(false)}
                    className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <SheetTitle className="text-xl font-display">
                    {currentProfile.display_name}'s Profile
                  </SheetTitle>
                </div>
              </SheetHeader>

              {/* Profile Photos Carousel */}
              <div className="mt-4">
                {currentProfile.photos?.length > 0 ? (
                  <div className="relative">
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 px-1 scrollbar-hide">
                      {currentProfile.photos.map((photo, index) => (
                        <div 
                          key={index}
                          className="flex-shrink-0 w-72 aspect-[3/4] rounded-2xl overflow-hidden snap-center cursor-pointer"
                          onClick={() => openPhotoGallery(index)}
                        >
                          <img
                            src={photo}
                            alt={`${currentProfile.display_name} photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-2xl flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="mt-6 space-y-6 px-1">
                {/* Name and Basic Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      {currentProfile.display_name}
                      {currentProfile.birth_date && (
                        <span className="font-normal text-muted-foreground">, {calculateAge(currentProfile.birth_date)}</span>
                      )}
                    </h2>
                    {currentProfile.is_verified && (
                      <VerifiedBadge size="md" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {currentProfile.course_of_study} • Year {currentProfile.year_of_study}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {currentProfile.university}
                  </p>
                </div>

                {/* Bio */}
                {currentProfile.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
                    <p className="text-foreground">{currentProfile.bio}</p>
                  </div>
                )}

                {/* Relationship Goal */}
                {currentProfile.relationship_goal && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Looking for</h3>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      <span className="text-foreground">
                        {getRelationshipLabel(currentProfile.relationship_goal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interests */}
                {currentProfile.interests?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons in sheet */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
                <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setProfileSheetOpen(false);
                      handleSwipe(false);
                    }}
                    className="flex-1"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Pass
                  </Button>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => {
                      setProfileSheetOpen(false);
                      handleSwipe(true);
                    }}
                    className="flex-1"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Like
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
