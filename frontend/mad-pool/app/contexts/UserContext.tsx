'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../lib/types';

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from JWT token on mount
  useEffect(() => {
    const loadUser = async () => {
      const authToken = localStorage.getItem('authToken');

      if (authToken) {
        // Fetch user from backend using JWT token
        try {
          const response = await fetch(
            process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8000/graphql/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                query: 'query { me { id email createdAt } }',
              }),
            }
          );

          const data = await response.json();

          if (data.data?.me) {
            setUserState(data.data.me);
          } else if (data.errors) {
            console.error('Failed to fetch user:', data.errors);
            // Token might be expired or invalid
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      } else {
        // Fallback to mock user (for backward compatibility)
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
          try {
            setUserState(JSON.parse(storedUser));
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('mockUser');
          }
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    // Keep mock user for backward compatibility
    if (newUser && !localStorage.getItem('authToken')) {
      localStorage.setItem('mockUser', JSON.stringify(newUser));
    } else if (!newUser) {
      localStorage.removeItem('mockUser');
    }
  };

  const signOut = () => {
    setUserState(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockUser');
  };

  const value: UserContextType = {
    user,
    isAuthenticated: !!user,
    setUser,
    signOut,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useAuth(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
}
