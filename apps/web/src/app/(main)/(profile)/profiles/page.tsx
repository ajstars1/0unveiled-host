import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getAllUsers } from "@/data/user";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

// Generate metadata for SEO
export const metadata: Metadata = {
  title: "Explore Profiles | 0unveiled - Discover Talented Developers",
  description:
    "Discover talented developers, designers, and tech professionals. Connect, collaborate, and find the perfect team members for your next project on 0unveiled.",
  keywords: [
    "developers",
    "profiles",
    "talent",
    "collaboration",
    "tech professionals",
    "coding",
    "programming",
  ],
  authors: [{ name: "0unveiled Team" }],
  creator: "0unveiled",
  publisher: "0unveiled",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://0unveiled.com"
  ),
  alternates: {
    canonical: "/profiles",
  },
  openGraph: {
    title: "Explore Profiles | 0unveiled",
    description:
      "Discover talented developers, designers, and tech professionals. Connect and collaborate on exciting projects.",
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
    description:
      "Discover talented developers, designers, and tech professionals. Connect and collaborate on exciting projects.",
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
};

// Structured data for profiles page
const PAGE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Explore Profiles",
  description:
    "Discover talented developers, designers, and tech professionals on 0unveiled",
  url: `${process.env.NEXT_PUBLIC_APP_URL || "https://0unveiled.com"}/profiles`,
  mainEntity: {
    "@type": "ItemList",
    name: "Developer Profiles",
    description: "Collection of talented developers and tech professionals",
  },
  publisher: {
    "@type": "Organization",
    name: "0unveiled",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://0unveiled.com",
  },
};

// Dynamic import for client component
const ProfilesClient = dynamic(
  () => import("@/components/profiles/profiles-client"),
  {
    loading: () => <ProfilesLoadingSkeleton />,
  }
);

const ProfilesLoadingSkeleton = () => (
  <div className="space-y-12">
    {/* Search skeleton */}
    <div className="flex justify-center">
      <div className="relative w-full max-w-lg">
        <Skeleton className="h-12 w-full rounded-full bg-muted/50" />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-muted rounded"></div>
      </div>
    </div>

    {/* Filters skeleton */}
    <div className="flex justify-center">
      <div className="hidden sm:flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-full bg-muted/50" />
        ))}
      </div>
      <div className="sm:hidden">
        <Skeleton className="h-10 w-48 rounded-full bg-muted/50" />
      </div>
    </div>

    {/* Grid skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full bg-muted" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-5 w-3/4 mx-auto bg-muted" />
              <Skeleton className="h-4 w-1/2 mx-auto bg-muted" />
              <Skeleton className="h-3 w-2/3 mx-auto bg-muted" />
            </div>
            <div className="w-full space-y-3">
              <Skeleton className="h-3 w-16 mx-auto bg-muted" />
              <div className="flex flex-wrap justify-center gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                <Skeleton className="h-6 w-20 rounded-full bg-muted" />
                <Skeleton className="h-6 w-14 rounded-full bg-muted" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default async function Profiles() {
  // Server-side data fetching for initial load and SEO
  let initialUsers = [];
  try {
    initialUsers = await getAllUsers();
  } catch (error) {
    console.error("Failed to fetch users on server:", error);
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

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-primary/5 rounded-full mb-6">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text font-bold tracking-tight text-transparent mb-4"
            itemProp="name"
          >
            Explore Profiles
          </h1>

          <p
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            itemProp="description"
          >
            Discover talented developers, designers, and tech professionals.
            Connect, collaborate, and build amazing projects together.
          </p>

          {/* Stats */}
          {/* <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Developers</div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Skills</div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
          </div> */}
        </header>

        {/* Client Component with Suspense */}
        <Suspense fallback={<ProfilesLoadingSkeleton />}>
          <ProfilesClient initialUsers={initialUsers} />
        </Suspense>
      </div>
    </div>
  );
}
