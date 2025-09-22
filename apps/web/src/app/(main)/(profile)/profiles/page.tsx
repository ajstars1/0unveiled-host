import { Suspense } from "react"
import dynamic from "next/dynamic"
import { getAllUsers } from "@/data/user"
import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"

// Generate metadata for SEO
export const metadata: Metadata = {
  title: "Explore Profiles | 0unveiled - Discover Talented Developers",
  description: "Discover talented developers, designers, and tech professionals. Connect, collaborate, and find the perfect team members for your next project on 0unveiled.",
  keywords: ["developers", "profiles", "talent", "collaboration", "tech professionals", "coding", "programming"],
  authors: [{ name: "0unveiled Team" }],
  creator: "0unveiled",
  publisher: "0unveiled",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://0unveiled.com"),
  alternates: {
    canonical: "/profiles",
  },
  openGraph: {
    title: "Explore Profiles | 0unveiled",
    description: "Discover talented developers, designers, and tech professionals. Connect and collaborate on exciting projects.",
    url: "/profiles",
    siteName: "0unveiled",
    images: [
      {
        url: "/og-profiles.jpg",
        width: 1200,
        height: 630,
        alt: "0unveiled Profiles - Discover Talented Developers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Profiles | 0unveiled",
    description: "Discover talented developers, designers, and tech professionals. Connect and collaborate on exciting projects.",
    images: ["/og-profiles.jpg"],
    creator: "@0unveiled",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

// Structured data for profiles page
const PAGE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Explore Profiles",
  "description": "Discover talented developers, designers, and tech professionals on 0unveiled",
  "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://0unveiled.com"}/profiles`,
  "mainEntity": {
    "@type": "ItemList",
    "name": "Developer Profiles",
    "description": "Collection of talented developers and tech professionals",
  },
  "publisher": {
    "@type": "Organization",
    "name": "0unveiled",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://0unveiled.com",
  },
}

// Dynamic import for client component
const ProfilesClient = dynamic(() => import("@/components/profiles/profiles-client"), {
  loading: () => <ProfilesLoadingSkeleton />,
})

const ProfilesLoadingSkeleton = () => (
  <div className="space-y-8">
    {/* Search skeleton */}
    <div className="flex justify-center">
      <Skeleton className="h-11 w-96 rounded-full bg-muted/50" />
    </div>

    {/* Filters skeleton */}
    <div className="flex justify-center">
      <div className="hidden sm:flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full bg-muted/50" />
        ))}
      </div>
    </div>

    {/* Grid skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
          <div className="flex flex-row items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
              <Skeleton className="h-3 w-1/4 bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-12 bg-muted" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full bg-muted" />
              <Skeleton className="h-5 w-20 rounded-full bg-muted" />
              <Skeleton className="h-5 w-14 rounded-full bg-muted" />
            </div>
          </div>
          <div className="mt-4">
            <Skeleton className="h-9 w-full rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default async function Profiles() {
  // Server-side data fetching for initial load and SEO
  let initialUsers = []
  try {
    initialUsers = await getAllUsers()
  } catch (error) {
    console.error("Failed to fetch users on server:", error)
    // Continue with empty array - client will handle refetching
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PAGE_STRUCTURED_DATA),
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text md:text-4xl font-bold tracking-tight text-transparent"
            itemProp="name"
          >
            Explore Profiles
          </h1>
          <p
            className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto"
            itemProp="description"
          >
            Discover talented individuals, connect, and collaborate on exciting
            projects.
          </p>
        </header>

        {/* Client Component with Suspense */}
        <Suspense fallback={<ProfilesLoadingSkeleton />}>
          <ProfilesClient initialUsers={initialUsers} />
        </Suspense>
      </div>
    </div>
  )
}
