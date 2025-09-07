'use client'

import * as React from "react"
import Link from "next/link"
import NextImage from "next/image"
import { Github, Link as LinkIcon, ExternalLink, GitCommitVertical, Code2, Dribbble, Pin, PinOff, Loader2 } from "lucide-react"
import { integrationProviderEnum } from "@0unveiled/database/schema"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { toggleShowcasedItemPin } from "@/actions/profileActions"
import { fetchRepoCode } from "@/actions/portfolioActions"
import { getAiBenchmarkInsights, ProjectInputDataForAI } from "@/actions/AI"
import { useRouter } from "next/navigation"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import BenchmarkResultsDialog from "@/components/benchmark/benchmark-results-dialog"

// Define the expected prop type`       
interface PortfolioCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    url: string;
    provider: string;
    roleInItem: string | null;
    skills: { id: string; name: string }[];
    metadata?: any | null;
    // isPinned?: boolean; // Add if needed for styling pinned cards
  };
  isOwnProfile: boolean;
  isPinned: boolean;
  username: string;
}

// Type for the repo object expected by handleCodeAnalysis
type GitHubRepoForAnalysis = {
  id: string | number;
  full_name: string;
  name: string;
  description?: string;
  language?: string;
  // Add more fields if needed
};

// Helper function to map IntegrationProvider enum (from schema) to Lucide icons or default
// TODO: Add more provider icons if needed (Figma, Medium, etc.)
const ProviderIcon = ({ provider }: { provider: string }) => {
  switch (provider) {
    case 'GITHUB': return <Github className="h-4 w-4" />;
    case 'DRIBBBLE': return <Dribbble className="h-4 w-4" />;
    case 'CUSTOM': // Represents manually added projects/items
    case 'INTERNAL': // Added for internal projects
    default: return <LinkIcon className="h-4 w-4" />; // Default or specific icon for internal/custom
  }
};

// Helper function to format GitHub languages (similar to portfolio-form)
const formatLanguages = (languages: Record<string, number>): string[] => {
  if (!languages || typeof languages !== 'object' || Object.keys(languages).length === 0) return [];
  return Object.entries(languages)
    .sort(([, bytesA], [, bytesB]) => bytesB - bytesA)
    .slice(0, 3) // Show top 3 languages
    .map(([lang]) => lang);
};

// Attempt to extract AI analysis from metadata in a resilient way
function extractAiFromMetadata(metadata: any): { aiSummary?: string; aiTechStack: string[] } {
  const result: { aiSummary?: string; aiTechStack: string[] } = { aiTechStack: [] };
  if (!metadata) return result;

  const candidates: any[] = [];
  // Common places we might have stored the analysis
  if (metadata.analysisData) candidates.push(metadata.analysisData);
  if (metadata.analysis) candidates.push(metadata.analysis);
  if (metadata.aiAnalysis) candidates.push(metadata.aiAnalysis);
  if (metadata.jsonDescription) candidates.push(metadata.jsonDescription);

  // Normalize candidates (parse JSON strings)
  const normalized = candidates.map((c) => {
    if (!c) return null;
    if (typeof c === 'string') {
      try { return JSON.parse(c); } catch { return null; }
    }
    if (typeof c === 'object') return c;
    return null;
  }).filter(Boolean) as any[];

  // Find summary
  for (const obj of normalized) {
    const summary = obj?.ai_summary ?? obj?.project_summary ?? obj?.summary ?? obj?.short_summary ?? obj?.aiShortSummary ?? obj?.projectSummary;
    if (typeof summary === 'string' && summary.trim()) {
      result.aiSummary = summary.trim();
      break;
    }
  }

  // Find tech stack
  const techNames: string[] = [];
  for (const obj of normalized) {
    const tech = obj?.technology_stack ?? obj?.tech_stack ?? obj?.stack;
    if (!tech) continue;

    // If it's already a string[]
    if (Array.isArray(tech)) {
      for (const t of tech) {
        if (typeof t === 'string') techNames.push(t);
        else if (t && typeof t === 'object' && typeof t.name === 'string') techNames.push(t.name);
      }
      continue;
    }

    // If it's an object with categories
    const categories = ['languages', 'frameworks', 'libraries', 'databases', 'tools'];
    for (const key of categories) {
      const arr = tech?.[key];
      if (Array.isArray(arr)) {
        for (const t of arr) {
          if (typeof t === 'string') techNames.push(t);
          else if (t && typeof t === 'object' && typeof t.name === 'string') techNames.push(t.name);
        }
      }
    }
  }

  result.aiTechStack = Array.from(new Set(techNames.map((t) => String(t).trim()).filter(Boolean)));
  return result;
}

