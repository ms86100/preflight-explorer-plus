import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back',
        description: 'You have been signed in successfully.',
      });
      navigate('/');
    }
  };

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.displayName);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created',
        description: 'Please check your email to confirm your account.',
      });
      setActiveTab('signin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-primary" viewBox="0 0 32 32" fill="none">
                <path d="M15.9 3L4 28h6l3-6.5h10l3 6.5h6L20.1 3h-4.2z" fill="currentColor" opacity="0.9"/>
                <path d="M13 17.5L16 10l3 7.5H13z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Jira Software</h1>
          </div>

          <Card className="shadow-sm border">
            <CardHeader className="pb-2 pt-4 px-6">
              <p className="text-center text-sm text-muted-foreground">
                Log in to your account
              </p>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
                  <TabsTrigger value="signin" className="text-sm">Log in</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm">Sign up</TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin" className="space-y-3 mt-0">
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-sm font-medium">Username</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your username or email"
                        className="h-9 text-sm"
                        {...signInForm.register('email')}
                      />
                      {signInForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {signInForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="h-9 text-sm pr-10"
                          {...signInForm.register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {signInForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {signInForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Log in'}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Can't access your account?
                    </Link>
                  </div>

                  <div className="relative my-3">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      OR
                    </span>
                  </div>

                  {/* SSO Button */}
                  <Button variant="outline" className="w-full h-9 gap-2 text-sm">
                    <Lock className="h-4 w-4" />
                    Continue with SSO
                  </Button>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup" className="space-y-3 mt-0">
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="h-9 text-sm"
                        {...signUpForm.register('displayName')}
                      />
                      {signUpForm.formState.errors.displayName && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="h-9 text-sm"
                        {...signUpForm.register('email')}
                      />
                      {signUpForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          className="h-9 text-sm pr-10"
                          {...signUpForm.register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {signUpForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        className="h-9 text-sm"
                        {...signUpForm.register('confirmPassword')}
                      />
                      {signUpForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Sign up'}
                    </Button>
                  </form>

                  <p className="text-xs text-center text-muted-foreground">
                    By signing up, you agree to our terms of service and privacy policy.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Atlassian · Privacy policy · User notice
          </p>
        </div>
      </div>
    </div>
  );
}