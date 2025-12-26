import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, ArrowRight, ArrowLeft, User, Book, Calendar, 
  Camera, Sparkles, Check
} from 'lucide-react';

type Step = 'basics' | 'photos' | 'interests' | 'preferences';

const interests = [
  'Reading', 'Music', 'Sports', 'Gaming', 'Travel', 'Cooking',
  'Photography', 'Art', 'Movies', 'Fitness', 'Dancing', 'Writing',
  'Technology', 'Nature', 'Coffee', 'Yoga', 'Volunteering', 'Fashion'
];

const relationshipGoals = [
  { value: 'long_term', label: 'Long-term relationship', emoji: '💍' },
  { value: 'dating', label: 'Dating & seeing where it goes', emoji: '💕' },
  { value: 'friendship', label: 'New friends first', emoji: '🤝' },
  { value: 'not_sure', label: "Not sure yet", emoji: '🤔' },
];

const genders = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function Onboarding() {
  const [step, setStep] = useState<Step>('basics');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [courseOfStudy, setCourseOfStudy] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [relationshipGoal, setRelationshipGoal] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps: Step[] = ['basics', 'photos', 'interests', 'preferences'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep) setStep(nextStep);
  };

  const handleBack = () => {
    const prevStep = steps[currentStepIndex - 1];
    if (prevStep) setStep(prevStep);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 6
        ? [...prev, interest]
        : prev
    );
  };

  const toggleLookingFor = (genderValue: string) => {
    setLookingFor(prev =>
      prev.includes(genderValue)
        ? prev.filter(g => g !== genderValue)
        : [...prev, genderValue]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').insert({
        user_id: user.id,
        email: user.email!,
        display_name: displayName,
        bio,
        university,
        course_of_study: courseOfStudy,
        year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
        birth_date: birthDate || null,
        gender: gender as any,
        looking_for_gender: lookingFor as any[],
        relationship_goal: relationshipGoal as any,
        interests: selectedInterests,
        photos,
        is_complete: true,
        is_verified: true,
      });

      if (error) throw error;

      toast({
        title: 'Profile created! 🎉',
        description: "You're all set to start discovering matches.",
      });
      navigate('/discover');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating profile',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlaceholderPhoto = () => {
    const placeholders = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    ];
    if (photos.length < 6) {
      setPhotos([...photos, placeholders[photos.length % placeholders.length]]);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-semibold text-foreground">UniMatch</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-card animate-scale-in">
            {step === 'basics' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      The Basics
                    </h2>
                    <p className="text-muted-foreground">Tell us about yourself</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="How should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">About You</Label>
                    <Textarea
                      id="bio"
                      placeholder="Share a bit about yourself, your passions, and what makes you unique..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        placeholder="Your university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course of Study</Label>
                      <Input
                        id="course"
                        placeholder="e.g., Psychology"
                        value={courseOfStudy}
                        onChange={(e) => setCourseOfStudy(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year of Study</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1"
                        max="7"
                        placeholder="e.g., 2"
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>I identify as</Label>
                    <div className="flex flex-wrap gap-2">
                      {genders.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGender(g.value)}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            gender === g.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:border-primary'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 'photos' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      Add Photos
                    </h2>
                    <p className="text-muted-foreground">Show your best self</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                        photos[i]
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary hover:bg-accent'
                      }`}
                      onClick={addPlaceholderPhoto}
                    >
                      {photos[i] ? (
                        <img
                          src={photos[i]}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Click to add photos (add at least 1)
                </p>
              </>
            )}

            {step === 'interests' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      Your Interests
                    </h2>
                    <p className="text-muted-foreground">Select up to 6 interests</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border transition-all ${
                        selectedInterests.includes(interest)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:border-primary'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {selectedInterests.length}/6 selected
                </p>
              </>
            )}

            {step === 'preferences' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      What You're Looking For
                    </h2>
                    <p className="text-muted-foreground">Help us find your match</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>I'm interested in</Label>
                    <div className="flex flex-wrap gap-2">
                      {genders.slice(0, 4).map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => toggleLookingFor(g.value)}
                          className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                            lookingFor.includes(g.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:border-primary'
                          }`}
                        >
                          {lookingFor.includes(g.value) && <Check className="w-4 h-4" />}
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>I'm looking for</Label>
                    <div className="space-y-2">
                      {relationshipGoals.map((goal) => (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() => setRelationshipGoal(goal.value)}
                          className={`w-full px-4 py-3 rounded-xl border transition-all flex items-center gap-3 text-left ${
                            relationshipGoal === goal.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:border-primary'
                          }`}
                        >
                          <span className="text-2xl">{goal.emoji}</span>
                          <span className="font-medium">{goal.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {currentStepIndex > 0 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStepIndex < steps.length - 1 ? (
                <Button variant="hero" onClick={handleNext}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating Profile...' : 'Complete Profile'}
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
