"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { getUserBySupabaseId } from "@/data/user";
interface UserNavProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  // const supabase = createClientComponentClient()
  const supabase = createClient()
  const [dbUser, setDbUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserBySupabaseId(user.id)
        setDbUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage className="h-8 w-8" src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || ''} />
            <AvatarFallback className="h-8 w-8">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal" inset>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="" />
        <DropdownMenuGroup>
          <Link href={dbUser?.username ? `/${dbUser.username}` : "/profile"}>
            <DropdownMenuItem className="" inset>
              My Profile
              <DropdownMenuShortcut className="">⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/profile/edit">
            <DropdownMenuItem className="" inset>
              Edit Profile
              <DropdownMenuShortcut className="">⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/chat">
            <DropdownMenuItem className="" inset>
              Chats
              <DropdownMenuShortcut className="">⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/notifications">
            <DropdownMenuItem className="" inset>
              Notifications
              <DropdownMenuShortcut className="">⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          {/* <Link href="/settings">
            <DropdownMenuItem className="" inset>
              Settings
              <DropdownMenuShortcut className="">⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="" />
        <DropdownMenuItem className="" inset onClick={handleSignOut}>
          Log out
          <DropdownMenuShortcut className="">⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
