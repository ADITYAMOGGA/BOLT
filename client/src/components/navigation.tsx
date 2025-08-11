import { useState } from 'react';
import { useTheme } from './theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { Sun, Moon, Zap, Menu, X, Home, Info, Shield, HelpCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'wouter';

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard', icon: User }] : []),
    { href: '/about', label: 'About', icon: Info },
    { href: '/privacy', label: 'Privacy', icon: Shield },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">BOLT</h1>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer text-sm font-medium ${
                    location === link.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}>
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </span>
                </Link>
              ))}
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-3">
              {/* Authentication */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                      data-testid="button-user-menu"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline font-medium">{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                      Signed in as {user.username}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-dashboard">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-destructive cursor-pointer"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-testid="button-login-nav"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              )}
              
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-9 h-9 p-0"
                data-testid="button-theme-toggle"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
              
              {/* Mobile menu button */}
              <button
                onClick={toggleMenu}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-lg animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-2">
              {navLinks.map((link, index) => (
                <Link key={link.href} href={link.href}>
                  <div 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      location === link.href
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: isMenuOpen ? `slideInLeft 0.3s ease-out forwards` : 'none'
                    }}
                    onClick={toggleMenu}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
