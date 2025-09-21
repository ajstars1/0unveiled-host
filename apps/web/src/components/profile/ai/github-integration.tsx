"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import { Github, ExternalLink, Plus, Check, RefreshCw, Loader2, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Import the server actions
import {
  fetchUserGithubRepos,
  importUserGithubRepos,
  disconnectUserGithub,
  getGithubAppInstallationUrl,
} from "@/actions/github";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link"

// Type definitions - Keep GithubRepo as the frontend expects this structure
interface GithubRepo {
  id: string
  name: string
  description: string | null // Allow null descriptions
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null // Allow null language
  topics: string[]
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
  isImported?: boolean
}

// Type for GitHub OAuth response
interface GithubOAuthResponse {
  error?: string;
  redirectUrl?: string;
}

interface GithubIntegrationProps {
  userId: string
  isGithubAppInstalled: boolean; // Use this prop to check connection status
}

export default function GithubIntegration({ userId, isGithubAppInstalled }: GithubIntegrationProps) {
  const queryClient = useQueryClient()
  const [showRepoSelector, setShowRepoSelector] = useState(false)
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [isConnecting, setIsConnecting] = useState(false)

  // Fetch GitHub repos query
  const { data: repos = [], isLoading: isLoadingRepos, refetch: refetchRepos, isError: isErrorRepos, error: reposError } = useQuery({
    queryKey: ["githubRepos", userId],
    queryFn: async () => {
        const result = await fetchUserGithubRepos();
        if (result.error) {
            console.error("Failed to fetch GitHub repos:", result.error)
            // Avoid toast here if it's due to token expiry, let user try refresh/reconnect
            if (!result.error.includes("token invalid or expired")) {
                toast({
                    title: "Error Fetching Repos",
                    description: result.error,
                    variant: "destructive"
                });
            }
            throw new Error(result.error); // Throw error to mark query as failed
        }
        return result.data || []; // Return empty array if data is null/undefined
    },
    enabled: isGithubAppInstalled, // Enable query based on app installation
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });

  // Check if the component is being rendered after a GitHub connection redirection
  useEffect(() => {
    // If we have a URL with a github_setup query parameter, it means we were redirected back after GitHub auth
    const queryParams = new URLSearchParams(window.location.search);
    const githubSetup = queryParams.get('github_setup');
    const githubInstallParam = queryParams.get('github_install');
    
    if (githubSetup === 'complete' && !isGithubAppInstalled) {
      
      // Refetch user data and GitHub repos after a short delay to allow backend to update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        
        if (userId) {
          refetchRepos();
        }
        
        toast({
          title: "Refreshing data...",
          description: "Updating your profile with GitHub account information",
        });
      }, 1000);
    }

    // Trigger refetch if redirected after install AND connection isn't reflected yet
    if (githubInstallParam === 'complete' && !isGithubAppInstalled) { 
      
      // Refetch user data first
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        
        if (userId) {
          refetchRepos();
        }
        
        toast({
          title: "Refreshing data...",
          description: "Updating your profile with GitHub account information",
        });
      }, 1000);
    }
  }, [isGithubAppInstalled, queryClient, refetchRepos, userId]);

  // Improved connect mutation with better loading state handling
  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      // Call the new action to get the installation URL
      return await getGithubAppInstallationUrl(); 
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }
      
      // Redirect to GitHub App Installation page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get GitHub App installation link.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  // Disconnect GitHub mutation - Use disconnectUserGithub
  const disconnectMutation = useMutation({
    mutationFn: disconnectUserGithub,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["githubRepos", userId] })
      queryClient.removeQueries({ queryKey: ["githubRepos", userId] })
      toast({ title: "Disconnecting..." })
      return { previousRepos: queryClient.getQueryData<GithubRepo[]>(["githubRepos", userId]) };
    },
    onError: (error, variables, context) => {
      if (context?.previousRepos) {
          queryClient.setQueryData(["githubRepos", userId], context.previousRepos);
      }
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect from GitHub. Please try again.",
        variant: "destructive",
      })
    },
    onSuccess: (data) => {
      if (data.error) {
         toast({ title: "Disconnection Failed", description: data.error, variant: "destructive" });
      } else {
        toast({
          title: "Success",
          description: "GitHub account disconnected successfully.",
        })
        // Important: Invalidate queries that depend on the connection status
        queryClient.invalidateQueries({ queryKey: ['userProfile', userId] }); // Invalidate user profile
        queryClient.invalidateQueries({ queryKey: ["githubRepos", userId] });
      }
    },
    onSettled: () => {
      // Refetch any related data regardless of success/error
    },
  })

  // Import GitHub repo mutation - Use importUserGithubRepos
  const importRepoMutation = useMutation({
    mutationFn: importUserGithubRepos, // Pass the array of repo IDs
    onMutate: async (repoIds) => {
      await queryClient.cancelQueries({ queryKey: ["githubRepos", userId] })

      const previousRepos = queryClient.getQueryData<GithubRepo[]>(["githubRepos", userId])

      // Optimistically update repos to show as imported
      queryClient.setQueryData<GithubRepo[]>(["githubRepos", userId], (old) =>
        (old || []).map((repo) => (repoIds.includes(repo.id) ? { ...repo, isImported: true } : repo)),
      )

      setShowRepoSelector(false) // Close dialog optimistically
      setSelectedRepos([])
      toast({ title: "Importing..." })
      return { previousRepos }
    },
    onError: (error, repoIds, context) => {
      queryClient.setQueryData(["githubRepos", userId], context?.previousRepos) // Rollback optimistic UI update
      setShowRepoSelector(true) // Reopen dialog on error
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import GitHub repositories. Please try again.",
        variant: "destructive",
      })
    },
    onSuccess: (data) => {
       if (data.error) {
           // Handle partial success / error reported from the backend
           toast({ 
               title: "Import Partially Failed", 
               description: data.error, 
               variant: "destructive"
            });
           queryClient.invalidateQueries({ queryKey: ["githubRepos", userId] })
           queryClient.invalidateQueries({ queryKey: ["userPortfolio", userId] }); // Update portfolio items
       } else {
           toast({
               title: "Success",
               description: "GitHub repositories imported successfully.",
           })
           queryClient.invalidateQueries({ queryKey: ["userPortfolio", userId] })
       }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["githubRepos", userId] })
    },
  })

  const handleConnectGithub = useCallback(() => {
    if (!isConnecting) {
      connectMutation.mutate();
    }
  }, [connectMutation, isConnecting]);

  const handleDisconnectGithub = () => {
    if (
      confirm("Are you sure you want to disconnect your GitHub account? This will remove access to your repositories.")
    ) {
      disconnectMutation.mutate()
    }
  }

  const handleImportRepos = () => {
    if (selectedRepos.length === 0) {
      toast({
        title: "No Repositories Selected",
        description: "Please select at least one repository to import.",
        variant: "destructive",
      })
      return
    }

    importRepoMutation.mutate(selectedRepos)
  }

  const toggleRepoSelection = (repoId: string) => {
    setSelectedRepos((prev) => (prev.includes(repoId) ? prev.filter((id) => id !== repoId) : [...prev, repoId]))
  }

  const handleRefreshRepos = () => {
    refetchRepos()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-semibold mb-4">Integrations</h2>
        <Separator className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GitHub Integration Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Github className="h-6 w-6" />
                  <CardTitle>GitHub</CardTitle>
                </div>
                {isGithubAppInstalled && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                )}
              </div>
              <CardDescription>
                Connect your GitHub account to showcase your repositories in your portfolio.
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              {isGithubAppInstalled ? (
                <div className="flex flex-col w-full space-y-2">
                  <Button variant="outline" onClick={() => setShowRepoSelector(true)} disabled={isLoadingRepos || !isGithubAppInstalled || isErrorRepos}>
                    <Plus className="h-4 w-4 mr-2" />
                    Import Repositories
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={handleConnectGithub} disabled={isConnecting || connectMutation.isPending}>
                  {isConnecting || connectMutation.isPending ? "Connecting..." : "Connect GitHub"}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Other integration cards would go here */}
          <Card className="opacity-50">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    fill="currentColor"
                  />
                  <path
                    d="M15.5 8.5L8.5 15.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 8.5L15.5 15.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <CardTitle>Medium</CardTitle>
              </div>
              <CardDescription>Link your Medium articles with your profile.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button className="w-full" disabled>
                Connect Medium
              </Button>
            </CardFooter>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#F24E1E" />
                  <path
                    d="M12 12C12 10.3431 13.3431 9 15 9C16.6569 9 18 10.3431 18 12C18 13.6569 16.6569 15 15 15C13.3431 15 12 13.6569 12 12Z"
                    fill="#FF7262"
                  />
                  <path
                    d="M6 12C6 10.3431 7.34315 9 9 9C10.6569 9 12 10.3431 12 12C12 13.6569 10.6569 15 9 15C7.34315 15 6 13.6569 6 12Z"
                    fill="white"
                  />
                </svg>
                <CardTitle>Figma</CardTitle>
              </div>
              <CardDescription>Showcase your Figma designs on your profile.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button className="w-full" disabled>
                Connect Figma
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* GitHub Repository Selector Dialog */}
        <Dialog open={showRepoSelector} onOpenChange={setShowRepoSelector}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Import GitHub Repositories</DialogTitle>
              <DialogDescription>
                Select repositories to showcase in your portfolio. These will be added as portfolio projects.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">
                {repos.filter((repo) => repo.isImported).length} of {repos.length} repositories imported
              </p>
              <Button variant="outline" size="sm" onClick={handleRefreshRepos} disabled={isLoadingRepos}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRepos ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
              {isLoadingRepos ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isErrorRepos ? (
                <div className="text-center text-red-600">
                  <p>Failed to load repositories.</p>
                  <p className="text-sm">{ (reposError as Error)?.message || "Please try refreshing or check connection."}</p>
                  <Button variant="outline" size="sm" onClick={handleRefreshRepos} className="mt-2">Try Again</Button>
                </div>
              ) : repos.length === 0 && isGithubAppInstalled ? (
                <div className="text-center text-gray-500">
                    <p>No repositories found for your connected account.</p>
                    <p className="text-sm">Ensure the app has access or try refreshing.</p>
                    <Button variant="outline" size="sm" onClick={handleRefreshRepos} className="mt-2">Refresh</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {repos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-start p-2 hover:bg-white/10 rounded-md cursor-pointer"
                      onClick={() => !repo.isImported && toggleRepoSelection(repo.id)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedRepos.includes(repo.id) || repo.isImported}
                      onKeyDown={e => {
                        if ((e.key === " " || e.key === "Enter") && !repo.isImported) {
                          e.preventDefault();
                          toggleRepoSelection(repo.id);
                        }
                      }}
                    >
                      <Checkbox
                        id={`repo-${repo.id}`}
                        checked={selectedRepos.includes(repo.id) || repo.isImported}
                        onCheckedChange={() => !repo.isImported && toggleRepoSelection(repo.id)}
                        disabled={repo.isImported}
                        className="mt-1 mr-3 pointer-events-none"
                        aria-label={`Select ${repo.name} repository`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{repo.name}</h3>
                            {repo.isImported && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Imported
                              </Badge>
                            )}
                          </div>
                          <Link
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-700"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{repo.description || "No description"}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {repo.language && <Badge variant="outline">{repo.language}</Badge>}
                          <Badge variant="outline">★ {repo.stargazers_count}</Badge>
                          <Badge variant="outline">🍴 {repo.forks_count}</Badge>
                          {repo.topics.slice(0, 3).map((topic) => (
                            <Badge key={topic} variant="secondary">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {repos.length === 0 && (
                    <div className="text-center text-gray-500">
                      <p>No repositories found for your connected account.</p>
                      <p className="text-sm">Ensure the app has access or try refreshing.</p>
                      <Button variant="outline" size="sm" onClick={handleRefreshRepos} className="mt-2">
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRepoSelector(false)
                  setSelectedRepos([])
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImportRepos} disabled={selectedRepos.length === 0 || importRepoMutation.isPending}>
                {importRepoMutation.isPending ? "Importing..." : "Import Selected Repositories"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
