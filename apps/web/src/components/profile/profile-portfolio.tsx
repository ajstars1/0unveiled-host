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
    <Tabs defaultValue="pinned" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="pinned">
          <Pin className="h-4 w-4 mr-1.5" /> Pinned
        </TabsTrigger>
        <TabsTrigger value="all">
          <List className="h-4 w-4 mr-1.5" /> All Projects
        </TabsTrigger>
      </TabsList>

      <TabsContent className={""} value="pinned">
        {pinnedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedItems.map((item) => (
              <PortfolioCard
                key={item.id}
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
            ))}
          </div>
        ) : (
          <Card className="">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">
                {isOwnProfile
                  ? "Pin items from the 'All Projects' tab to feature them here."
                  : "No pinned items yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent className={""} value="all">
        {allItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allItems.map((item) => (
              <PortfolioCard
                key={item.id}
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
            ))}
          </div>
        ) : (
          <Card className={""}>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">
                No portfolio items or projects to display yet.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
});

export default ProfilePortfolio;
