import { getAllReviewedProjects } from "@/data/projects"
import { getAllUsers } from "@/data/user"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://0unveiled.com"

  // Static routes
  const staticRoutes = [
    "",
    "/features",
    "/projects",
    "/profiles",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  }))

  // Fetch dynamic project routes
  let projectRoutes: MetadataRoute.Sitemap = []
  try {
    const projects = await getAllReviewedProjects()
    projectRoutes =
      projects?.map((project: any) => ({
        url: `${baseUrl}/project/${project.id}`,
        lastModified: new Date(project.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })) || []
  } catch (error) {
    console.error("Error fetching projects for sitemap:", error)
    // Optionally handle the error, e.g., return only static routes
  }

  // Fetch dynamic profile routes
  let profileRoutes: MetadataRoute.Sitemap = []
  try {
    const profiles = await getAllUsers()
    profileRoutes =
      profiles?.map((profile: any) => ({
        url: `${baseUrl}/${profile.username}`,
        lastModified: new Date(profile.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })) || []
  } catch (error) {
    console.error("Error fetching profiles for sitemap:", error)
    // Optionally handle the error
  }

  return [...staticRoutes, ...projectRoutes, ...profileRoutes]
}
