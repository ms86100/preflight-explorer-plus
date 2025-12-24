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
    .regex(/\d/, 'Password must contain at least one number'),
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

  // Hooks must be called before any conditional returns (S6440)
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 safe-area-pt safe-area-pb">
        <div className="w-full max-w-sm">
          {/* Logo - Larger on mobile for app feel */}
          <div className="text-center mb-8 sm:mb-6">
            <div className="inline-flex items-center justify-center mb-4 w-16 h-16 sm:w-12 sm:h-12 rounded-2xl sm:rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-glow">
              <svg className="w-8 h-8 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-xl font-bold text-foreground">Vertex</h1>
            <p className="text-sm text-muted-foreground mt-1">Work Platform</p>
          </div>

          <Card className="shadow-lg sm:shadow-sm border-0 sm:border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-5 sm:pt-4 px-5 sm:px-6">
              <p className="text-center text-sm text-muted-foreground">
                {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
              </p>
            </CardHeader>

            <CardContent className="px-5 sm:px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-5 sm:mb-4 h-11 sm:h-9">
                  <TabsTrigger value="signin" className="text-sm font-medium">Log in</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-medium">Sign up</TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin" className="space-y-4 sm:space-y-3 mt-0">
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4 sm:space-y-3">
                    <div className="space-y-2 sm:space-y-1.5">
                      <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="h-12 sm:h-9 text-base sm:text-sm rounded-xl sm:rounded-lg"
                        autoComplete="email"
                        {...signInForm.register('email')}
                      />
                      {signInForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {signInForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 sm:space-y-1.5">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="h-12 sm:h-9 text-base sm:text-sm pr-12 rounded-xl sm:rounded-lg"
                          autoComplete="current-password"
                          {...signInForm.register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-7 sm:w-7 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {signInForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {signInForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 sm:h-9 text-base sm:text-sm font-semibold rounded-xl sm:rounded-lg active:scale-[0.98] transition-transform" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Log in'}
                    </Button>
                  </form>

                  <div className="relative my-4 sm:my-3">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                      OR
                    </span>
                  </div>

                  {/* SSO Button */}
                  <Button 
                    variant="outline" 
                    className="w-full h-12 sm:h-9 gap-2 text-base sm:text-sm rounded-xl sm:rounded-lg active:scale-[0.98] transition-transform"
                  >
                    <Lock className="h-5 w-5 sm:h-4 sm:w-4" />
                    Continue with SSO
                  </Button>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup" className="space-y-4 sm:space-y-3 mt-0">
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4 sm:space-y-3">
                    <div className="space-y-2 sm:space-y-1.5">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="h-12 sm:h-9 text-base sm:text-sm rounded-xl sm:rounded-lg"
                        autoComplete="name"
                        {...signUpForm.register('displayName')}
                      />
                      {signUpForm.formState.errors.displayName && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 sm:space-y-1.5">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="h-12 sm:h-9 text-base sm:text-sm rounded-xl sm:rounded-lg"
                        autoComplete="email"
                        {...signUpForm.register('email')}
                      />
                      {signUpForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 sm:space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          className="h-12 sm:h-9 text-base sm:text-sm pr-12 rounded-xl sm:rounded-lg"
                          autoComplete="new-password"
                          {...signUpForm.register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-7 sm:w-7 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {signUpForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 sm:space-y-1.5">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        className="h-12 sm:h-9 text-base sm:text-sm rounded-xl sm:rounded-lg"
                        autoComplete="new-password"
                        {...signUpForm.register('confirmPassword')}
                      />
                      {signUpForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {signUpForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 sm:h-9 text-base sm:text-sm font-semibold rounded-xl sm:rounded-lg active:scale-[0.98] transition-transform" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Sign up'}
                    </Button>
                  </form>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    By signing up, you agree to our terms of service and privacy policy.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}