import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioCard } from "@/components/profile/portfolio-card";
import { Pin, List } from "lucide-react";
import { memo } from "react";
import { type Skill } from "@0unveiled/database";

// Define the ShowcasedItem type based on what's used in the component
interface ShowcasedItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  projectUrl?: string;
  url?: string;
  provider?: string;
  roleInItem?: string | null;
  showcasedAt?: Date;
  userId?: string;
  isPinned?: boolean;
  order?: number;
  skills: Skill[];
  metadata?: {
    full_name?: string;
    html_url?: string;
    apiUrl?: string;
    source?: string;
    [key: string]: any;
  };
  [key: string]: any; // For other properties that might be needed
}

// Define the component props
interface ProfilePortfolioProps {
  pinnedItems: ShowcasedItem[];
  allItems: ShowcasedItem[];
  isOwnProfile: boolean;
  username: string;
}

const ProfilePortfolio = memo(function ProfilePortfolio({
  pinnedItems,
  allItems,
  isOwnProfile,
  username,
}: ProfilePortfolioProps) {
  // Helper function to determine if an item is a GitHub project
  const getItemProvider = (item: ShowcasedItem): string => {
    // Check if provider is already set
    if (item.provider) return item.provider;

    // Check metadata for GitHub specific fields
    if (item.metadata) {
      if (
        item.metadata.full_name ||
        item.metadata.html_url?.includes("github.com") ||
        item.metadata.apiUrl?.includes("github.com") ||
        item.metadata.source === "github"
      ) {
        return "GITHUB";
      }
    }

    // Check URL patterns for GitHub
    if (
      item.projectUrl?.includes("github.com") ||
      item.url?.includes("github.com")
    ) {
      return "GITHUB";
    }

    // Default to custom if no GitHub indicators found
    return "custom";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pinned" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl border border-border/50 shadow-sm">
          <TabsTrigger
            value="pinned"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <Pin className="h-4 w-4" />
            <span className="hidden sm:inline">Pinned</span>
            {/* {pinnedItems.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {pinnedItems.length}
              </span>
            )} */}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">All Projects</span>
            {/* {allItems.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {allItems.length}
              </span>
            )} */}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pinned" className="space-y-4">
          {pinnedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {pinnedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="transform transition-all hover:scale-[1.02] hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <PortfolioCard
                    item={{
                      ...item,
                      description: item.description || null,
                      imageUrl: item.imageUrl || null,
                      url: item.projectUrl || item.url || "",
                      provider: getItemProvider(item),
                      roleInItem: item.roleInItem || null,
                      skills: item.skills || [],
                    }}
                    isOwnProfile={isOwnProfile}
                    isPinned={!!item.isPinned}
                    username={username}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pin className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isOwnProfile ? "No Pinned Items" : "No Featured Work"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  {isOwnProfile
                    ? "Pin your best projects from the 'All Projects' tab to showcase them prominently here."
                    : "This user hasn't featured any projects yet."}
                </p>
                {isOwnProfile && allItems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You have {allItems.length} project{allItems.length !== 1 ? 's' : ''} to choose from
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {allItems.map((item, index) => (
                <div
                  key={item.id}
                  className="transform transition-all hover:scale-[1.02] hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <PortfolioCard
                    item={{
                      ...item,
                      description: item.description || null,
                      imageUrl: item.imageUrl || null,
                      url: item.projectUrl || item.url || "",
                      provider: getItemProvider(item),
                      roleInItem: item.roleInItem || null,
                      skills: item.skills || [],
                    }}
                    isOwnProfile={isOwnProfile}
                    isPinned={!!item.isPinned}
                    username={username}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="w-8 h-8 text-secondary-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Projects Yet
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  {isOwnProfile
                    ? "Start building your portfolio by adding your projects and showcasing your work."
                    : "This user hasn't added any projects to their portfolio yet."}
                </p>
                {isOwnProfile && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                      Add Project
                    </button>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                      Import from GitHub
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default ProfilePortfolio;
