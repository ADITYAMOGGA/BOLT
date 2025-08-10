import { useState } from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon, Zap, Menu, X, Home, Info, Shield, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/about', label: 'About', icon: Info },
    { href: '/privacy', label: 'Privacy', icon: Shield },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BOLT</h1>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer ${
                    location === link.href
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}>
                    <link.icon className="w-4 h-4" />
                    <span className="font-medium">{link.label}</span>
                  </span>
                </Link>
              ))}
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-300"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-300"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 animate-fade-in" onClick={toggleMenu}>
          {/* Mobile Menu Panel */}
          <div 
            className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">BOLT</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>
            
            {/* Menu Items */}
            <div className="p-6 space-y-4">
              {navLinks.map((link, index) => (
                <Link key={link.href} href={link.href}>
                  <div 
                    className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:transform hover:scale-105 ${
                      location === link.href
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: isMenuOpen ? `slideInRight 0.3s ease-out forwards` : 'none'
                    }}
                    onClick={toggleMenu}
                  >
                    <div className={`p-2 rounded-lg ${
                      location === link.href
                        ? 'bg-blue-200 dark:bg-blue-800'
                        : 'bg-gray-100 dark:bg-slate-600'
                    }`}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-lg">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-slate-700">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fast & Secure File Sharing
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  © 2024 BOLT
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
