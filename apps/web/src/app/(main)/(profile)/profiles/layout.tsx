import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Community Profiles",
  description:
    "Connect with talented developers, designers, and creators. Build your network and find collaboration opportunities.",
  alternates: {
    canonical: "/profiles",
  },
  openGraph: {
    title: "Community Profiles on 0Unveiled",
    description:
      "Connect with talented developers, designers, and creators. Build your network and find collaboration opportunities.",
    url: "https://0unveiled.com/profiles",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div>{children}</div>
}