export function PortfolioCard({ item, isOwnProfile, isPinned, username }: PortfolioCardProps) {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()
  // const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [analyzingCodeRepoId, setAnalyzingCodeRepoId] = React.useState<string | null>(null);
  const [showBenchmarkDialog, setShowBenchmarkDialog] = React.useState(false);

  // Ensure metadata is treated as an object for safe access
  const metadataObject = (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) ? item.metadata : {};
  const languages = (metadataObject.languages as Record<string, number>) ?? {}; // Add type assertion
  const homepage = metadataObject.homepage as string | undefined;
  const primaryLang = metadataObject.language as string | undefined;
  const commitCount = metadataObject.commitCount as number | undefined;
  console.log("PortfolioCard metadata:", metadataObject);
  const isPrivate = metadataObject.private as boolean | undefined;
  const displayLanguages = formatLanguages(languages);

  const isGitHub = item.provider === 'GITHUB';
  const isInternal = item.provider === 'INTERNAL'; // Check if it represents an internal project

  // Pull AI summary and tech stack from metadata if present
  const { aiSummary, aiTechStack } = React.useMemo(() => extractAiFromMetadata(metadataObject), [metadataObject]);
  const descriptionText = aiSummary ?? item.description ?? "No description provided.";

  // Implement pin/unpin logic
  const handlePinToggle = () => {
    startTransition(async () => {
      const newPinState = !isPinned;
      const result = await toggleShowcasedItemPin(item.id, newPinState, username);
      if (result.success) {
        toast.success(newPinState ? "Item pinned!" : "Item unpinned!");
      } else {
        toast.error(result.error || "Failed to update pin status.");
        console.error("Pin toggle failed:", result.error);
      }
    });
  };

  // Implement code analysis logic
  const handleCodeAnalysis = async (repo: GitHubRepoForAnalysis) => {
    console.log("Starting code analysis for repo:", repo);
    if (!repo || !repo.full_name) {
      setError("Repository data is missing.");
      console.error("Repository data is missing:", repo);
      return;
    }
    setError(null);
    setAnalyzingCodeRepoId(repo.id.toString());
    try {
      const codeResult = await fetchRepoCode(repo.full_name, username);
      if ('error' in codeResult) {
        setError(codeResult.error);
        console.error("Error fetching code:", codeResult.error);
        setAnalyzingCodeRepoId(null);
        return;
      }
      const projectInput: ProjectInputDataForAI = {
        projectTitle: repo.name,
        userRole: "Developer",
        userContributions: repo.description ?? null,
        userListedSkills: repo.language ? [repo.language] : [],
        analysisType: 'CODE',
        code: codeResult.code,
      };
      const userContext = { bio: null, headline: null };
      const insightsResult = await getAiBenchmarkInsights([projectInput], userContext);
      if ('error' in insightsResult) {
        setError(insightsResult.error);
        console.error("Error getting insights:", insightsResult.error);
      } else {
        sessionStorage.setItem("benchmarkInsights", JSON.stringify(insightsResult));
        // router.push("/benchmark/results");
      }
    } catch (err) {
      setError("An unexpected error occurred during code analysis.");
      console.error("Code analysis error:", err);
    } finally {
      setAnalyzingCodeRepoId(null);
    }
  };

  return (
    <Card key={item.id} className="overflow-hidden group flex flex-col h-full relative">
      {/* Pin/Unpin Button - visible only on own profile on hover */}
      {isOwnProfile && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"> {/* Add hover effect wrapper */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/70 hover:bg-background/90 backdrop-blur-xs rounded-full"
                  onClick={handlePinToggle}
                  aria-label={isPinned ? "Unpin item" : "Pin item"}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPinned ? (
                    <PinOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Pin className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="">
                <p>{isPinned ? "Unpin" : "Pin to top"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <CardContent className="p-0 flex flex-col grow border-t border-transparent">
        <div className="p-4 flex flex-col grow">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-base leading-tight grow mr-2 line-clamp-2" title={item.title}>{item.title}</h4>
            <div className="flex items-center justify-center space-x-2">
              {/* Private Project Badge */}
              {isPrivate && (
                <Badge variant="outline" className="font-normal text-xs px-1.5 py-0.5 bg-gray-50/85 text-gray-600 border-gray-200">
                  Private
                </Badge>
              )}
              <span className="text-muted-foreground shrink-0 pt-0.5">
                <ProviderIcon provider={item.provider} />
              </span>
            </div>
          </div>

          {/* Wrap content that should be vertically spaced */}
          <div className="flex flex-col grow mb-4"> {/* Added grow and mb-4 */}
            {/* Role - Ensure this is always displayed if present */}
            {item.roleInItem && <p className="text-sm font-medium text-muted-foreground mb-2">Role: {item.roleInItem}</p>}

            {/* Description - prefer AI summary when present */}
            <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
              {descriptionText}
            </p>

            {/* Spacer within the flex container if needed, or rely on grow */}
            <div className="grow min-h-2"></div> {/* Adjusted spacer */}

            {/* Metadata: Languages & Commits (GitHub only) */}
            {isGitHub && (displayLanguages.length > 0 || commitCount !== undefined) && (
              <div className="mb-3 pt-2 border-t border-dashed">
                <div className="flex flex-wrap gap-1.5">
                  {/* Display GitHub Languages */}
                  {displayLanguages.map((lang) => (
                    <Badge key={lang} variant="outline" className="font-normal text-xs px-1.5 py-0.5">{lang}</Badge>
                  ))}
                  {/* Display GitHub Primary Language (if not in top 3) */}
                  {primaryLang && !displayLanguages.includes(primaryLang) && (
                    <Badge variant="outline" className="font-normal text-xs px-1.5 py-0.5">{primaryLang}</Badge>
                  )}
                  {/* Display Commit Count */}
                  {commitCount !== null && commitCount !== undefined && (
                    <Badge variant="outline" className="font-normal text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                      <GitCommitVertical className="h-3 w-3 mr-1" />
                      {commitCount}{commitCount === 100 ? '+' : ''} commits
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Skills Used - Prefer AI tech stack when available */}
            {(aiTechStack && aiTechStack.length > 0) ? (
              <div className="pt-3 border-t border-border/60">
                <h5 className="text-xs font-medium text-muted-foreground mb-1.5">Tech Stack:</h5>
                <div className="flex flex-wrap gap-1.5">
                  {aiTechStack.map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (item.skills && item.skills.length > 0) ? (
              <div className="pt-3 border-t border-border/60"> {/* Removed mt-auto, relies on flex order */}
                <h5 className="text-xs font-medium text-muted-foreground mb-1.5">Skills Used:</h5>
                <div className="flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div> {/* End of the wrapping flex container */}

          {/* Links Button - Sits outside the growing content */}
          <div className="mt-auto"> {/* Use mt-auto here to push button to bottom */}
            {/* Only show GitHub link if not private */}
            {!isPrivate && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={item.url} target={isInternal ? "_self" : "_blank"} rel={isInternal ? "" : "noopener noreferrer"}>
                  {isGitHub ? "View on GitHub" : isInternal ? "View Project" : "View Item"}
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5"/>
                </Link>
              </Button>
            )}
            {/* Optional: Add Deployment link specifically for GitHub items */}
            {isGitHub && homepage && (
              <Button variant="secondary" size="sm" className="w-full mt-2" asChild>
                <Link href={homepage} target="_blank" rel="noopener noreferrer">
                  View Deployment <ExternalLink className="h-3.5 w-3.5 ml-1.5"/>
                </Link>
              </Button>
            )}
          </div>
          {/* Add Code Analysis button for GitHub projects (only show if owner for private repos) */}
          {isGitHub && isPinned && (!isPrivate || isOwnProfile) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 flex items-center justify-center"
                disabled={analyzingCodeRepoId === (metadataObject.id?.toString?.() || item.id)}
                onClick={async () => {
                  const repoFullName = typeof metadataObject.full_name === "string"
                    ? metadataObject.full_name
                    : item.url.replace(/^https:\/\/github\.com\//, "");
                  // Navigate to analyzing page with repo and username
                  router.push(`/analyze/${encodeURIComponent(username)}/${encodeURIComponent(repoFullName)}`);
                }}
              >
                <Code2 className="h-4 w-4 mr-2" />
                Analyze Code
              </Button>
              {/* <BenchmarkResultsDialog open={showBenchmarkDialog} onOpenChange={setShowBenchmarkDialog} /> */}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}