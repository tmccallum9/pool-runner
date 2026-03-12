'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/UserContext';
import { Button } from '../atoms/button';
import { Heading } from '../atoms/heading';

export const Header: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(pathname || '/')}`;

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              P
            </div>
            <Heading level={4} className="text-xl">
              Pool Runner
            </Heading>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  {user?.email || 'User'}
                </span>
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    My Pools
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href={signInHref}>
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
