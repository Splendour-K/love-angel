import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Sparkles, User } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface Match {
  id: string;
  profile: {
    user_id: string;
    display_name: string;
    photos: string[];
    university: string;
    interests: string[];
  };
  commonInterests: string[];
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [myInterests, setMyInterests] = useState<string[]>([]);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMatches();
  }, [user, authLoading, navigate]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // Get my profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', user.id)
        .single();

      if (myProfile) {
        setMyInterests(myProfile.interests || []);
      }

      // Get mutual matches
      const { data: myLikes } = await supabase
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', user.id)
        .eq('is_liked', true);

      if (!myLikes?.length) {
        setLoading(false);
        return;
      }

      const myLikedIds = myLikes.map(m => m.matched_user_id);

      const { data: mutualLikes } = await supabase
        .from('matches')
        .select('user_id')
        .eq('matched_user_id', user.id)
        .eq('is_liked', true)
        .in('user_id', myLikedIds);

      if (!mutualLikes?.length) {
        setLoading(false);
        return;
      }

      const mutualIds = mutualLikes.map(m => m.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', mutualIds);

      if (profiles) {
        const formattedMatches = profiles.map(profile => ({
          id: profile.id,
          profile: {
            user_id: profile.user_id,
            display_name: profile.display_name || 'Anonymous',
            photos: profile.photos || [],
            university: profile.university || '',
            interests: profile.interests || [],
          },
          commonInterests: (profile.interests || []).filter((i: string) =>
            (myProfile?.interests || []).includes(i)
          ),
        }));
        setMatches(formattedMatches);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (matchUserId: string) => {
    if (!user) return;

    try {
      // Check for existing conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${matchUserId}),and(user1_id.eq.${matchUserId},user2_id.eq.${user.id})`)
        .single();

      if (existing) {
        navigate(`/messages/${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: matchUserId,
        })
        .select('id')
        .single();

      if (error) throw error;
      navigate(`/messages/${newConvo.id}`);
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      <main className="container mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading your matches...</p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                No Matches Yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Keep swiping to find your perfect match!
              </p>
              <Button variant="hero" onClick={() => navigate('/discover')}>
                Discover People
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Your Matches ({matches.length})
            </h2>
            
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 animate-fade-in-up"
              >
                {/* Photo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  {match.profile.photos?.length > 0 ? (
                    <img
                      src={match.profile.photos[0]}
                      alt={match.profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {match.profile.display_name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {match.profile.university}
                  </p>
                  {match.commonInterests.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary">
                        {match.commonInterests.length} shared interests
                      </span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <Button
                  variant="soft"
                  size="icon"
                  onClick={() => startConversation(match.profile.user_id)}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
