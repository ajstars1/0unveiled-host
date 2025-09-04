import Link from "next/link"

import { cn } from "@/lib/utils"
import { CircleHelp, Home, Package, Sparkles, User, Briefcase } from "lucide-react"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <span
      className={cn(
        "flex text-sm items-center space-x-4 lg:space-x-6",
        className,
      )}
      {...props}
    >
      <Link
        href="/"
        className="font-medium text-primary transition-colors hover:text-muted-foreground flex items-center gap-2 md:hidden"
      >
        <Home className="w-4 h-4" />
        Home
      </Link>
      <Link
        href="/features"
        className="font-medium text-primary transition-colors hover:text-muted-foreground flex items-center gap-2 "
      >
        <Sparkles className="w-4 h-4 md:hidden" />
        Features
      </Link>
      <Link
        href="/projects"
        className="font-medium text-primary transition-colors hover:text-muted-foreground flex items-center gap-2"
      >
        <Package className="w-4 h-4 md:hidden" />
        Explore Projects
      </Link>
      <Link
        href="/profiles"
        className="font-medium text-primary transition-colors hover:text-muted-foreground flex items-center gap-2"
      >
        <User className="w-4 h-4 md:hidden" />
        Explore Profiles
      </Link>
      <Link
        href="/recruitment"
        className="font-medium text-primary transition-colors hover:text-muted-foreground flex items-center gap-2"
      >
        <Briefcase className="w-4 h-4 md:hidden" />
        Recruitment
      </Link>
      {/* <Link
        href="/contact"
        className="font-medium text-primary transition-colors hover:text-muted-foreground"
      >
        Contact
      </Link> */}
    </span>
  )
}
