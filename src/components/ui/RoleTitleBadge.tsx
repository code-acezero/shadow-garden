import React from 'react';
import { UserTitleBadge } from './UserTitleBadge';

interface RoleTitleBadgeProps {
  role?: string;
  adminTitle?: string;
  variant?: 'bracket' | 'badge' | 'text';
  className?: string;
  [key: string]: any;
}

export function RoleTitleBadge({ role, adminTitle, variant = 'bracket', className = '' }: RoleTitleBadgeProps) {
  return (
    <UserTitleBadge
      user={{ role, admin_title: adminTitle }}
      variant={variant}
      className={className}
    />
  );
}
