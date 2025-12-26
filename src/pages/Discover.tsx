import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, X, Star, MessageCircle, User, Sparkles } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

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
}

export default function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen gradient-hero pb-24">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-semibold text-foreground">Discover</span>
        </div>
      </header>

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
              {/* Photo */}
              <div className="aspect-[3/4] relative">
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
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                
                {/* Profile info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                  <h2 className="text-2xl font-display font-bold mb-1">
                    {currentProfile.display_name}
                  </h2>
                  <p className="text-sm opacity-90 mb-2">
                    {currentProfile.course_of_study} • Year {currentProfile.year_of_study}
                  </p>
                  <p className="text-sm opacity-80">
                    {currentProfile.university}
                  </p>
                </div>
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
    </div>
  );
}
