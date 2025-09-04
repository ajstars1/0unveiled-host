"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Brain, Code, Database, Cloud, Wrench, Package, ChevronDown, ChevronUp, Shield } from "lucide-react"
import { type AIVerifiedSkill } from "@0unveiled/database"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AIVerifiedSkillsProps {
  skills: {
    languages: AIVerifiedSkill[];
    frameworks: AIVerifiedSkill[];
    libraries: AIVerifiedSkill[];
    tools: AIVerifiedSkill[];
    databases: AIVerifiedSkill[];
    cloud: AIVerifiedSkill[];
    totalSkills: number;
    lastVerified: string | null;
  };
  className?: string;
}

const skillTypeConfig = {
  LANGUAGE: { 
    icon: Code, 
    color: "text-blue-500", 
    bgColor: "bg-blue-50", 
    borderColor: "border-blue-200",
    label: "Languages" 
  },
  FRAMEWORK: { 
    icon: Package, 
    color: "text-green-500", 
    bgColor: "bg-green-50", 
    borderColor: "border-green-200",
    label: "Frameworks" 
  },
  LIBRARY: { 
    icon: Package, 
    color: "text-purple-500", 
    bgColor: "bg-purple-50", 
    borderColor: "border-purple-200",
    label: "Libraries" 
  },
  TOOL: { 
    icon: Wrench, 
    color: "text-orange-500", 
    bgColor: "bg-orange-50", 
    borderColor: "border-orange-200",
    label: "Tools" 
  },
  DATABASE: { 
    icon: Database, 
    color: "text-red-500", 
    bgColor: "bg-red-50", 
    borderColor: "border-red-200",
    label: "Databases" 
  },
  CLOUD: { 
    icon: Cloud, 
    color: "text-cyan-500", 
    bgColor: "bg-cyan-50", 
    borderColor: "border-cyan-200",
    label: "Cloud & DevOps" 
  },
};

function SkillSection({ 
  title, 
  skills, 
  icon: Icon, 
  color, 
  bgColor, 
  borderColor,
  isExpanded,
  onToggle 
}: {
  title: string;
  skills: AIVerifiedSkill[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (skills.length === 0) return null;

  const displaySkills = isExpanded ? skills : skills.slice(0, 3);
  const hasMore = skills.length > 3;

  return (
    <div className="space-y-3">
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
          bgColor,
          borderColor
        )}
        onClick={hasMore ? onToggle : undefined}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="secondary" className="text-xs">
            {skills.length}
          </Badge>
        </div>
        {hasMore && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>+{skills.length - 3} more</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displaySkills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{skill.skillName}</span>
                <Shield className="h-3 w-3 text-primary flex-shrink-0" />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {skill.repositoryCount} {skill.repositoryCount === 1 ? 'repo' : 'repos'} • {Math.round(skill.linesOfCodeCount / 1000)}k LOC
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <div className="text-right">
                <div className="text-xs font-medium">{skill.confidenceScore}%</div>
                <div className="text-xs text-muted-foreground">confidence</div>
              </div>
              <div className="w-12">
                <Progress 
                  value={skill.confidenceScore} 
                  className="h-1.5" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIVerifiedSkills({ skills, className }: AIVerifiedSkillsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (skills.totalSkills === 0) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI-Verified Tech Stack</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>{skills.totalSkills} skills verified</span>
          </div>
        </div>
        {skills.lastVerified && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(skills.lastVerified).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(skillTypeConfig).map(([type, config]) => {
          const categorySkills = skills[type.toLowerCase() as keyof typeof skills] as AIVerifiedSkill[];
          if (!Array.isArray(categorySkills)) return null;

          return (
            <SkillSection
              key={type}
              title={config.label}
              skills={categorySkills}
              icon={config.icon}
              color={config.color}
              bgColor={config.bgColor}
              borderColor={config.borderColor}
              isExpanded={expandedSections.has(type)}
              onToggle={() => toggleSection(type)}
            />
          );
        })}

        <Separator />
        
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm text-primary">0unveiled AI Verified</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            These skills have been automatically verified by analyzing your portfolio repositories. 
            Skills are scored based on usage frequency, code complexity, and implementation depth.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}