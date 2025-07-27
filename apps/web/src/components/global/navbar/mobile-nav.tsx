import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { HamburgerMenuIcon } from "@radix-ui/react-icons"
import Image from "next/image"
import { MainNav } from "./main-nav"
import { Separator } from "@/components/ui/separator"

const MobileNav = ({ className }: React.HTMLAttributes<HTMLElement>) => {
  return (
    <div className={className}>
      <Sheet>
        <SheetTrigger className="rounded-full shadow-xs p-2">
          <HamburgerMenuIcon className="w-6 h-6" />
        </SheetTrigger>
        <SheetContent side={"left"}>
          <SheetHeader>
            <Image src="/logo/0unveiled_logo_light.svg" alt="0Unveiled Logo" width={100} height={30} className="invert dark:invert-0 min-w-24 " />
            <Separator className="my-4" />
            <SheetDescription>
              <MainNav className="flex-col items-start  text-lg gap-6 space-x-0! mt-10" />
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MobileNav
