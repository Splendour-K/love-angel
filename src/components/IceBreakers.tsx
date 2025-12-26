import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Lightbulb, RefreshCw, Send, Coffee, Book, Music, Plane, Heart, Smile } from 'lucide-react';

interface ConversationPrompt {
  id: string;
  category: string;
  text: string;
  icon: React.ReactNode;
  casual: boolean;
}

interface IceBreakerProps {
  profile?: {
    interests?: string[];
    university?: string;
    course_of_study?: string;
    relationship_goal?: string;
    bio?: string;
  };
  onSelectPrompt?: (prompt: string) => void;
  showSendButton?: boolean;
}

const conversationPrompts: ConversationPrompt[] = [
  // University/Academic focused
  {
    id: 'univ-1',
    category: 'Academic',
    text: "What's the most interesting thing you've learned in your major?",
    icon: <Book className="w-4 h-4" />,
    casual: false
  },
  {
    id: 'univ-2',
    category: 'Academic',
    text: "If you could take any class outside your major, what would it be?",
    icon: <Book className="w-4 h-4" />,
    casual: false
  },
  {
    id: 'univ-3',
    category: 'Academic',
    text: "What's your dream job after graduation?",
    icon: <Book className="w-4 h-4" />,
    casual: false
  },

  // Interests & Hobbies
  {
    id: 'hobby-1',
    category: 'Interests',
    text: "I see we both like [shared interest] - what got you into it?",
    icon: <Heart className="w-4 h-4" />,
    casual: true
  },
  {
    id: 'hobby-2',
    category: 'Interests',
    text: "What's something you're passionate about that most people don't know?",
    icon: <Lightbulb className="w-4 h-4" />,
    casual: true
  },
  {
    id: 'hobby-3',
    category: 'Interests',
    text: "If you had a free weekend, what would be your ideal way to spend it?",
    icon: <Smile className="w-4 h-4" />,
    casual: true
  },

  // Coffee & Casual
  {
    id: 'casual-1',
    category: 'Casual',
    text: "Coffee or tea? And what's your go-to order?",
    icon: <Coffee className="w-4 h-4" />,
    casual: true
  },
  {
    id: 'casual-2',
    category: 'Casual',
    text: "What's the best study spot you've discovered on campus?",
    icon: <Coffee className="w-4 h-4" />,
    casual: true
  },
  {
    id: 'casual-3',
    category: 'Casual',
    text: "Any recommendations for someone new to campus?",
    icon: <Coffee className="w-4 h-4" />,
    casual: true
  },

  // Music & Entertainment
  {
    id: 'music-1',
    category: 'Entertainment',
    text: "What's been on repeat in your playlist lately?",
    icon: <Music className="w-4 h-4" />,
    casual: true
  },
  {
    id: 'music-2',
    category: 'Entertainment',
    text: "Have you been to any good concerts or shows recently?",
    icon: <Music className="w-4 h-4" />,
    casual: true
  },
  {
    id: 'music-3',
    category: 'Entertainment',
    text: "What's a movie or show you could watch over and over?",
    icon: <Music className="w-4 h-4" />,
    casual: true
  },

  // Travel & Experiences
  {
    id: 'travel-1',
    category: 'Travel',
    text: "What's the most interesting place you've visited?",
    icon: <Plane className="w-4 h-4" />,
    casual: false
  },
  {
    id: 'travel-2',
    category: 'Travel',
    text: "If you could study abroad anywhere, where would you go?",
    icon: <Plane className="w-4 h-4" />,
    casual: false
  },
  {
    id: 'travel-3',
    category: 'Travel',
    text: "What's on your post-graduation travel bucket list?",
    icon: <Plane className="w-4 h-4" />,
    casual: false
  },

  // Deep & Meaningful
  {
    id: 'deep-1',
    category: 'Thoughtful',
    text: "What's something that's changed your perspective recently?",
    icon: <Lightbulb className="w-4 h-4" />,
    casual: false
  },
  {
    id: 'deep-2',
    category: 'Thoughtful',
    text: "If you could have dinner with anyone, dead or alive, who would it be?",
    icon: <Lightbulb className="w-4 h-4" />,
    casual: false
  },
  {
    id: 'deep-3',
    category: 'Thoughtful',
    text: "What's a skill you'd love to learn but haven't had time for?",
    icon: <Lightbulb className="w-4 h-4" />,
    casual: false
  }
];

export function IceBreakers({ profile, onSelectPrompt, showSendButton = false }: IceBreakerProps) {
  const [selectedPrompts, setSelectedPrompts] = useState<ConversationPrompt[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', 'Academic', 'Interests', 'Casual', 'Entertainment', 'Travel', 'Thoughtful'];

  useEffect(() => {
    generatePersonalizedPrompts();
  }, [profile]);

  const generatePersonalizedPrompts = () => {
    let personalizedPrompts = [...conversationPrompts];
    
    if (profile) {
      // Customize prompts based on profile data
      if (profile.interests?.length) {
        const sharedInterest = profile.interests[0]; // Use first interest as example
        personalizedPrompts = personalizedPrompts.map(prompt => {
          if (prompt.text.includes('[shared interest]')) {
            return {
              ...prompt,
              text: prompt.text.replace('[shared interest]', sharedInterest.toLowerCase())
            };
          }
          return prompt;
        });
      }

      // Add university-specific prompts
      if (profile.university) {
        personalizedPrompts.push({
          id: 'univ-custom',
          category: 'Academic',
          text: `How are you finding ${profile.university}?`,
          icon: <Book className="w-4 h-4" />,
          casual: true
        });
      }

      // Add course-specific prompt
      if (profile.course_of_study) {
        personalizedPrompts.push({
          id: 'course-custom',
          category: 'Academic',
          text: `What's the most challenging part about studying ${profile.course_of_study}?`,
          icon: <Book className="w-4 h-4" />,
          casual: false
        });
      }
    }

    // Randomly select 6-8 prompts
    const shuffled = personalizedPrompts.sort(() => 0.5 - Math.random());
    setSelectedPrompts(shuffled.slice(0, 8));
  };

  const filteredPrompts = selectedPrompts.filter(prompt => 
    activeCategory === 'all' || prompt.category === activeCategory
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Academic: 'bg-blue-100 text-blue-800 border-blue-200',
      Interests: 'bg-pink-100 text-pink-800 border-pink-200',
      Casual: 'bg-green-100 text-green-800 border-green-200',
      Entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
      Travel: 'bg-orange-100 text-orange-800 border-orange-200',
      Thoughtful: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Conversation Starters</CardTitle>
        </div>
        <CardDescription>
          Break the ice with these thoughtful conversation prompts
        </CardDescription>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-wrap gap-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="text-xs capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={generatePersonalizedPrompts}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onSelectPrompt?.(prompt.text)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent">
                  {prompt.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                    {prompt.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(prompt.category)}`}
                    >
                      {prompt.category}
                    </Badge>
                    {prompt.casual && (
                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                        Casual
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {showSendButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPrompt?.(prompt.text);
                  }}
                >
                  <Send className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {filteredPrompts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No prompts found for this category</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveCategory('all')}
              className="mt-2"
            >
              View all prompts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple version for quick suggestions
export function QuickIceBreakers({ profile, onSelect }: { profile?: any; onSelect: (prompt: string) => void }) {
  const quickPrompts = [
    "Hey! I see we go to the same university 👋",
    "What's your favorite spot on campus?",
    "Coffee or tea person?",
    "How's your semester going so far?",
    "Any good Netflix recommendations?"
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {quickPrompts.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(prompt)}
          className="text-xs"
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}