'use client'

import { useRef, type ReactNode } from 'react'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  /** Custom loading indicator */
  loadingIndicator?: ReactNode
  /** Disable pull-to-refresh */
  disabled?: boolean
  /** Additional class names for the container */
  className?: string
}

/**
 * Pull-to-refresh container component
 * Wrap any scrollable content to add mobile pull-to-refresh functionality
 * 
 * @example
 * <PullToRefresh onRefresh={async () => await fetchPosts()}>
 *   <PostsList posts={posts} />
 * </PullToRefresh>
 */
export function PullToRefresh({
  children,
  onRefresh,
  loadingIndicator,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    isRefreshing,
    pullProgress,
    canRelease,
    containerProps,
  } = usePullToRefresh({
    onRefresh,
    disabled,
  })

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      {...containerProps}
    >
      {/* Pull indicator */}
      <div
        className={`
          absolute top-0 left-0 right-0 
          flex items-center justify-center
          transition-all duration-200 ease-out
          overflow-hidden
          pointer-events-none
        `}
        style={{
          height: isRefreshing ? '48px' : `${pullProgress * 48}px`,
          opacity: pullProgress > 0 ? 1 : 0,
        }}
      >
        {loadingIndicator || (
          <div className="flex items-center gap-2 text-gold">
            {isRefreshing ? (
              <>
                <svg 
                  className="w-5 h-5 animate-spin" 
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : (
              <>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${canRelease ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                <span className="text-sm font-medium">
                  {canRelease ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Content with transform during pull */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isRefreshing 
            ? 'translateY(48px)' 
            : `translateY(${pullProgress * 48}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh
