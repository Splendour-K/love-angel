import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  ChevronLeft,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Radar,
  Shield,
  Sparkles,
} from 'lucide-react';

type RelationshipGoal = Database['public']['Enums']['relationship_goal'];
type Gender = Database['public']['Enums']['gender'];

type Preferences = {
  email_notifications: boolean;
  push_notifications: boolean;
  show_in_discover: boolean;
  verified_only_messages: boolean;
};

const defaultPreferences: Preferences = {
  email_notifications: true,
  push_notifications: true,
  show_in_discover: true,
  verified_only_messages: false,
};

interface SettingsForm {
  relationshipGoal: RelationshipGoal | '';
  lookingForGender: Gender[];
  preferences: Preferences;
}

interface ProfileMeta {
  displayName: string;
  email: string;
  university?: string | null;
  bio?: string | null;
  photos?: string[] | null;
  isVerified: boolean;
  idVerified: boolean;
}

const relationshipGoalOptions: { value: RelationshipGoal; label: string; description: string }[] = [
  { value: 'long_term', label: 'Something serious', description: 'Committed, long-term relationship' },
  { value: 'dating', label: 'Dating', description: 'Open to dating and connections' },
  { value: 'friendship', label: 'Friendship', description: 'Looking to meet new friends' },
  { value: 'not_sure', label: "Still figuring it out", description: "Open to possibilities" },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
];

const cloneForm = (form: SettingsForm): SettingsForm => ({
  relationshipGoal: form.relationshipGoal,
  lookingForGender: [...form.lookingForGender],
  preferences: { ...form.preferences },
});

