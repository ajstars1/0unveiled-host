"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PortfolioCard } from "@/components/profile/portfolio-card";
import { Pin, List, GripVertical, Save } from "lucide-react";
import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { type Skill } from "@0unveiled/database";
import { updateShowcasedItemsOrder } from "@/actions/profileActions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Portfolio Item Component
interface SortablePortfolioItemProps {
  item: ShowcasedItem;
  index: number;
  isOwnProfile: boolean;
  username: string;
  getItemProvider: (item: ShowcasedItem) => string;
}

const SortablePortfolioItem = memo(function SortablePortfolioItem({
  item,
  index,
  isOwnProfile,
  username,
  getItemProvider,
}: SortablePortfolioItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  const animationDelay = useMemo(() => `${index * 100}ms`, [index]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group h-full"
    >
      {isOwnProfile && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
        >
          <div className="bg-background border border-border rounded-full p-1 shadow-md">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      <div
        className="transform transition-all hover:scale-[1.02] hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
        style={{
          animationDelay,
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
    </div>
  );
});

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
  const [localPinnedItems, setLocalPinnedItems] = useState(pinnedItems);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sensors for drag and drop - must be called at top level, not inside useMemo
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize sortable items IDs
  const sortableItems = useMemo(() =>
    localPinnedItems.map(item => item.id),
    [localPinnedItems]
  );

  // Helper function to determine if an item is a GitHub project
  const getItemProvider = useCallback((item: ShowcasedItem): string => {
    // Check if provider is already set
    if (item.provider) return item.provider;

    // Check metadata for GitHub specific fields
    const metadata = item.metadata;
    if (metadata) {
      if (
        metadata.full_name ||
        metadata.html_url?.includes("github.com") ||
        metadata.apiUrl?.includes("github.com") ||
        metadata.source === "github"
      ) {
        return "GITHUB";
      }
    }

    // Check URL patterns for GitHub
    const projectUrl = item.projectUrl;
    const url = item.url;
    if (
      projectUrl?.includes("github.com") ||
      url?.includes("github.com")
    ) {
      return "GITHUB";
    }

    // Default to custom if no GitHub indicators found
    return "custom";
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalPinnedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  }, []);

  // Handle save changes
  const handleSaveOrder = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const itemIds = localPinnedItems.map(item => item.id);
      const result = await updateShowcasedItemsOrder(itemIds, username);

      if (result.success) {
        setHasChanges(false);
      } else {
        console.error("Failed to save order:", result.error);
        // Could add toast notification here
      }
    } catch (error) {
      console.error("Failed to save order:", error);
      // Could add toast notification here
    } finally {
      setIsSaving(false);
    }
  }, [localPinnedItems, username, isSaving]);

  // Update local state when props change
  useEffect(() => {
    setLocalPinnedItems(pinnedItems);
    setHasChanges(false);
  }, [pinnedItems]);  return (
    <div className="space-y-6">
      <Tabs defaultValue="pinned" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl border border-border/50 shadow-sm">
          <TabsTrigger
            value="pinned"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <Pin className="h-4 w-4" />
            <span className="hidden sm:inline">Pinned</span>
            {/* {localPinnedItems.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {localPinnedItems.length}
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
          {isOwnProfile && hasChanges && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleSaveOrder}
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Order"}
              </Button>
            </div>
          )}

          {localPinnedItems.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableItems}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">
                  {localPinnedItems.map((item, index) => (
                    <SortablePortfolioItem
                      key={item.id}
                      item={item}
                      index={index}
                      isOwnProfile={isOwnProfile}
                      username={username}
                      getItemProvider={getItemProvider}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">
              {allItems.map((item, index) => (
                <div
                  key={item.id}
                  className="transform transition-all hover:scale-[1.02] hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
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
