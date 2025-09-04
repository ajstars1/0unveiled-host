"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Code2, User, Briefcase, GraduationCap, Github, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAnalyzerProps {
  username: string;
  isOwnProfile: boolean;
}

export function ProfileAnalyzer({ username, isOwnProfile }: ProfileAnalyzerProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleAnalyzeProfile = async () => {
    setIsAnalyzing(true);
    setError("");
    setProgress(0);
    
    try {
      setAnalysisStep("Initializing analysis...");
      setProgress(5);

      // Fetch profile analysis data
      const response = await fetch(`/api/analyze/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start profile analysis");
      }

      setAnalysisStep("Starting analysis stream...");
      setProgress(10);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Unable to read analysis stream");
      }

      let analysisResult: any = null;
      const decoder = new TextDecoder();

      // Stream the analysis progress
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("Stream data:", data);
              
              if (data.step) {
                setAnalysisStep(data.step);
              }
              
              if (typeof data.progress === 'number') {
                setProgress(data.progress);
              }
              
              if (data.result) {
                analysisResult = data.result;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error("Error parsing stream data:", parseError);
              // Don't break the stream for parsing errors, continue
            }
          }
        }
      }

      if (analysisResult) {
        // Store the result in sessionStorage for the results page
        sessionStorage.setItem("profileAnalysisResult", JSON.stringify({
          success: true,
          data: analysisResult,
          timestamp: Date.now()
        }));

        // Navigate to results page
        router.push(`/analyze/profile/${username}/results`);
      } else {
        throw new Error("Analysis completed but no result received");
      }
    } catch (err: any) {
      console.error("Profile analysis error:", err);
      setError(err.message || "Failed to analyze profile");
      // Don't reset progress and step on error to show what was being done
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary animate-pulse" />
            Analyzing Complete Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{analysisStep}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Profile Data
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Github className="h-3 w-3 mr-1" />
              All Repositories
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Briefcase className="h-3 w-3 mr-1" />
              Work Experience
            </Badge>
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              Education
            </Badge>
          </div>
          
          {error && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
              <Button 
                onClick={() => {
                  setError("");
                  setIsAnalyzing(false);
                  setProgress(0);
                  setAnalysisStep("");
                }} 
                size="sm" 
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isOwnProfile) {
    return null; // Only show for own profile
  }

  return (
    <Button
      onClick={handleAnalyzeProfile}
      size="sm"
      variant="secondary"
      className="text-primary hover:bg-primary/10"
      disabled={isAnalyzing}
    >
      <Code2 className="h-4 w-4 mr-1.5" />
      Analyze Whole Profile
    </Button>
  );
}