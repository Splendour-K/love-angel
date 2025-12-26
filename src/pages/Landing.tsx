import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Heart, Shield, GraduationCap, MessageCircle, Users, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-semibold text-foreground">UniMatch</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/80 rounded-full px-4 py-2 mb-8 animate-fade-in-up">
            <GraduationCap className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">Exclusively for University Students</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6 animate-fade-in-up delay-100">
            Find Your <span className="text-gradient">Perfect Match</span> on Campus
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
            Connect with fellow students who share your interests, values, and dreams. 
            UniMatch is designed for meaningful relationships, not hookups.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <Heart className="w-5 h-5" />
                Start Your Journey
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                I Already Have an Account
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6 animate-fade-in-up delay-400">
            Free to join · University email required · No credit card needed
          </p>
        </div>

        {/* Floating hearts decoration */}
        <div className="relative mt-16">
          <div className="absolute -top-8 left-1/4 animate-float">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-card">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="absolute -top-4 right-1/4 animate-float delay-200">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-card">
              <Sparkles className="w-6 h-6 text-secondary-foreground" />
            </div>
          </div>
          <div className="absolute top-8 left-1/3 animate-float delay-400">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-soft">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 gradient-warm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Why Students Love UniMatch
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've built a dating experience that prioritizes what matters most: genuine connections.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<GraduationCap className="w-8 h-8" />}
              title="Verified Students Only"
              description="Sign up with your university email to join a community of verified students. Safe, trusted, and exclusive."
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Meaningful Matches"
              description="Our algorithm focuses on shared interests, values, and compatibility—not just looks."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Your Safety First"
              description="Built-in safety features including blocking, reporting, and message limits for new matches."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Find your match in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Create Your Profile"
              description="Sign up with your .edu email and share your interests, course, and what you're looking for."
            />
            <StepCard
              number="2"
              title="Discover Matches"
              description="Browse profiles, swipe through potential matches, or check out our curated recommendations."
            />
            <StepCard
              number="3"
              title="Start Connecting"
              description="When you both match, start chatting! Take your time getting to know each other."
            />
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 mb-8">
              <Users className="w-4 h-4 text-secondary-foreground" />
              <span className="text-sm font-medium text-secondary-foreground">Our Community Values</span>
            </div>
            
            <h2 className="text-4xl font-display font-bold text-foreground mb-6">
              A Safe Space for Everyone
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10">
              UniMatch is built on respect, kindness, and authenticity. We're committed to maintaining 
              a welcoming environment where everyone can find meaningful connections.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-left">
              <GuidelineItem text="Be respectful and kind to everyone" />
              <GuidelineItem text="Use recent, authentic photos" />
              <GuidelineItem text="Keep conversations appropriate" />
              <GuidelineItem text="Report any concerning behavior" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
            Ready to Find Your Match?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            Join thousands of university students already making meaningful connections on UniMatch.
          </p>
          <Link to="/auth?mode=signup">
            <Button 
              variant="secondary" 
              size="xl" 
              className="bg-card text-foreground hover:bg-card/90"
            >
              <Heart className="w-5 h-5" />
              Join UniMatch Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">UniMatch</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 UniMatch. Made with ❤️ for university students.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 group">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-xl font-display font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
        <span className="text-2xl font-bold text-primary-foreground">{number}</span>
      </div>
      <h3 className="text-xl font-display font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function GuidelineItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-soft">
      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-foreground">{text}</span>
    </div>
  );
}
