import { getAllReviewedProjects } from "@/data/projects"
import { getAllUsers } from "@/data/user"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://0unveiled.com"

  // Static routes with SEO priorities
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    // {
    //   url: `${baseUrl}/features`,
    //   lastModified: new Date(),
    //   changeFrequency: "weekly",
    //   priority: 0.9,
    // },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profiles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ]

  // Fetch dynamic profile routes
  let profileRoutes: MetadataRoute.Sitemap = []
  try {
    const profiles = await getAllUsers()
    profileRoutes = profiles?.map((profile: any) => ({
      url: `${baseUrl}/${profile.username}`,
      lastModified: new Date(profile.updatedAt || profile.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })) || []
  } catch (error) {
    console.error("Error fetching profiles for sitemap:", error)
  }

  // Combine all routes
  const allRoutes = [...staticRoutes, ...profileRoutes]

  // Sort by priority (highest first) for better SEO
  return allRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0))
}
