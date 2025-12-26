import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggleButton } from '@/components/ThemeToggle';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Heart, 
  Users, 
  GraduationCap,
  MapPin,
  Calendar,
  BookOpen,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface UserProfile {
  user_id: string;
  display_name: string;
  bio: string;
  university: string;
  course_of_study: string;
  year_of_study: number;
  birth_date: string;
  gender: string;
  relationship_goal: string;
  interests: string[];
  photos: string[];
  is_verified: boolean;
  verification_level?: string;
  created_at: string;
}

interface FilterState {
  university: string;
  course: string;
  yearOfStudy: string;
  relationshipGoal: string;
  interests: string;
  verified: string;
}

export default function Browse() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    university: '',
    course: '',
    yearOfStudy: '',
    relationshipGoal: '',
    interests: '',
    verified: ''
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, filters]);

  const fetchUsers = async () => {
    if (!user) return;

    try {
      // Get all complete profiles excluding current user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .eq('is_complete', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.display_name.toLowerCase().includes(query) ||
        user.university.toLowerCase().includes(query) ||
        user.course_of_study.toLowerCase().includes(query) ||
        user.bio.toLowerCase().includes(query) ||
        user.interests.some(interest => interest.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.university) {
      filtered = filtered.filter(user => 
        user.university.toLowerCase().includes(filters.university.toLowerCase())
      );
    }

    if (filters.course) {
      filtered = filtered.filter(user => 
        user.course_of_study.toLowerCase().includes(filters.course.toLowerCase())
      );
    }

    if (filters.yearOfStudy) {
      filtered = filtered.filter(user => 
        user.year_of_study.toString() === filters.yearOfStudy
      );
    }

    if (filters.relationshipGoal) {
      filtered = filtered.filter(user => 
        user.relationship_goal === filters.relationshipGoal
      );
    }

    if (filters.interests) {
      filtered = filtered.filter(user => 
        user.interests.some(interest => 
          interest.toLowerCase().includes(filters.interests.toLowerCase())
        )
      );
    }

    if (filters.verified === 'verified') {
      filtered = filtered.filter(user => user.is_verified);
    } else if (filters.verified === 'unverified') {
      filtered = filtered.filter(user => !user.is_verified);
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setFilters({
      university: '',
      course: '',
      yearOfStudy: '',
      relationshipGoal: '',
      interests: '',
      verified: ''
    });
    setSearchQuery('');
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getRelationshipGoalLabel = (goal: string) => {
    const labels: Record<string, string> = {
      long_term: 'Long-term relationship',
      dating: 'Dating & seeing where it goes',
      friendship: 'New friends first',
      not_sure: "Not sure yet"
    };
    return labels[goal] || goal;
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.rpc('send_message_request', {
        p_sender: user.id,
        p_recipient: selectedUser.user_id,
        p_content: messageText,
      });

      if (error) throw error;

      toast({
        title: 'Request sent!',
        description: `Your message request was sent to ${selectedUser.display_name}. They need to accept before chatting.`,
      });

      setSelectedUser(null);
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: err instanceof Error ? err.message : 'Please try again later.',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const uniqueUniversities = [...new Set(users.map(u => u.university))].filter(Boolean);
  const uniqueCourses = [...new Set(users.map(u => u.course_of_study))].filter(Boolean);
  const relationshipGoals = [
    { value: 'long_term', label: 'Long-term relationship' },
    { value: 'dating', label: 'Dating & seeing where it goes' },
    { value: 'friendship', label: 'New friends first' },
    { value: 'not_sure', label: 'Not sure yet' }
  ];

  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground">Browse Students</h1>
            <p className="text-sm text-muted-foreground">{filteredUsers.length} students found</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, university, course, interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <Card className="animate-in slide-in-from-top duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filter Students</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">University</label>
                  <Select value={filters.university} onValueChange={(value) => setFilters(prev => ({ ...prev, university: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any university</SelectItem>
                      {uniqueUniversities.map(uni => (
                        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Course of Study</label>
                  <Select value={filters.course} onValueChange={(value) => setFilters(prev => ({ ...prev, course: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any course</SelectItem>
                      {uniqueCourses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Year of Study</label>
                  <Select value={filters.yearOfStudy} onValueChange={(value) => setFilters(prev => ({ ...prev, yearOfStudy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any year</SelectItem>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="5">5th Year+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Looking For</label>
                  <Select value={filters.relationshipGoal} onValueChange={(value) => setFilters(prev => ({ ...prev, relationshipGoal: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any goal</SelectItem>
                      {relationshipGoals.map(goal => (
                        <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Interests</label>
                  <Input
                    placeholder="e.g., music, sports, travel"
                    value={filters.interests}
                    onChange={(e) => setFilters(prev => ({ ...prev, interests: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification</label>
                  <Select value={filters.verified} onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      <SelectItem value="verified">Verified only</SelectItem>
                      <SelectItem value="unverified">Unverified only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </header>

      {/* User Grid */}
      <main className="container mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters'
                : 'No students available at the moment'
              }
            </p>
            {(searchQuery || Object.values(filters).some(f => f)) && (
              <Button onClick={clearFilters}>Clear all filters</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((profile) => {
              const age = calculateAge(profile.birth_date);
              return (
                <Card key={profile.user_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10">
                    {profile.photos && profile.photos.length > 0 ? (
                      <img
                        src={profile.photos[0]}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Avatar className="w-20 h-20">
                          <AvatarFallback className="text-2xl">
                            {profile.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    {profile.is_verified && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {profile.display_name}
                          {age && <span className="text-muted-foreground text-sm">({age})</span>}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {profile.course_of_study} • Year {profile.year_of_study}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.university}
                        </p>
                      </div>

                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {profile.bio}
                        </p>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-primary">
                          {getRelationshipGoalLabel(profile.relationship_goal)}
                        </p>
                        
                        {profile.interests && profile.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {profile.interests.slice(0, 3).map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                            {profile.interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.interests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1"
                              onClick={() => setSelectedUser(profile)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send a message to {profile.display_name}</DialogTitle>
                              <DialogDescription>
                                Start a conversation and get to know each other better!
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                                <Avatar>
                                  <AvatarImage src={profile.photos?.[0]} />
                                  <AvatarFallback>{profile.display_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{profile.display_name}</p>
                                  <p className="text-sm text-muted-foreground">{profile.university}</p>
                                </div>
                              </div>

                              <textarea
                                placeholder="Type your message here..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                                rows={4}
                              />

                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => {
                                  setSelectedUser(null);
                                  setMessageText('');
                                }}>
                                  Cancel
                                </Button>
                                  <Button 
                                    onClick={sendMessage}
                                    disabled={!messageText.trim() || sendingMessage}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    {sendingMessage ? 'Sending...' : 'Send Request'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}