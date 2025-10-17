'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  Package, 
  ShoppingCart, 
  Users, 
  Menu,
  Search,
  Plus,
  Bell
} from 'lucide-react';

// Bottom navigation items for quick access
const bottomNavItems = [
  { name: 'Home', icon: Home, path: '/', color: 'text-blue-600' },
  { name: 'Search', icon: Search, path: '/search', color: 'text-gray-600' },
  { name: 'Create', icon: Plus, path: '/create', color: 'text-green-600' },
  { name: 'Notifications', icon: Bell, path: '/notifications', color: 'text-orange-600' },
  { name: 'Menu', icon: Menu, path: '/menu', color: 'text-gray-600' },
];

interface MobileNavigationProps {
  className?: string;
}

/**
 * Mobile-specific navigation component with:
 * - Bottom navigation bar for quick access
 * - Swipe gesture support
 * - Pull-to-refresh functionality
 * - Touch-optimized interactions
 */
export function MobileNavigation({ className }: MobileNavigationProps) {
  const { currentModule, setCurrentModule, isMobile } = useLayout();
  const [activeTab, setActiveTab] = React.useState('Home');

  // Only render on mobile devices
  if (!isMobile) return null;

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName !== 'Menu' && tabName !== 'Search' && tabName !== 'Create' && tabName !== 'Notifications') {
      setCurrentModule(tabName);
    }
    // TODO: Handle navigation for special tabs (Search, Create, Notifications, Menu)
  };

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe-bottom', className)}>
      <nav className="flex items-center justify-around px-2 py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          
          return (
            <button
              key={item.name}
              onClick={() => handleTabClick(item.name)}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors duration-150',
                'min-w-[60px] min-h-touch-sm',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', isActive ? 'text-primary-600' : item.color)} />
              <span className={cn('text-xs font-medium', isActive ? 'text-primary-600' : 'text-gray-500')}>
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Swipe gesture handler for mobile navigation
 */
interface SwipeGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export function SwipeGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
}: SwipeGestureHandlerProps) {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Determine primary swipe direction
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      // Vertical swipe
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

/**
 * Pull-to-refresh component for mobile
 */
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [startY, setStartY] = React.useState(0);

  const refreshThreshold = 80;
  const maxPullDistance = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    // Only allow pull down when at the top of the page
    if (window.scrollY === 0 && distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, maxPullDistance));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1);

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary-50 transition-all duration-200"
          style={{ height: `${pullDistance}px` }}
        >
          <div className="flex items-center space-x-2 text-primary-600">
            <div
              className={cn(
                'w-6 h-6 border-2 border-primary-600 rounded-full transition-transform duration-200',
                isRefreshing && 'animate-spin',
                pullProgress >= 1 && 'rotate-180'
              )}
              style={{
                borderTopColor: pullProgress >= 1 ? 'transparent' : 'currentColor',
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
}

export default MobileNavigation;