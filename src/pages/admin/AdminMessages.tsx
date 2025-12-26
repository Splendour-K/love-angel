import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Flag,
  CheckCircle,
  MessageSquare,
  User,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MessageLog {
  id: string;
  message_id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  flagged: boolean;
  flag_reason: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  created_at: string;
  sender?: {
    display_name: string;
    email: string;
  };
  receiver?: {
    display_name: string;
    email: string;
  };
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'flagged' | 'reviewed'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [page, filterStatus]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('message_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filterStatus === 'flagged') {
        query = query.eq('flagged', true);
      } else if (filterStatus === 'reviewed') {
        query = query.eq('reviewed', true);
      }

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch user profiles for sender and receiver
      const userIds = [...new Set(data?.flatMap(m => [m.sender_id, m.receiver_id]) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const messagesWithProfiles = data?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id),
        receiver: profileMap.get(msg.receiver_id),
      })) || [];

      setMessages(messagesWithProfiles);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch messages.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (messageId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('message_logs')
        .update({
          flagged: true,
          flag_reason: reason,
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: 'Message flagged',
        description: 'The message has been flagged for review.',
      });

      fetchMessages();
    } catch (err) {
      console.error('Error flagging message:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to flag message.',
      });
    }
  };

  const handleMarkReviewed = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('message_logs')
        .update({
          reviewed: true,
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: 'Marked as reviewed',
        description: 'The message has been marked as reviewed.',
      });

      fetchMessages();
    } catch (err) {
      console.error('Error marking reviewed:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark message as reviewed.',
      });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Message Monitor</h1>
          <p className="text-slate-400">View and monitor all user messages in real-time.</p>
        </div>
        <Button onClick={fetchMessages} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
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
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMessages()}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="flagged">Flagged Only</SelectItem>
              <SelectItem value="reviewed">Reviewed Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchMessages} className="bg-blue-600 hover:bg-blue-700 text-white">
            Search
          </Button>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-sm font-medium text-slate-400 p-4">Sender</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Receiver</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Message</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Date</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Status</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No messages found.
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {message.sender?.display_name || 'Unknown'}
                          </p>
                          <p className="text-slate-400 text-xs">{message.sender?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {message.receiver?.display_name || 'Unknown'}
                          </p>
                          <p className="text-slate-400 text-xs">{message.receiver?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm max-w-xs truncate">{message.content}</p>
                      {message.flag_reason && (
                        <p className="text-red-400 text-xs mt-1">
                          Flagged: {message.flag_reason}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Calendar className="w-3 h-3" />
                        {formatDate(message.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {message.flagged && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                            Flagged
                          </span>
                        )}
                        {message.reviewed && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            Reviewed
                          </span>
                        )}
                        {!message.flagged && !message.reviewed && (
                          <span className="px-2 py-1 bg-slate-600 text-slate-400 rounded-full text-xs">
                            Normal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {!message.flagged && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFlag(message.id, 'Manual flag by admin')}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                        )}
                        {!message.reviewed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkReviewed(message.id)}
                            className="text-slate-400 hover:text-green-400"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} messages
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
