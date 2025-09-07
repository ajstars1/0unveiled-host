import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type GitHubAnalyzedProject = {
  id: string;
  title: string;
  description: string;
  publicSummary: string;
  techStack: string[];
  analysisData: any;
};

interface GitHubAnalyzedProjectsProps {
  projects: GitHubAnalyzedProject[];
}

export function GitHubAnalyzedProjects({ projects }: GitHubAnalyzedProjectsProps) {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Github className="h-5 w-5 mr-2 text-primary" />
          GitHub Projects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => {
          // Extract repository info if available
          const repoName = project.analysisData?.repository?.full_name || 
                          project.analysisData?.repository_info?.name || 
                          project.title;
                          
          // Extract stars if available
          const stars = project.analysisData?.repository?.stars || 
                       project.analysisData?.repository_info?.stars;
                       
          return (
            <div key={project.id} className="border border-border/50 rounded-md p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm">{project.title}</h3>
                {stars !== undefined && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      width="12" 
                      height="12" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {stars}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{project.publicSummary}</p>
              
              {project.techStack.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 6).map((tech, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.techStack.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.techStack.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-2">
                <Link href={`/project/${project.id}`} passHref>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Details
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
