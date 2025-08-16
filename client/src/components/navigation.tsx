import { useState } from 'react';
import { useTheme } from './theme-provider';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Sun, Moon, Zap, Menu, X, Home, Info, Shield, HelpCircle, User, LogOut, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'wouter';

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
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
      {/* Layout Lines for Navigation */}
      <div className="absolute top-16 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none z-40"></div>
      <nav className="bg-card border-b-2 border-border sticky top-0 z-50 relative">
        {/* Navigation accent line */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">BOLT</h1>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-accent">{t('nav.transfer')}</Button>
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-accent">{t('nav.product')}</Button>
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-accent">{t('nav.pricing')}</Button>
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-accent">{t('nav.download')}</Button>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                {t('nav.contact')}
              </Button>
              {/* Authentication */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-foreground hover:text-accent-foreground hover:bg-accent"
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
                    <span className="hidden sm:inline">{t('nav.login')}</span>
                  </Button>
                </Link>
              )}
              
              {/* Theme toggle */}
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0"
                    data-testid="button-language-toggle"
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {availableLanguages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
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
                className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                data-testid="button-mobile-menu"
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-card border-b-2 border-border relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    location === link.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="font-medium">{link.label}</span>
                </div>
              </Link>
            ))}
            
            {/* Mobile auth section */}
            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Signed in as {user.username}
                  </div>
                  <Link href="/dashboard">
                    <div 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 cursor-pointer w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link href="/auth">
                  <div 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md border border-border cursor-pointer hover:bg-accent/50"
                  >
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}