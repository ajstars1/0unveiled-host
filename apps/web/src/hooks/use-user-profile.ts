import { useQuery } from "@tanstack/react-query"

// Mock API function to fetch user data
const fetchUserData = async (): Promise<any> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "user123",
        username: "techpro",
        email: "user@example.com",
        fullName: "Alex Johnson",
        headline: "Senior Software Engineer | Cloud Architect",
        location: "San Francisco, CA",
        college: "Stanford University",
        profilePictureUrl: "/placeholder.svg?height=150&width=150",
        bio: "Passionate software engineer with 8+ years of experience building scalable web applications.",
        websiteUrl: "https://example.com",
        joinDate: "2022-01-15",
        githubAccountId: null, // Initially not connected
      })
    }, 500)
  })
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserData,
  })
}
