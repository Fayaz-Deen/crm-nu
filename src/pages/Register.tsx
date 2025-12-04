import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Rocket, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// TypeScript declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const features = [
  'Unlimited contacts',
  'Birthday & anniversary reminders',
  'Task management',
  'Calendar integration',
  'Contact sharing',
];

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Handle Google Sign-In credential response
  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setError('');
    try {
      const authResponse = await authApi.googleAuth({ idToken: response.credential });
      setAuth(authResponse.user, authResponse.token, authResponse.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed');
    }
  }, [navigate, setAuth]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current!, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          width: 400,
        });
      }
    };

    // Check if Google script is already loaded
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      // Cleanup after 5 seconds
      setTimeout(() => clearInterval(checkGoogle), 5000);
    }
  }, [handleGoogleCredential]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.register(data.email, data.password, data.name);
      setAuth(response.user, response.token, response.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0">
          {/* Decorative circles */}
          <div className="absolute top-40 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.gif" alt="Nu-Connect" className="h-14 w-14 rounded-2xl object-contain bg-white/20 backdrop-blur-sm p-2" />
            <span className="text-2xl font-bold">Nu-Connect</span>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Start your journey<br />today
          </h1>

          <p className="text-xl text-white/80 mb-10 max-w-md">
            Join thousands of professionals who use Nu-Connect to manage their network effectively.
          </p>

          <div className="space-y-4">
            <p className="text-sm font-medium text-white/60 uppercase tracking-wider">What you get</p>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-[hsl(var(--background))] p-6 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <img src="/logo.gif" alt="Nu-Connect" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-xl font-bold">Nu-Connect</span>
          </div>

          <Card className="border-0 shadow-strong">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow animate-float">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription className="text-base">
                Get started with your free account
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Google Sign Up - Primary Option */}
              <div className="flex justify-center mb-6">
                <div ref={googleButtonRef} className="w-full flex justify-center" />
              </div>
              {!GOOGLE_CLIENT_ID && (
                <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mb-6">
                  Google Sign-Up not configured
                </p>
              )}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[hsl(var(--border))]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[hsl(var(--card))] px-4 text-[hsl(var(--muted-foreground))] font-medium">
                    Or sign up with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/20 p-4 text-sm text-[hsl(var(--destructive))] animate-fade-in flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]" />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      className="pl-12 h-12 text-base"
                      {...register('name')}
                      error={errors.name?.message}
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="pl-12 h-12 text-base"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className="pl-12 pr-12 h-12 text-base"
                      {...register('password')}
                      error={errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      className="pl-12 h-12 text-base"
                      {...register('confirmPassword')}
                      error={errors.confirmPassword?.message}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-opacity btn-press group"
                  isLoading={isLoading}
                >
                  Create account
                  {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center pt-2 pb-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-6">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:text-[hsl(var(--foreground))]">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-[hsl(var(--foreground))]">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
