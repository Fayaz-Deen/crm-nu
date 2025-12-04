import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Rocket, CheckCircle2, Cake, Heart, Check, X } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Password strength calculation
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

// Password requirements
const passwordRequirements = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'One number' },
  { regex: /[^A-Za-z0-9]/, label: 'One special character' },
];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  // Watch password for real-time validation
  const password = useWatch({ control, name: 'password', defaultValue: '' });
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.register(
        data.email,
        data.password,
        data.name,
        data.birthday || undefined,
        data.anniversary || undefined
      );
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

                  <div className="space-y-2">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="pl-12 pr-12 h-12 text-base"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.label === 'Weak' ? 'text-red-500' :
                            passwordStrength.label === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>

                        {/* Password Requirements Checklist */}
                        <div className="grid grid-cols-2 gap-1">
                          {passwordRequirements.map((req) => {
                            const met = req.regex.test(password);
                            return (
                              <div key={req.label} className="flex items-center gap-1.5 text-xs">
                                {met ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <X className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                                )}
                                <span className={met ? 'text-green-600 dark:text-green-400' : 'text-[hsl(var(--muted-foreground))]'}>
                                  {req.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      className="pl-12 pr-12 h-12 text-base"
                      {...register('confirmPassword')}
                      error={errors.confirmPassword?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Optional fields */}
                  <div className="pt-2">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">Optional - we'll remind you!</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                          <Cake className="h-3.5 w-3.5" />
                          Your Birthday
                        </label>
                        <Input
                          type="date"
                          className="h-11 text-sm"
                          {...register('birthday')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" />
                          Anniversary
                        </label>
                        <Input
                          type="date"
                          className="h-11 text-sm"
                          {...register('anniversary')}
                        />
                      </div>
                    </div>
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