const parsePreferences = (prefs: Json | null): Preferences => {
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return { ...defaultPreferences };
  }

  const record = prefs as Partial<Record<keyof Preferences, Json>>;

  return {
    email_notifications:
      typeof record.email_notifications === 'boolean'
        ? record.email_notifications
        : defaultPreferences.email_notifications,
    push_notifications:
      typeof record.push_notifications === 'boolean'
        ? record.push_notifications
        : defaultPreferences.push_notifications,
    show_in_discover:
      typeof record.show_in_discover === 'boolean'
        ? record.show_in_discover
        : defaultPreferences.show_in_discover,
    verified_only_messages:
      typeof record.verified_only_messages === 'boolean'
        ? record.verified_only_messages
        : defaultPreferences.verified_only_messages,
  };
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    relationshipGoal: '',
    lookingForGender: [],
    preferences: { ...defaultPreferences },
  });
  const [initialForm, setInitialForm] = useState<SettingsForm | null>(null);
  const [profileMeta, setProfileMeta] = useState<ProfileMeta | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `relationship_goal, looking_for_gender, preferences, is_verified, id_verified, display_name, bio, university, photos, email`
        )
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const prefs = parsePreferences(data?.preferences ?? null);

      const newForm: SettingsForm = {
        relationshipGoal: (data?.relationship_goal as RelationshipGoal | null) || '',
        lookingForGender: (data?.looking_for_gender as Gender[] | null) || [],
        preferences: prefs,
      };

      setForm(cloneForm(newForm));
      setInitialForm(cloneForm(newForm));
      setProfileMeta({
        displayName: data?.display_name || user.user_metadata?.first_name || 'Student',
        email: data?.email || user.email || 'unknown@unimatch.app',
        university: data?.university,
        bio: data?.bio,
        photos: data?.photos,
        isVerified: Boolean(data?.is_verified),
        idVerified: Boolean(data?.id_verified),
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Could not load settings',
        description: 'Please try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSettings();
  }, [authLoading, user, navigate, fetchSettings]);

  const profileCompletion = useMemo(() => {
    if (!profileMeta) return 0;
    const checkpoints = [
      Boolean(profileMeta.bio),
      Boolean(profileMeta.university),
      (profileMeta.photos?.length || 0) >= 2,
      Boolean(form.relationshipGoal),
      form.lookingForGender.length > 0,
    ];
    return Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  }, [profileMeta, form.relationshipGoal, form.lookingForGender]);

  const isDirty = initialForm
    ? JSON.stringify(initialForm) !== JSON.stringify(form)
    : false;

  const handleGenderToggle = (value: Gender) => {
    setForm((prev) => {
      const exists = prev.lookingForGender.includes(value);
      return {
        ...prev,
        lookingForGender: exists
          ? prev.lookingForGender.filter((item) => item !== value)
          : [...prev.lookingForGender, value],
      };
    });
  };

  const handlePreferenceChange = (key: keyof Preferences, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const preferencesPayload: Json = {
        email_notifications: form.preferences.email_notifications,
        push_notifications: form.preferences.push_notifications,
        show_in_discover: form.preferences.show_in_discover,
        verified_only_messages: form.preferences.verified_only_messages,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          relationship_goal: form.relationshipGoal || null,
          looking_for_gender: form.lookingForGender.length ? form.lookingForGender : null,
          preferences: preferencesPayload,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setInitialForm(cloneForm(form));
      toast({
        title: 'Preferences saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: err.message || 'Unable to save your changes.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialForm) {
      setForm(cloneForm(initialForm));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  if (!profileMeta) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero pb-32 pt-16 md:pt-20">
      <main className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <h1 className="text-2xl font-display font-semibold">Settings</h1>
          </div>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-display">{profileMeta.displayName}</CardTitle>
              <CardDescription>{profileMeta.email}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileMeta.isVerified ? (
                <Badge className="gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  Profile verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Verification pending
                </Badge>
              )}
              {profileMeta.idVerified ? (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  ID verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Complete ID check
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Profile completeness</span>
                <span className="text-sm font-semibold text-foreground">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} />
            </div>
            <p className="text-sm text-muted-foreground">
              Complete your bio, add photos, and clarify your preferences to appear higher in Discover.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Radar className="w-5 h-5 text-primary" />
                Discovery preferences
              </CardTitle>
              <CardDescription>Control who can see you in Discover.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Show profile in Discover</p>
                  <p className="text-sm text-muted-foreground">Turn off to take a break. You can still chat with matches.</p>
                </div>
                <Switch
                  checked={form.preferences.show_in_discover}
                  onCheckedChange={(checked) => handlePreferenceChange('show_in_discover', checked)}
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="font-medium">Interested in</p>
                <div className="flex flex-wrap gap-3">
                  {genderOptions.map((option) => (
                    <Label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm cursor-pointer transition-colors ${
                        form.lookingForGender.includes(option.value as Gender)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Checkbox
                        checked={form.lookingForGender.includes(option.value as Gender)}
                        onCheckedChange={() => handleGenderToggle(option.value as Gender)}
                        className="h-4 w-4"
                      />
                      {option.label}
                    </Label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartHandshake className="w-5 h-5 text-pink-500" />
                Relationship goals
              </CardTitle>
              <CardDescription>Share what you&#39;re hoping to find.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-sm font-medium">Primary goal</Label>
              <Select
                value={form.relationshipGoal || ''}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, relationshipGoal: value as RelationshipGoal }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipGoalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Messaging controls
              </CardTitle>
              <CardDescription>Protect your inbox and vibe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Verified-only messages</p>
                  <p className="text-sm text-muted-foreground">Only verified users can start a conversation with you.</p>
                </div>
                <Switch
                  checked={form.preferences.verified_only_messages}
                  onCheckedChange={(checked) => handlePreferenceChange('verified_only_messages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-amber-500" />
                Notifications
              </CardTitle>
              <CardDescription>Stay in the loop without the noise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Email updates</p>
                  <p className="text-sm text-muted-foreground">Match summaries, safety alerts, and important updates.</p>
                </div>
                <Switch
                  checked={form.preferences.email_notifications}
                  onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Push notifications</p>
                  <p className="text-sm text-muted-foreground">Real-time message and match notifications.</p>
                </div>
                <Switch
                  checked={form.preferences.push_notifications}
                  onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-emerald-500" />
              Safety reminders
            </CardTitle>
            <CardDescription>Quick tips to keep every interaction respectful.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/80 p-4 bg-background/60">
              <p className="font-medium">Report uncomfortable chats</p>
              <p className="text-sm text-muted-foreground mt-1">
                Flag suspicious or aggressive behavior. Our safety team reviews every report.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 p-4 bg-background/60">
              <p className="font-medium">Meet in public first</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share plans with a friend and choose familiar locations for first meetups.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="shadow-xl border-border/80">
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-4">
              <div>
                <p className="text-sm font-medium">Make sure to save your changes</p>
                {!isDirty ? (
                  <p className="text-xs text-muted-foreground">All preferences are up to date.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">You have unsaved changes.</p>
                )}
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <Button variant="outline" onClick={handleReset} disabled={!isDirty || saving}>
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={!isDirty || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
