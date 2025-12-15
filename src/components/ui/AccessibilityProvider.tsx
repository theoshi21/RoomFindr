'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  setFontSize: (size: 'normal' | 'large' | 'larger') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const announceRef = useRef<HTMLDivElement>(null);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');

  useEffect(() => {
    // Check for user preferences
    const checkPreferences = () => {
      setIsHighContrast(window.matchMedia('(prefers-contrast: high)').matches);
      setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    checkPreferences();

    // Listen for changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    contrastQuery.addEventListener('change', checkPreferences);
    motionQuery.addEventListener('change', checkPreferences);

    return () => {
      contrastQuery.removeEventListener('change', checkPreferences);
      motionQuery.removeEventListener('change', checkPreferences);
    };
  }, []);

  useEffect(() => {
    // Apply font size to document
    const fontSizeClasses = {
      normal: '',
      large: 'text-lg',
      larger: 'text-xl',
    };

    document.documentElement.className = document.documentElement.className
      .replace(/text-(lg|xl)/g, '')
      .trim();

    if (fontSizeClasses[fontSize]) {
      document.documentElement.classList.add(fontSizeClasses[fontSize]);
    }
  }, [fontSize]);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        announceToScreenReader,
        isHighContrast,
        isReducedMotion,
        fontSize,
        setFontSize,
      }}
    >
      {children}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  );
}

// Accessibility toolbar component
export function AccessibilityToolbar() {
  const { fontSize, setFontSize, announceToScreenReader } = useAccessibilityContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleFontSizeChange = (newSize: 'normal' | 'large' | 'larger') => {
    setFontSize(newSize);
    announceToScreenReader(`Font size changed to ${newSize}`);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-2 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Accessibility options"
        aria-expanded={isOpen}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-md shadow-lg p-4 min-w-48">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Accessibility Options
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Font Size
              </label>
              <div className="space-y-1">
                {(['normal', 'large', 'larger'] as const).map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="radio"
                      name="fontSize"
                      value={size}
                      checked={fontSize === size}
                      onChange={() => handleFontSizeChange(size)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}