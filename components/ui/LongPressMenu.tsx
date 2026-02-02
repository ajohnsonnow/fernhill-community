'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLongPress } from '@/hooks/useLongPress'
import { haptic } from '@/lib/haptics'

interface MenuItem {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Icon (optional) */
  icon?: ReactNode
  /** Destructive action (red color) */
  destructive?: boolean
  /** Disabled state */
  disabled?: boolean
}

interface LongPressMenuProps {
  children: ReactNode
  /** Menu items to display */
  items: MenuItem[]
  /** Callback when item is selected */
  onSelect: (itemId: string) => void
  /** Long press duration (default: 500ms) */
  duration?: number
  /** Optional click handler (short press) */
  onClick?: () => void
  /** Disable the menu */
  disabled?: boolean
  /** Additional class names for wrapper */
  className?: string
}

/**
 * Long Press Context Menu Component
 * 
 * Wraps content and shows a context menu on long press.
 * Position-aware (won't overflow viewport).
 * 
 * @example
 * <LongPressMenu
 *   items={[
 *     { id: 'edit', label: 'Edit', icon: <Edit2 /> },
 *     { id: 'delete', label: 'Delete', icon: <Trash2 />, destructive: true },
 *   ]}
 *   onSelect={(id) => {
 *     if (id === 'edit') handleEdit()
 *     if (id === 'delete') handleDelete()
 *   }}
 *   onClick={() => openPost()}
 * >
 *   <PostCard post={post} />
 * </LongPressMenu>
 */
export function LongPressMenu({
  children,
  items,
  onSelect,
  duration = 500,
  onClick,
  disabled = false,
  className = '',
}: LongPressMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const lastTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleLongPress = () => {
    if (disabled || items.length === 0) return
    
    // Use last touch position
    const { x, y } = lastTouchRef.current
    
    // Calculate menu position (ensure it doesn't overflow)
    const menuWidth = 200
    const menuHeight = items.length * 48 + 16 // Approximate
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let posX = x
    let posY = y
    
    // Adjust horizontal position
    if (x + menuWidth > viewportWidth - 16) {
      posX = viewportWidth - menuWidth - 16
    }
    if (x < 16) {
      posX = 16
    }
    
    // Adjust vertical position
    if (y + menuHeight > viewportHeight - 16) {
      posY = y - menuHeight
    }
    if (posY < 16) {
      posY = 16
    }
    
    setPosition({ x: posX, y: posY })
    setIsOpen(true)
  }

  const { isPressed, progress, handlers } = useLongPress({
    onLongPress: handleLongPress,
    onClick,
    duration,
    disabled,
  })

  // Track touch position
  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
    handlers.onTouchStart(e)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    lastTouchRef.current = { x: e.clientX, y: e.clientY }
    handlers.onMouseDown(e)
  }

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    // Small delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 100)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (itemId: string) => {
    haptic('selection')
    setIsOpen(false)
    onSelect(itemId)
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={`relative ${className}`}
        {...handlers}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
      >
        {/* Progress indicator during long press */}
        {isPressed && progress > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            aria-hidden="true"
          >
            <div 
              className="absolute inset-0 bg-fernhill-gold/10 rounded-lg"
              style={{ 
                opacity: progress,
                transform: `scale(${1 + progress * 0.02})`,
              }}
            />
            {/* Circular progress indicator */}
            <svg 
              className="absolute top-2 right-2 w-5 h-5 -rotate-90"
              viewBox="0 0 20 20"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-fernhill-sand/20"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={50.27}
                strokeDashoffset={50.27 * (1 - progress)}
                className="text-fernhill-gold transition-all"
              />
            </svg>
          </div>
        )}
        
        {children}
      </div>

      {/* Context Menu Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[60] bg-black/50 animate-fade-in"
            aria-hidden="true"
          />
          
          {/* Menu */}
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[61] min-w-[200px] py-2 bg-fernhill-charcoal border border-fernhill-sand/20 rounded-xl shadow-2xl animate-scale-in"
            style={{ 
              left: position.x, 
              top: position.y,
              transformOrigin: 'top left',
            }}
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleSelect(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium
                  transition-colors touch-manipulation
                  ${item.disabled 
                    ? 'text-fernhill-sand/30 cursor-not-allowed' 
                    : item.destructive
                      ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
                      : 'text-fernhill-cream hover:bg-fernhill-sand/10 active:bg-fernhill-sand/20'
                  }
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === items.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                {item.icon && (
                  <span className="w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}

export default LongPressMenu
