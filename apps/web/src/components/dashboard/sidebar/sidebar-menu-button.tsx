"use client"

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface SidebarMenuButtonProps extends Omit<React.ComponentProps<typeof Button>, 'asChild'> {
  href?: string
  label: string
  icon?: React.ElementType
  customIcon?: React.ReactNode
  isActive?: boolean
  isExpanded: boolean
  onClick?: () => void
  badgeCount?: number
  isLoadingBadge?: boolean
}

export function SidebarMenuButton({
  href,
  label,
  icon: Icon,
  customIcon,
  isActive,
  isExpanded,
  onClick,
  badgeCount,
  isLoadingBadge,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const content = (
    <div className="flex items-center">
      {customIcon ? (
        <div className={cn("h-6 w-6 shrink-0", isExpanded ? "mr-2" : "mx-auto")}>
          {customIcon}
        </div>
      ) : Icon ? (
        <Icon className={cn("h-4 w-4 shrink-0", isExpanded ? "mr-2" : "mx-auto")} />
      ) : null}

      {isExpanded && <span className="truncate flex-1">{label}</span>}

      {isExpanded && badgeCount !== undefined && badgeCount > 0 && (
        <Badge
          variant="destructive"
          className="ml-auto h-5 px-1.5 flex items-center justify-center text-[10px] rounded-full"
        >
          {isLoadingBadge ? <Loader2 className="h-3 w-3 animate-spin" /> : badgeCount}
        </Badge>
      )}
    </div>
  )

  const buttonClasses = cn(
    "flex h-10 items-center justify-start text-sm font-medium transition-colors",
    isExpanded ? "w-full px-2" : "w-10 justify-center",
    isActive ? "bg-muted" : "hover:bg-muted",
    className
  )

  const buttonElement = (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size={isExpanded ? "default" : "icon"}
      className={buttonClasses}
      onClick={onClick}
      aria-label={!isExpanded ? label : undefined}
      {...props}
    >
      {content}
    </Button>
  )

  const linkButton = href ? (
    <Link href={href} passHref legacyBehavior={undefined}> 
      <Button
        asChild
        variant={isActive ? "secondary" : "ghost"}
        size={isExpanded ? "default" : "icon"}
        className={buttonClasses}
        aria-label={!isExpanded ? label : undefined}
        {...props}
      >
        {content}
      </Button>
    </Link>
  ) : null;

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkButton || buttonElement}
        </TooltipTrigger>
        <TooltipContent className="" side="right" sideOffset={10}>
          {label}
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="ml-1.5 inline-block rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-semibold leading-none text-destructive-foreground">
               {isLoadingBadge ? '...' : badgeCount}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkButton || buttonElement;
} 