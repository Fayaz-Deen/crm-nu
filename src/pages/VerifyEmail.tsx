import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';
import { authApi } from '../services/api';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await authApi.verifyEmail(verificationToken);
      setStatus('success');
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
              </div>
              <CardTitle>Verifying your email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-green-600 dark:text-green-400">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You will be redirected to login shortly.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--destructive))]/10">
                <XCircle className="h-8 w-8 text-[hsl(var(--destructive))]" />
              </div>
              <CardTitle className="text-[hsl(var(--destructive))]">Verification Failed</CardTitle>
              <CardDescription>{error || 'The verification link is invalid or has expired.'}</CardDescription>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                <Mail className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to your email address. Click the link to verify your account.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {status === 'success' && (
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <Link to="/login">
                <Button variant="outline">Back to Login</Button>
              </Link>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Need a new verification email?{' '}
                <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
                  Sign in and request one
                </Link>
              </p>
            </div>
          )}

          {status === 'no-token' && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Didn't receive the email? Check your spam folder or{' '}
                <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
                  sign in to resend
                </Link>
              </p>
              <Link to="/login">
                <Button variant="outline">Back to Login</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
