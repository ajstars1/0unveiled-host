import type React from "react"
interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  return (
    <div className="flex-1 space-y-4 md:space-y-6" {...props}>
      {children}
    </div>
  )
}
