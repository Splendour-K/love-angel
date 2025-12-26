import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailValidationInput } from '@/components/EmailValidationInput';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Heart, Mail, Lock, User, ArrowRight, GraduationCap } from 'lucide-react';
import { z } from 'zod';
import { UniversityValidationResult } from '@/lib/universityValidation';

const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailValidation, setEmailValidation] = useState<UniversityValidationResult | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/discover');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        // Additional email validation check for signup
        if (!isEmailValid || !emailValidation?.isValid) {
          setErrors({ email: 'Please provide a valid university email address' });
          setLoading(false);
          return;
        }

        const result = signUpSchema.safeParse({ firstName, email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, firstName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'This email is already registered. Try signing in instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: error.message,
            });
          }
          setLoading(false);
          return;
        }

        toast({
          title: 'Welcome to UniMatch! 🎉',
          description: "Let's set up your profile to start matching.",
        });
        navigate('/onboarding');
      } else {
        const result = signInSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
          });
          setLoading(false);
          return;
        }

        navigate('/discover');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-semibold text-foreground">UniMatch</span>
          </Link>

          <div className="bg-card rounded-2xl p-8 shadow-card">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {isSignUp ? 'Join UniMatch' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isSignUp
                ? 'Create your account with your university email'
                : 'Sign in to continue finding your match'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {isSignUp ? (
                  <EmailValidationInput
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                    onValidationChange={(isValid, validation) => {
                      setIsEmailValid(isValid);
                      setEmailValidation(validation);
                    }}
                  />
                ) : (
                  <>
                    <Label htmlFor="email">University Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {isSignUp && (
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  'Please wait...'
                ) : isSignUp ? (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-primary-foreground/20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
            <Heart className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
            Real Connections Start Here
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Join a community of university students looking for meaningful relationships, 
            shared interests, and genuine connections.
          </p>
        </div>
      </div>
    </div>
  );
}
