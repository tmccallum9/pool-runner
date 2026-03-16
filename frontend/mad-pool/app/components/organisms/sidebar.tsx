'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heading } from '../atoms/heading';
import { DraftStatus } from '@/app/lib/types';

interface SidebarProps {
  poolId: string;
  poolName: string;
  draftStatus: DraftStatus;
  isOwner?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  poolId,
  poolName,
  draftStatus,
  isOwner = false,
}) => {
  const pathname = usePathname();

  const baseNavItems = [
    {
      href: `/pools/${poolId}`,
      label: 'Dashboard',
      icon: '📊',
      active: pathname === `/pools/${poolId}`,
    },
    {
      href: `/pools/${poolId}/draft`,
      label: 'Draft',
      icon: '📝',
      active: pathname === `/pools/${poolId}/draft`,
      badge:
        draftStatus === DraftStatus.IN_PROGRESS ? (
          <span className="ml-2 flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
          </span>
        ) : null,
    },
    {
      href: `/pools/${poolId}/leaderboard`,
      label: 'Leaderboard',
      icon: '🏆',
      active: pathname === `/pools/${poolId}/leaderboard`,
    },
  ];

  // Add Results navigation item for pool owners only
  const ownerNavItems = isOwner
    ? [
        {
          href: `/pools/${poolId}/results`,
          label: 'Results',
          icon: '🎯',
          active: pathname === `/pools/${poolId}/results`,
          badge: null,
        },
      ]
    : [];

  const navItems = [...baseNavItems, ...ownerNavItems];

  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="sticky top-0 p-6">
        {/* Pool Name */}
        <div className="mb-6">
          <Link href="/" className="mb-2 block text-sm text-gray-500 hover:text-gray-700">
            ← Back to pools
          </Link>
          <Heading level={4} className="text-lg">
            {poolName}
          </Heading>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge}
              </div>
            </Link>
          ))}
        </nav>

        {/* Draft Status Indicator */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
            Draft Status
          </p>
          <p className="text-sm font-medium text-gray-900">
            {draftStatus === DraftStatus.NOT_STARTED && 'Not Started'}
            {draftStatus === DraftStatus.IN_PROGRESS && '🔴 In Progress'}
            {draftStatus === DraftStatus.COMPLETED && '✅ Completed'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
