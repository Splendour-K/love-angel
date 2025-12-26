import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  User,
  Calendar,
  RefreshCw,
  Shield,
  Mail,
  Eye,
  Ban,
  CheckCircle,
  Star,
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  bio: string;
  university: string;
  course_of_study: string;
  year_of_study: number;
  photos: string[];
  interests: string[];
  is_verified: boolean;
  id_verified: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [filterVerified]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterVerified === 'verified') {
        query = query.eq('id_verified', true);
      } else if (filterVerified === 'unverified') {
        query = query.eq('id_verified', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch users.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.university?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400">Manage and view all registered users.</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or university..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <Select value={filterVerified} onValueChange={(v: any) => setFilterVerified(v)}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">ID Verified</SelectItem>
              <SelectItem value="unverified">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', count: users.length, color: 'blue', icon: User },
          { label: 'ID Verified', count: users.filter(u => u.id_verified).length, color: 'green', icon: Shield },
          { label: 'Complete Profiles', count: users.filter(u => u.is_complete).length, color: 'purple', icon: CheckCircle },
          { label: 'Today', count: users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length, color: 'yellow', icon: Star },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                stat.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.count}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-sm font-medium text-slate-400 p-4">User</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">University</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Status</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Joined</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden">
                          {user.photos?.[0] ? (
                            <img
                              src={user.photos[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{user.display_name || 'No name'}</p>
                            {user.id_verified && (
                              <span className="text-blue-400" title="ID Verified">
                                <Star className="w-4 h-4 fill-blue-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white">{user.university || '-'}</p>
                      <p className="text-slate-400 text-sm">{user.course_of_study || '-'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {user.id_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs w-fit">
                            <Shield className="w-3 h-3" />
                            ID Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-600 text-slate-400 rounded-full text-xs w-fit">
                            Not Verified
                          </span>
                        )}
                        {user.is_complete ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs w-fit">
                            Complete
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs w-fit">
                            Incomplete
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-400 text-sm">{formatDate(user.created_at)}</p>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setViewDialogOpen(true);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">User Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              View complete user profile information.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-600 overflow-hidden">
                  {selectedUser.photos?.[0] ? (
                    <img
                      src={selectedUser.photos[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedUser.display_name}</h3>
                    {selectedUser.id_verified && (
                      <span className="text-blue-400" title="ID Verified">
                        <Star className="w-5 h-5 fill-blue-400" />
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* Photos */}
              {selectedUser.photos?.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2">Photos</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedUser.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedUser.bio && (
                <div>
                  <h4 className="text-white font-medium mb-2">Bio</h4>
                  <p className="text-slate-300">{selectedUser.bio}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">University</p>
                  <p className="text-white">{selectedUser.university || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Course</p>
                  <p className="text-white">{selectedUser.course_of_study || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Year of Study</p>
                  <p className="text-white">{selectedUser.year_of_study || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Joined</p>
                  <p className="text-white">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>

              {/* Interests */}
              {selectedUser.interests?.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
