'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '../notification';
import { supabase } from '../../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 
                className="text-xl font-bold text-gray-900 cursor-pointer"
                onClick={() => handleNavigation('/')}
              >
                RoomFindr
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <span 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                onClick={() => handleNavigation('/')}
              >
                Home
              </span>
              <span 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                onClick={() => handleNavigation('/search')}
              >
                Search
              </span>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Notification Bell */}
                  {!loading && (
                    <NotificationBell userId={user.id} />
                  )}
                  
                  <span 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    Dashboard
                  </span>
                  <span 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                    onClick={() => handleNavigation('/profile')}
                  >
                    Profile
                  </span>
                </div>
              ) : (
                <span 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  onClick={() => handleNavigation('/auth/login')}
                >
                  Login
                </span>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600 text-sm">
            © 2025 RoomFindr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;