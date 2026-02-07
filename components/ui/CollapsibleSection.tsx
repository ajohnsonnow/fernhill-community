'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  className?: string;
}

/**
 * Mobile-first collapsible section for organizing filters, options, and long lists.
 * Stays compact on mobile, expanded on larger screens.
 */
export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  className = ''
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl bg-fernhill-brown/30 hover:bg-fernhill-brown/50 active:bg-fernhill-brown transition-colors"
        {...{ 'aria-expanded': isOpen ? 'true' : 'false' }}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-fernhill-gold">{icon}</span>}
          <span className="text-fernhill-cream font-medium">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-fernhill-gold/20 text-fernhill-gold">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-fernhill-sand/60" />
        ) : (
          <ChevronDown className="w-5 h-5 text-fernhill-sand/60" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-2 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Wrapping chip/tag grid that works well on all screen sizes.
 * Items wrap naturally instead of requiring horizontal scrolling.
 */
interface ChipGridProps {
  children: ReactNode;
  className?: string;
}

export function ChipGrid({ children, className = '' }: ChipGridProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Individual chip/tag button with proper touch targets and Fernhill styling.
 */
interface ChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({ label, emoji, selected = false, onClick, size = 'md' }: ChipProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1.5 text-xs min-h-[36px]'
    : 'px-3 py-2 text-sm min-h-[44px]';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-full font-medium transition-all active:scale-95 ${
        selected
          ? 'bg-fernhill-gold text-fernhill-dark shadow-lg'
          : 'bg-fernhill-brown/50 text-fernhill-sand hover:bg-fernhill-brown'
      }`}
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {label}
    </button>
  );
}

export default CollapsibleSection;
