import type { Metadata, Viewport } from "next"
import { Inter, Poppins } from "next/font/google"
// import "@/styles/globals.css"
import "./globals.css"
// import { ReduxProvider } from "@/redux/provider"
import { ReactQueryProvider } from "@/react-query/provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { AuthProvider } from "@/providers/auth-provider"
// import { ThemeProvider } from "@/components/theme"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://0unveiled.com"),
  title: {
    default: "0Unveiled - Showcase Your Skills, Build Your Future",
    template: "%s | 0Unveiled",
  },
  description:
    "0Unveiled is your platform to demonstrate real-world skills, collaborate on innovative projects, and connect with opportunities that matter.",
  keywords: [
    "skills showcase",
    "project collaboration",
    "portfolio",
    "learning platform",
    "developer community",
    "real-world skills",
    "collaboration",
    "career opportunities",
    "skill development",
    "project management",
    "team collaboration",
    "innovative projects",
    "career advancement",
    "professional growth",
    "networking",
    "job opportunities",
    "skill validation",
    "real-world projects",
    "professional development",
    "career transition",
    "skill verification",
    "career advancement",
    "professional growth",
    
  ],
  authors: [{ name: "0Unveiled Team" }],
  creator: "0Unveiled",
  publisher: "0Unveiled",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "0Unveiled - Showcase Your Skills, Build Your Future",
    description:
      "0Unveiled is your platform to demonstrate real-world skills, collaborate on innovative projects, and connect with opportunities that matter.",
    url: "https://0unveiled.com",
    siteName: "0Unveiled",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "0Unveiled Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "0Unveiled - Showcase Your Skills, Build Your Future",
    description:
      "0Unveiled is your platform to demonstrate real-world skills, collaborate on innovative projects, and connect with opportunities that matter.",
    creator: "@0unveiled",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  appleWebApp: {
    title: "0Unveiled",
  },
  verification: {
    google: "your-google-site-verification",
    yandex: "your-yandex-verification",
    other: {
      "msvalidate.01": "your-bing-verification",
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${poppins.className} antialiased`} suppressHydrationWarning>
     {/* <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    > */}
        {/* <ReduxProvider> */}
          <ReactQueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ReactQueryProvider>
        {/* </ReduxProvider> */}
        <Analytics />
        <GoogleAnalytics gaId="G-SDFGMZ0PBE" />
    {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
