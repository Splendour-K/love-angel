import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, User, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  otherUser: {
    user_id: string;
    display_name: string;
    photos: string[];
  };
  lastMessage?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!convos?.length) {
        setLoading(false);
        return;
      }

      // Get other users' profiles
      const otherUserIds = convos.map(c =>
        c.user1_id === user.id ? c.user2_id : c.user1_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, photos')
        .in('user_id', otherUserIds);

      // Get last message for each conversation
      const formattedConversations = await Promise.all(
        convos.map(async (convo) => {
          const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;
          const profile = profiles?.find(p => p.user_id === otherUserId);

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: convo.id,
            otherUser: {
              user_id: otherUserId,
              display_name: profile?.display_name || 'Anonymous',
              photos: profile?.photos || [],
            },
            lastMessage: lastMsg
              ? {
                  content: lastMsg.content,
                  created_at: lastMsg.created_at,
                  is_read: lastMsg.is_read,
                  sender_id: lastMsg.sender_id,
                }
              : undefined,
          };
        })
      );

      setConversations(formattedConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero pb-24">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-semibold text-foreground">Messages</span>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <MessageCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                No Messages Yet
              </h2>
              <p className="text-muted-foreground">
                Match with someone to start chatting!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => navigate(`/messages/${convo.id}`)}
                className="w-full bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4 hover:shadow-card transition-all text-left"
              >
                {/* Photo */}
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                  {convo.otherUser.photos?.length > 0 ? (
                    <img
                      src={convo.otherUser.photos[0]}
                      alt={convo.otherUser.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      {convo.otherUser.display_name}
                    </h3>
                    {convo.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(convo.lastMessage.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  {convo.lastMessage ? (
                    <p
                      className={`text-sm truncate ${
                        !convo.lastMessage.is_read &&
                        convo.lastMessage.sender_id !== user?.id
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {convo.lastMessage.sender_id === user?.id && 'You: '}
                      {convo.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No messages yet
                    </p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
