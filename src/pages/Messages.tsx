import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, User, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

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

interface MessageRequest {
  id: string;
  initial_message: string;
  created_at: string;
  sender: {
    user_id: string;
    display_name: string;
    photos: string[];
  };
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversations();
    fetchMessageRequests();

    // Subscribe to new messages and message requests
    const messageChannel = supabase
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

    const requestChannel = supabase
      .channel('message_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_requests',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchMessageRequests();
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(requestChannel);
    };
  }, [user, authLoading, navigate]);

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
        setConversations([]);
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

  const fetchMessageRequests = async () => {
    if (!user) return;

    const { data: requests, error } = await supabase
      .from('message_requests')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching message requests:', error);
      return;
    }

    if (!requests || requests.length === 0) {
      setMessageRequests([]);
      return;
    }

    const senderIds = requests.map(r => r.sender_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, photos')
      .in('user_id', senderIds);

    const formatted: MessageRequest[] = requests.map(req => {
      const profile = profiles?.find(p => p.user_id === req.sender_id);
      return {
        id: req.id,
        initial_message: req.initial_message,
        created_at: req.created_at,
        sender: {
          user_id: req.sender_id,
          display_name: profile?.display_name || 'Student',
          photos: profile?.photos || [],
        },
      };
    });

    setMessageRequests(formatted);
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) return;
    setProcessingRequest(requestId);
    try {
      const { data: conversationId, error } = await supabase.rpc('accept_message_request', {
        p_request_id: requestId,
        p_recipient: user.id,
      });
      if (error) throw error;

      toast({
        title: 'Request accepted',
        description: 'Conversation unlocked. You can now chat freely.',
      });

      await Promise.all([fetchMessageRequests(), fetchConversations()]);

      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      }
    } catch (err: any) {
      console.error('Error accepting request:', err);
      toast({
        variant: 'destructive',
        title: 'Could not accept request',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user) return;
    setProcessingRequest(requestId);
    try {
      const { data: blockedUntil, error } = await supabase.rpc('reject_message_request', {
        p_request_id: requestId,
        p_recipient: user.id,
      });
      if (error) throw error;

      toast({
        title: 'Request declined',
        description: blockedUntil
          ? `Sender blocked from messaging you until ${new Date(blockedUntil).toLocaleDateString()}.`
          : 'Sender blocked for 30 days.',
      });

      await fetchMessageRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      toast({
        variant: 'destructive',
        title: 'Could not decline request',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      <main className="container mx-auto px-4 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <MessageCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold text-foreground">Message Requests</h2>
                <span className="text-sm text-muted-foreground">{messageRequests.length} pending</span>
              </div>
              {messageRequests.length === 0 ? (
                <div className="bg-card rounded-2xl p-4 border border-dashed border-border text-sm text-muted-foreground">
                  No new requests. When someone messages you, they will appear here to accept or decline.
                </div>
              ) : (
                <div className="space-y-3">
                  {messageRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-card rounded-2xl p-4 shadow-soft flex flex-col gap-3 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          {req.sender.photos?.length > 0 ? (
                            <img
                              src={req.sender.photos[0]}
                              alt={req.sender.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground truncate">{req.sender.display_name}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">{req.initial_message}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => rejectRequest(req.id)}
                          disabled={processingRequest === req.id}
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => acceptRequest(req.id)}
                          disabled={processingRequest === req.id}
                        >
                          Accept & Chat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {conversations.length === 0 ? (
              <div className="flex items-center justify-center h-[40vh]">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                    No Messages Yet
                  </h2>
                  <p className="text-muted-foreground">
                    Send a message request or accept one to start chatting.
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
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
