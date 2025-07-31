// import { currentUser } from "@/lib/auth";
import { MainNav } from "./main-nav"
import MobileNav from "./mobile-nav"
import { UserNav } from "./user-nav"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@0unveiled/lib/supabase"
import { getUnreadNotificationCount, getRecentNotifications } from '@/actions/notifications'
import type { Notification } from '@0unveiled/database/schema'
import { NotificationBell } from './notification-bell'

import Link from "next/link"
import Image from "next/image"
import { LogIn } from "lucide-react"


const Navbar = async () => {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const sessionUser =  user

  // Fetch initial notification data IF user exists
  let initialCount = 0;
  let initialNotifications: Notification[] = []; // Use correct type
  if (sessionUser) {
    // Use Promise.all for parallel fetching
    try {
      const [count, notifications] = await Promise.all([
        getUnreadNotificationCount(),
        getRecentNotifications(5) // Fetch 5 for the dropdown preview
      ]);
      initialCount = count;
      initialNotifications = notifications || []; // Ensure it's an array
    } catch (error) {
        console.error("Error fetching initial notifications for navbar:", error);
    }
  }

  return (
    <nav>
      <div className="border-b">
        <div className="flex h-16 justify-between items-center px-4">
            <MobileNav className="lg:hidden flex" />
            <Link href={"/"}>
              <Image src="/logo/0unveiled_logo_light.svg" alt="0Unveiled Logo" width={160} height={30} className="invert dark:invert-0 min-w-24 "/>
            </Link>
          <div className="flex w-full items-center justify-center">
            <MainNav className="mx-6 items-center justify-center hidden lg:flex" />
          </div>
          <div className="flex items-center space-x-4">
            {sessionUser !== null ? (
              <>
                <NotificationBell 
                    userId={sessionUser.id} 
                    initialCount={initialCount} 
                    initialNotifications={initialNotifications} 
                 />
                <UserNav user={sessionUser} />
              </>
            ) : (
              <>
                <Link
                  href={"/login"}
                  className="font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    <Button
                      size="default"
                    variant={"link"}
                    className=" hover:no-underline p-0 text-xs md:px-6   md:border md:border-input   md:text-black md:bg-white md:shadow-xs md:hover:bg-accent md:hover:text-accent-foreground gap-1 "
                  >
                    {/* <LogIn className="w-4 h-4" /> */}
                    Login
                  </Button>
                </Link>
                <Link
                  href={"/register"}
                  className="font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    <Button
                      size="default"
                    variant={"default"}
                    className="inline-flex h-full animate-shimmer items-center justify-center rounded-md border md:bg-white border-slate-800 md:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-size-[200%_100%] font-medium text-gray-800 md:text-slate-300 hover:text-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-xs px-2 md:px-6 md:text-sm ml-0 md:ml-2"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar