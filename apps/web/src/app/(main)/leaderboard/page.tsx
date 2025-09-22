import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import TrustGalaxy from '@/components/landingv3/TrustGalaxy';
import Footer from '@/components/landingv3/Footer';
import { LeaderboardSkeleton } from '@/components/profile/profile-loading';

// Dynamic imports for better performance
const LeaderboardClient = dynamic(
  () => import('@/components/leaderboard/leaderboard-client').then(mod => mod.LeaderboardClient),
  {
    loading: () => <LeaderboardSkeleton />
  }
);

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'Developer Leaderboard | Top Developers & Portfolio Rankings | 0unveiled',
  description: 'Discover top developers ranked by portfolio scores, achievements, and technical expertise. Explore leaderboards by tech stack, domain, and overall performance.',
  keywords: [
    'developer leaderboard',
    'top developers',
    'portfolio rankings',
    'developer scores',
    'tech stack rankings',
    'programming achievements',
    'developer community',
    'coding leaderboard'
  ],
  authors: [{ name: '0unveiled Team' }],
  creator: '0unveiled',
  publisher: '0unveiled',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://0unveiled.com'),
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'Developer Leaderboard | Top Developers & Portfolio Rankings',
    description: 'Discover top developers ranked by portfolio scores, achievements, and technical expertise. Explore leaderboards by tech stack, domain, and overall performance.',
    url: '/leaderboard',
    siteName: '0unveiled',
    images: [
      {
        url: '/og-leaderboard.jpg',
        width: 1200,
        height: 630,
        alt: 'Developer Leaderboard - Top Developers Rankings',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Leaderboard | Top Developers & Portfolio Rankings',
    description: 'Discover top developers ranked by portfolio scores, achievements, and technical expertise.',
    images: ['/og-leaderboard.jpg'],
    creator: '@0unveiled',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
  category: 'technology',
};

// Structured data for the page
const PAGE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Developer Leaderboard",
  "description": "Top developers ranked by portfolio scores and achievements",
  "url": "https://0unveiled.com/leaderboard",
  "isPartOf": {
    "@type": "WebSite",
    "name": "0unveiled",
    "url": "https://0unveiled.com"
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "Developer Rankings",
    "description": "Comprehensive rankings of developers by various metrics"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://0unveiled.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Leaderboard",
        "item": "https://0unveiled.com/leaderboard"
      }
    ]
  }
};

export default function LeaderboardPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PAGE_STRUCTURED_DATA)
        }}
      />

      <main
        className="min-h-screen bg-white"
        itemScope
        itemType="https://schema.org/WebPage"
      >
        <section
          className="py-16 lg:py-24"
          itemProp="mainContentOfPage"
          itemScope
          itemType="https://schema.org/WebPageElement"
        >
          <LeaderboardClient />
        </section>

        {/* Trust indicators and footer */}
        <TrustGalaxy />
        <Footer />
      </main>
    </>
  );
}
