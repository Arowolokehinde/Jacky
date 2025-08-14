'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // The actual applied theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Apply theme to document
  const applyTheme = (themeToApply: Theme) => {
    let actualTheme: 'light' | 'dark';
    
    if (themeToApply === 'system') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = themeToApply;
    }
    
    setResolvedTheme(actualTheme);
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Also update the class for compatibility
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualTheme);
  };

  // Initialize theme from localStorage or default to system
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } catch (error) {
      console.error('Error loading theme:', error);
      setThemeState('system');
      applyTheme('system');
    } finally {
      setMounted(true);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Only update if current theme is 'system'
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    // Cycle through: system -> light -> dark -> system
    let newTheme: Theme;
    
    switch (theme) {
      case 'system':
        newTheme = 'light';
        break;
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'system';
        break;
      default:
        newTheme = 'system';
    }
    
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}