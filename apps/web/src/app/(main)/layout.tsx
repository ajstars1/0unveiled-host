import { Suspense } from "react"
import { Header } from "@/components/landingv2/Header"
import { OptimizedFloatingNav } from "@/components/landingv2/OptimizedFloatingNav"
import { GlobalPresenceProvider } from "@/context/global-presence-context"
import { fetchLayoutData } from "@/lib/layout-cache"

type Props = {
  children: React.ReactNode
}

/**
 * Unified layout that handles both authenticated and public states
 * Components internally handle conditional rendering based on user data
 */
const MainLayout = async ({ children }: Props) => {
  const layoutData = await fetchLayoutData()
  
  // Shared layout content
  const layoutContent = (
    <>
      {/* Header handles authenticated vs public state internally */}
      <Header 
        user={layoutData.sessionUser}
        initialNotificationCount={layoutData.notifications?.length || 0}
        initialRecentNotifications={layoutData.notifications || []}
      />

      {/* FloatingNav handles authenticated vs public state internally */}
      <OptimizedFloatingNav 
        userId={layoutData.user?.id || ""}
        initialUser={layoutData.user}
        initialNotificationCount={layoutData.notifications?.length || 0}
        initialRecentNotifications={layoutData.notifications || []}
      />

      {/* Main content */}
      <main className="relative">
        {children}
      </main>
    </>
  )
  
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LayoutSkeleton />}>
        {/* Wrap with presence provider only for authenticated users */}
        {layoutData.isAuthenticated ? (
          <GlobalPresenceProvider userId={layoutData.user?.id}>
            {layoutContent}
          </GlobalPresenceProvider>
        ) : (
          layoutContent
        )}
      </Suspense>
    </div>
  )
}

const LayoutSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-16 bg-muted border-b" />
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 rounded-full bg-muted" />
  </div>
)

export default MainLayout
