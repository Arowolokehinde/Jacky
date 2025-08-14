'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before showing icons
  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { 
      id: 'light' as const, 
      icon: Sun, 
      label: 'Light',
      description: 'Clean and bright interface'
    },
    { 
      id: 'dark' as const, 
      icon: Moon, 
      label: 'Dark',
      description: 'Easy on the eyes in low light'
    },
    { 
      id: 'system' as const, 
      icon: Monitor, 
      label: 'System',
      description: 'Follow your device settings'
    }
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[2];
  
  // Get appropriate icon based on resolved theme when in system mode
  const getDisplayIcon = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? Moon : Sun;
    }
    return currentTheme.icon;
  };

  const handleQuickToggle = (e: React.MouseEvent) => {
    if (e.detail === 2) { // Double click
      setShowOptions(true);
    } else {
      toggleTheme();
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="p-2.5 bg-[var(--bg-pill-dark)] rounded-xl w-10 h-10 animate-pulse" />
    );
  }

  const DisplayIcon = getDisplayIcon();

  return (
    <div className="relative">
      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05, rotate: theme === 'system' ? 0 : 15 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleQuickToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowOptions(true);
        }}
        className="relative p-2.5 bg-[var(--bg-pill-dark)] hover:bg-[var(--bg-hover)] 
                   rounded-xl transition-all duration-200 border border-[var(--border)]
                   hover:border-[var(--accent-primary)]/30 shadow-sm hover:shadow-md
                   group overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
        title={`Current: ${currentTheme.label}${theme === 'system' ? ` (${resolvedTheme})` : ''} - Click to cycle, right-click for options`}
        aria-label={`Theme toggle: ${currentTheme.label}`}
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-blue-600/10 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon container with smooth transition */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${theme}-${resolvedTheme}`}
              initial={{ rotate: -180, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 180, scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 0.3
              }}
            >
              <DisplayIcon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
            </motion.div>
          </AnimatePresence>

          {/* System indicator dot */}
          {theme === 'system' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--accent-primary)] rounded-full border border-[var(--bg-primary)]"
              title="Following system theme"
            />
          )}
        </div>

        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                        transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </motion.button>

      {/* Theme Options Dropdown */}
      <AnimatePresence>
        {showOptions && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute right-0 top-full mt-2 bg-[var(--bg-primary)] border border-[var(--border)] 
                         rounded-xl shadow-xl backdrop-blur-xl z-50 min-w-64 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Appearance</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Choose how Jacky AI looks to you
                </p>
              </div>
              
              {/* Theme Options */}
              <div className="p-2">
                {themes.map((themeOption, index) => {
                  const Icon = themeOption.icon;
                  const isSelected = theme === themeOption.id;
                  const isSystemActive = themeOption.id === 'system' && theme === 'system';
                  
                  return (
                    <motion.button
                      key={themeOption.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTheme(themeOption.id);
                        setShowOptions(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg 
                                 transition-all duration-200 group/item relative ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-white shadow-md'
                          : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                      }`}
                    >
                      {/* Icon container */}
                      <div className={`relative p-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-white/20'
                          : 'bg-[var(--bg-pill-light)] group-hover/item:bg-[var(--bg-pill-dark)]'
                      }`}>
                        <Icon className="w-4 h-4" />
                        
                        {/* System theme indicator */}
                        {isSystemActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full"
                          />
                        )}
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{themeOption.label}</span>
                          {themeOption.id === 'system' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-[var(--bg-pill-light)] text-[var(--text-tertiary)]'
                            }`}>
                              {resolvedTheme}
                            </span>
                          )}
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'
                        }`}>
                          {themeOption.description}
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-2 h-2 bg-white rounded-full flex-shrink-0"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer with tips */}
              <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                  💡 <strong>Pro tip:</strong> Quick click to cycle themes, double-click or right-click for options
                </p>
              </div>
            </motion.div>

            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" 
              onClick={() => setShowOptions(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}