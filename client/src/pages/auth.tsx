import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, LogIn, UserPlus, AlertTriangle, ArrowLeft, Zap, Shield, Rocket, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string().min(4, 'Password must be at least 4 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError('');

    try {
      await login(values.username, values.password);
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    setError('');

    try {
      await signup(values.username, values.password);
      toast({
        title: 'Account created!',
        description: 'Please login with your new account.',
      });
      setMode('login');
      signupForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Objects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 rounded-lg rotate-45 blur-lg animate-float-delayed" />
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-500/15 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-20 right-40 w-28 h-28 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-lg rotate-12 blur-lg animate-bounce-slow" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-400/25 to-blue-600/25 rounded-full blur-md animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/3 w-36 h-36 bg-gradient-to-br from-indigo-400/15 to-purple-600/15 rounded-2xl rotate-45 blur-xl animate-float-reverse" />
        
        {/* Particle-like dots */}
        <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-blue-500/40 rounded-full animate-ping" />
        <div className="absolute top-3/4 left-1/4 w-2 h-2 bg-emerald-500/40 rounded-full animate-ping delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-purple-500/30 rounded-full animate-ping delay-2000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BOLT</h1>
            </div>
          </Link>
          
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="flex min-h-screen relative z-10">
        {/* Left Side - Info */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="flex flex-col justify-center px-16 py-24 relative z-10">
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Fast & Secure File Sharing
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Upload files up to 200MB and share them instantly with secure links. Your files, your control.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Secure Transfer</h3>
                    <p className="text-gray-600 dark:text-gray-300">End-to-end encrypted file sharing</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Auto-Delete</h3>
                    <p className="text-gray-600 dark:text-gray-300">Files automatically expire in 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Track Files</h3>
                    <p className="text-gray-600 dark:text-gray-300">Keep track of your uploads with an account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-24 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 p-8 transition-all duration-700 hover:shadow-3xl hover:scale-[1.02]">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {mode === 'login' ? (
                    <LogIn className="w-8 h-8 text-blue-600" />
                  ) : (
                    <UserPlus className="w-8 h-8 text-emerald-600" />
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {mode === 'login' 
                    ? 'Sign in to access your files' 
                    : 'Join to keep track of your uploads'
                  }
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-xl p-1 mb-6 border border-gray-200/50 dark:border-slate-600/50">
                <button
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 transform ${
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-lg scale-105 border border-blue-200/50 dark:border-blue-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50'
                  }`}
                  data-testid="tab-login"
                >
                  Login
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 transform ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-lg scale-105 border border-emerald-200/50 dark:border-emerald-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50'
                  }`}
                  data-testid="tab-signup"
                >
                  Sign Up
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <div className="relative">
                {mode === 'login' && (
                  <div className="animate-fade-in-up">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              data-testid="input-login-username"
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password"
                              data-testid="input-login-password"
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                        <Button 
                          type="submit" 
                          className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl" 
                          disabled={isLoading}
                          data-testid="button-login-submit"
                        >
                          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          Sign In
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {/* Signup Form */}
                {mode === 'signup' && (
                  <div className="animate-fade-in-up">
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-6">
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Choose a username" 
                              data-testid="input-signup-username"
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Choose a password"
                              data-testid="input-signup-password"
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your password"
                              data-testid="input-confirm-password"
                              className="h-12"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                        <Button 
                          type="submit" 
                          className="w-full h-12 text-lg font-medium bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl" 
                          disabled={isLoading}
                          data-testid="button-signup-submit"
                        >
                          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          Create Account
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                    data-testid="switch-mode-link"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}