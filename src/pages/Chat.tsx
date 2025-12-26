import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IceBreakers } from '@/components/IceBreakers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, User, Shield, Flag, Ban, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface OtherUser {
  user_id: string;
  display_name: string;
  photos: string[];
}

export default function Chat() {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !conversationId) {
      navigate('/messages');
      return;
    }
    fetchConversationDetails();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            markAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationDetails = async () => {
    if (!conversationId || !user) return;

    try {
      const { data: convo } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!convo) {
        navigate('/messages');
        return;
      }

      const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, display_name, photos')
        .eq('user_id', otherUserId)
        .single();

      if (profile) {
        setOtherUser({
          user_id: profile.user_id,
          display_name: profile.display_name || 'Anonymous',
          photos: profile.photos || [],
        });
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Show ice breakers if this is a new conversation (no messages)
      if (!data || data.length === 0) {
        setShowIceBreakers(true);
      }

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter(m => !m.is_read && m.sender_id !== user?.id)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!user || !otherUser) return;

    try {
      await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: otherUser.user_id,
      });

      toast({
        title: 'User blocked',
        description: `You've blocked ${otherUser.display_name}`,
      });
      navigate('/messages');
    } catch (err) {
      console.error('Error blocking user:', err);
    }
  };

  const handleReport = async () => {
    if (!user || !otherUser) return;

    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: otherUser.user_id,
        reason: 'Reported from chat',
      });

      toast({
        title: 'Report submitted',
        description: "We'll review this user's profile.",
      });
    } catch (err) {
      console.error('Error reporting user:', err);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {otherUser && (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {otherUser.photos?.length > 0 ? (
                  <img
                    src={otherUser.photos[0]}
                    alt={otherUser.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="font-semibold text-foreground">
                {otherUser.display_name}
              </span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Shield className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReport} className="text-destructive">
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                <Ban className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No messages yet. Start the conversation!
                </p>
                {showIceBreakers && (
                  <Button
                    variant="outline"
                    onClick={() => setShowIceBreakers(!showIceBreakers)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {showIceBreakers ? 'Hide' : 'Show'} Conversation Starters
                  </Button>
                )}
              </div>
              
              {showIceBreakers && (
                <div className="animate-in slide-in-from-bottom duration-300">
                  <IceBreakers
                    profile={otherUser ? {
                      interests: [], // You'd need to fetch this from the profile
                      university: '',
                      course_of_study: '',
                      relationship_goal: '',
                      bio: ''
                    } : undefined}
                    onSelectPrompt={(prompt) => {
                      setNewMessage(prompt);
                      setShowIceBreakers(false);
                    }}
                    showSendButton={true}
                  />
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'gradient-primary text-primary-foreground rounded-br-md'
                        : 'bg-card text-card-foreground shadow-soft rounded-bl-md'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="bg-card border-t border-border p-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          {showIceBreakers && messages.length > 0 && (
            <div className="mb-4 animate-in slide-in-from-bottom duration-300">
              <IceBreakers
                profile={otherUser ? {
                  interests: [],
                  university: '',
                  course_of_study: '',
                  relationship_goal: '',
                  bio: ''
                } : undefined}
                onSelectPrompt={(prompt) => {
                  setNewMessage(prompt);
                  setShowIceBreakers(false);
                }}
                showSendButton={true}
              />
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowIceBreakers(!showIceBreakers)}
              className="shrink-0"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              type="submit"
              variant="hero"
              size="icon"
              disabled={!newMessage.trim() || sending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
