import { getAllProjects } from "@/data/projects"
import { Metadata } from "next"
import ProjectsClientPage from "./_components/ProjectsClientPage" // Import the client component
// import { getCurrentUser } from "@/lib/auth" // Removed - Path unknown / Not used currently


export const metadata: Metadata = {
  title: "Explore Projects",
  description:
    "Discover innovative projects, collaborate with others, and showcase your skills through real-world applications.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Explore Projects on 0Unveiled",
    description:
      "Discover innovative projects, collaborate with others, and showcase your skills through real-world applications.",
    url: "https://0unveiled.com/projects",
  },
}

// This remains a Server Component
async function Projects() {
  // Fetch initial project data server-side
  const allProjects = await getAllProjects()

  // Handle potential null/undefined case for projects
  if (!allProjects) {
    // Optionally return a message or an empty state
    return <ProjectsClientPage initialProjects={[]} />
    // Or: return <div>No projects found or error loading projects.</div>;
  }

  // Filtering logic removed for now as owner role is not directly available.
  // const visibleProjects = allProjects.filter(
  //   (project) => project.owner?.role !== Role.ADMIN
  // );
  // We are passing all fetched projects until filtering logic can be implemented correctly.
  const visibleProjects = allProjects

  // Pass filtered data to the Client Component for rendering and interactivity
  // Use visibleProjects instead of allProjects
  return <ProjectsClientPage initialProjects={visibleProjects} />
}

export default Projects
