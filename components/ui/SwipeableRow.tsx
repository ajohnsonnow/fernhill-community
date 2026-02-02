'use client'

import { ReactNode, useState } from 'react'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { Trash2, Archive, Flag, MoreHorizontal } from 'lucide-react'

interface SwipeAction {
  /** Action identifier */
  id: string
  /** Icon to display */
  icon: ReactNode
  /** Background color */
  color: string
  /** Label (for accessibility) */
  label: string
}

interface SwipeableRowProps {
  children: ReactNode
  /** Actions for left swipe (revealed on right side) */
  leftActions?: SwipeAction[]
  /** Actions for right swipe (revealed on left side) */
  rightActions?: SwipeAction[]
  /** Callback when an action is triggered */
  onAction: (actionId: string) => void
  /** Threshold to trigger action (default: 80) */
  threshold?: number
  /** Disable swipe */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Swipeable Row Component
 * 
 * A row that can be swiped left or right to reveal action buttons.
 * Common pattern for lists with delete/archive actions.
 * 
 * @example
 * <SwipeableRow
 *   leftActions={[
 *     { id: 'delete', icon: <Trash2 />, color: 'bg-red-500', label: 'Delete' }
 *   ]}
 *   rightActions={[
 *     { id: 'archive', icon: <Archive />, color: 'bg-blue-500', label: 'Archive' }
 *   ]}
 *   onAction={(id) => {
 *     if (id === 'delete') deleteItem()
 *     if (id === 'archive') archiveItem()
 *   }}
 * >
 *   <MessagePreview message={message} />
 * </SwipeableRow>
 */
export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  onAction,
  threshold = 80,
  disabled = false,
  className = '',
}: SwipeableRowProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleSwipeLeft = () => {
    if (leftActions.length > 0) {
      setIsRemoving(true)
      setTimeout(() => {
        onAction(leftActions[0].id)
      }, 200)
    }
  }

  const handleSwipeRight = () => {
    if (rightActions.length > 0) {
      setIsRemoving(true)
      setTimeout(() => {
        onAction(rightActions[0].id)
      }, 200)
    }
  }

  const { handlers, distance, direction, progress, isSwiping } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold,
    maxDistance: 120,
    disableLeft: leftActions.length === 0,
    disableRight: rightActions.length === 0,
    disabled,
  })

  const showLeftAction = direction === 'left' && leftActions.length > 0
  const showRightAction = direction === 'right' && rightActions.length > 0

  return (
    <div 
      className={`relative overflow-hidden ${className} ${isRemoving ? 'animate-slide-out' : ''}`}
    >
      {/* Left action (revealed on right swipe) */}
      {rightActions.length > 0 && (
        <div 
          className={`absolute inset-y-0 left-0 flex items-center ${rightActions[0].color}`}
          style={{ 
            width: Math.abs(distance),
            opacity: showRightAction ? 1 : 0,
          }}
        >
          <div 
            className={`flex items-center justify-center w-16 h-full transition-transform ${
              progress >= 1 ? 'scale-110' : 'scale-100'
            }`}
          >
            <span className="text-white">
              {rightActions[0].icon}
            </span>
          </div>
        </div>
      )}

      {/* Right action (revealed on left swipe) */}
      {leftActions.length > 0 && (
        <div 
          className={`absolute inset-y-0 right-0 flex items-center justify-end ${leftActions[0].color}`}
          style={{ 
            width: Math.abs(distance),
            opacity: showLeftAction ? 1 : 0,
          }}
        >
          <div 
            className={`flex items-center justify-center w-16 h-full transition-transform ${
              progress >= 1 ? 'scale-110' : 'scale-100'
            }`}
          >
            <span className="text-white">
              {leftActions[0].icon}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        {...handlers}
        className={`relative bg-fernhill-charcoal transition-transform ${
          isSwiping ? '' : 'duration-200'
        }`}
        style={{ 
          transform: `translateX(${distance}px)`,
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Pre-configured delete action
 */
export const deleteAction: SwipeAction = {
  id: 'delete',
  icon: <Trash2 className="w-6 h-6" />,
  color: 'bg-red-500',
  label: 'Delete',
}

/**
 * Pre-configured archive action
 */
export const archiveAction: SwipeAction = {
  id: 'archive',
  icon: <Archive className="w-6 h-6" />,
  color: 'bg-blue-500',
  label: 'Archive',
}

/**
 * Pre-configured flag/report action
 */
export const flagAction: SwipeAction = {
  id: 'flag',
  icon: <Flag className="w-6 h-6" />,
  color: 'bg-orange-500',
  label: 'Flag',
}

/**
 * Pre-configured more options action
 */
export const moreAction: SwipeAction = {
  id: 'more',
  icon: <MoreHorizontal className="w-6 h-6" />,
  color: 'bg-gray-500',
  label: 'More',
}

export default SwipeableRow
