import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, User, Settings, LogOut, Camera, Edit2, Check, X, 
  Shield, ChevronRight 
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface ProfileData {
  display_name: string;
  bio: string;
  university: string;
  course_of_study: string;
  year_of_study: number | null;
  photos: string[];
  interests: string[];
  relationship_goal: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          university: data.university || '',
          course_of_study: data.course_of_study || '',
          year_of_study: data.year_of_study,
          photos: data.photos || [],
          interests: data.interests || [],
          relationship_goal: data.relationship_goal || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedProfile(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editedProfile.display_name,
          bio: editedProfile.bio,
          university: editedProfile.university,
          course_of_study: editedProfile.course_of_study,
          year_of_study: editedProfile.year_of_study,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-semibold text-foreground">Profile</span>
        </div>

        {!editing ? (
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <Edit2 className="w-5 h-5" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="w-5 h-5" />
            </Button>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        ) : !profile ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven't set up your profile yet.
            </p>
            <Button variant="hero" onClick={() => navigate('/onboarding')}>
              Complete Profile
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            {/* Profile Photo */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-full h-full rounded-full overflow-hidden bg-muted shadow-card">
                {profile.photos?.length > 0 ? (
                  <img
                    src={profile.photos[0]}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              {editing && (
                <button className="absolute bottom-0 right-0 w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-soft">
                  <Camera className="w-5 h-5 text-primary-foreground" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="bg-card rounded-2xl p-6 shadow-card space-y-5">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      value={editedProfile?.display_name || ''}
                      onChange={(e) =>
                        setEditedProfile(prev =>
                          prev ? { ...prev, display_name: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      value={editedProfile?.bio || ''}
                      onChange={(e) =>
                        setEditedProfile(prev =>
                          prev ? { ...prev, bio: e.target.value } : null
                        )
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>University</Label>
                    <Input
                      value={editedProfile?.university || ''}
                      onChange={(e) =>
                        setEditedProfile(prev =>
                          prev ? { ...prev, university: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Input
                        value={editedProfile?.course_of_study || ''}
                        onChange={(e) =>
                          setEditedProfile(prev =>
                            prev ? { ...prev, course_of_study: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={editedProfile?.year_of_study || ''}
                        onChange={(e) =>
                          setEditedProfile(prev =>
                            prev
                              ? { ...prev, year_of_study: parseInt(e.target.value) || null }
                              : null
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      {profile.display_name || 'Anonymous'}
                    </h2>
                    <p className="text-muted-foreground">
                      {profile.course_of_study}
                      {profile.year_of_study && ` • Year ${profile.year_of_study}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.university}
                    </p>
                  </div>

                  {profile.bio && (
                    <p className="text-foreground text-center">{profile.bio}</p>
                  )}

                  {profile.relationship_goal && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">
                        {getRelationshipLabel(profile.relationship_goal)}
                      </span>
                    </div>
                  )}

                  {profile.interests?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Settings Menu */}
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <button
                className="w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                onClick={() => {}}
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Settings className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">Settings</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className="w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left border-t border-border"
                onClick={() => {}}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">Privacy & Safety</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className="w-full p-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left border-t border-border"
                onClick={handleSignOut}
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <span className="flex-1 font-medium text-destructive">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
