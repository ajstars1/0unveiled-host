"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Code2 } from "lucide-react";

interface ProfileAnalyzerProps {
  username: string;
  isOwnProfile: boolean;
}

export function ProfileAnalyzer({ username, isOwnProfile }: ProfileAnalyzerProps) {
  const router = useRouter();

  const handleAnalyzeProfile = async () => {
    // Redirect to the loading page with Tetris game for profile analysis
    router.push(`/analyze/profile/${username}`);
  };

  if (!isOwnProfile) {
    return null; // Only show for own profile
  }

  return (
    <Button
      onClick={handleAnalyzeProfile}
      size="sm"
      variant="secondary"
      className="text-primary hover:bg-primary/10"
    >
      <Code2 className="h-4 w-4 mr-1.5" />
      Analyze Whole Profile
    </Button>
  );
}