import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Menu, 
  Shield, 
  Mail,
  Info,
  FileText,
  User, 
  Settings,
  LogOut,
  Bell,
  HelpCircle
} from 'lucide-react';

const navigationItems = [
  { path: '/privacy', icon: Shield, label: 'Privacy Policy', description: 'How we keep you safe' },
  { path: '/safety', icon: FileText, label: 'Safety Center', description: 'Guidelines and reporting' },
  { path: '/contact', icon: Mail, label: 'Contact Us', description: 'Get in touch with the team' },
  { path: '/about', icon: Info, label: 'About UniMatch', description: 'Our mission and story' },
];

interface ResponsiveHeaderProps {
  showNavigation?: boolean;
}

export function ResponsiveHeader({ showNavigation = true }: ResponsiveHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user avatar and unread count
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchData = async () => {
      // Fetch profile photo
      const { data: profile } = await supabase
        .from('profiles')
        .select('photos')
        .eq('user_id', user.id)
        .single();

      if (!cancelled) {
        setAvatarUrl(profile?.photos?.[0] ?? null);
      }

      // Fetch unread messages count (messages not sent by user)
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (!conversations?.length) {
        if (!cancelled) setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map((convo) => convo.id);
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (!cancelled) {
        setUnreadCount(count || 0);
      }
    };

    fetchData();

    // Subscribe to new messages for real-time unread updates
    const channel = supabase
      .channel('header-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Don't show header on auth pages or landing page
  if (!user || ['/auth', '/onboarding', '/'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/discover" className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-soft">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-semibold text-foreground hidden lg:block">
                UniMatch
              </span>
            </Link>

            {/* Navigation */}
            {showNavigation && (
              <nav className="flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:block">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/messages')}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-medium text-white flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback>
                        {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user?.user_metadata?.first_name || 'Student'}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/safety')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Safety & Privacy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/contact')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/discover" className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-soft">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-semibold text-foreground">
                UniMatch
              </span>
            </Link>

            {/* Mobile Menu */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/messages')}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-medium text-white flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">Navigation</SheetTitle>
                    <SheetDescription className="text-left">
                      Access all features of the platform
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                        <AvatarFallback>
                          {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {user?.user_metadata?.first_name || 'Student'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    {showNavigation && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground px-3 py-2">
                          Main Navigation
                        </p>
                        {navigationItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.path);
                          
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                active
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-foreground hover:bg-accent'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <div className="flex-1">
                                <div>{item.label}</div>
                                <div className="text-xs opacity-70">{item.description}</div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground px-3 py-2">
                        Account & Settings
                      </p>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto p-3"
                        onClick={() => {
                          navigate('/profile');
                          setIsOpen(false);
                        }}
                      >
                        <User className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Profile</div>
                          <div className="text-xs text-muted-foreground">Edit your profile</div>
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto p-3"
                        onClick={() => {
                          navigate('/settings');
                          setIsOpen(false);
                        }}
                      >
                        <Settings className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Settings</div>
                          <div className="text-xs text-muted-foreground">Preferences & privacy</div>
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto p-3"
                        onClick={() => {
                          navigate('/safety');
                          setIsOpen(false);
                        }}
                      >
                        <Shield className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Safety & Privacy</div>
                          <div className="text-xs text-muted-foreground">Control your privacy</div>
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto p-3"
                        onClick={() => {
                          navigate('/contact');
                          setIsOpen(false);
                        }}
                      >
                        <HelpCircle className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Help & Support</div>
                          <div className="text-xs text-muted-foreground">Get help when needed</div>
                        </div>
                      </Button>

                      <div className="border-t pt-2 mt-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-auto p-3 text-destructive hover:text-destructive"
                          onClick={() => {
                            handleSignOut();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="w-5 h-5" />
                          <div className="text-left">
                            <div className="text-sm font-medium">Log out</div>
                            <div className="text-xs opacity-70">Sign out of your account</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}