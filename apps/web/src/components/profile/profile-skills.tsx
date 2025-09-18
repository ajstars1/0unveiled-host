import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";
import { memo } from "react";
import { type AIVerifiedSkill } from "@0unveiled/database";

// Define the structure of the verified skills data from the API
interface AIVerifiedSkillsData {
  languages?: AIVerifiedSkill[];
  frameworks?: AIVerifiedSkill[];
  libraries?: AIVerifiedSkill[];
  tools?: AIVerifiedSkill[];
  databases?: AIVerifiedSkill[];
  cloud?: AIVerifiedSkill[];
  technologies?: AIVerifiedSkill[];
  totalSkills?: number;
  lastVerified?: string | null;
}

// Define the structure of a user skill
interface UserSkill {
  skillId: string;
  userId: string;
  skill: {
    id: string;
    name: string;
    category?: string;
  };
}

// Define the props for the ProfileSkills component
interface ProfileSkillsProps {
  topSkills: UserSkill[];
  aiVerifiedSkills?: AIVerifiedSkillsData;
  showAll?: boolean;
}

// Define the structure for our efficient skill data mapping
interface VerifiedSkillData {
  type: 'language' | 'framework' | 'technology' | 'library' | 'tool' | 'database' | 'cloud';
  confidence?: number;
}

// Define the structure for AI skills to display
interface AISkillForDisplay {
  name: string;
  type: string;
  confidence?: number;
}

// Memoized component for displaying user skills
export const ProfileSkills = memo(function ProfileSkills({
  topSkills,
  aiVerifiedSkills,
  showAll = false,
}: ProfileSkillsProps) {
  // Identify verified skills for efficient lookups
  const verifiedSkillsMap = new Map<string, VerifiedSkillData>();
  
  if (aiVerifiedSkills) {
    type SkillArrayKey = 'languages' | 'frameworks' | 'libraries' | 'tools' | 'databases' | 'cloud' | 'technologies';
    const categories: { key: SkillArrayKey; type: VerifiedSkillData['type'] }[] = [
      { key: 'languages', type: 'language' },
      { key: 'frameworks', type: 'framework' },
      { key: 'libraries', type: 'library' },
      { key: 'tools', type: 'tool' },
      { key: 'databases', type: 'database' },
      { key: 'cloud', type: 'cloud' },
      { key: 'technologies', type: 'technology' }, // optional / legacy
    ];

    categories.forEach(({ key, type }) => {
      const list = aiVerifiedSkills[key] as unknown;
      if (!Array.isArray(list)) return; // Guards against number/string fields
      (list as AIVerifiedSkill[]).forEach((skill) => {
        if (!skill?.skillName) return;
        let confidence: number | undefined = skill.confidenceScore ?? undefined;
        if (typeof confidence === 'number') {
          if (confidence > 1) confidence = confidence / 100;
          confidence = Math.max(0, Math.min(1, confidence));
        }
        const keyName = skill.skillName.toLowerCase();
        if (!verifiedSkillsMap.has(keyName)) {
          verifiedSkillsMap.set(keyName, { type, confidence });
        }
      });
    });
  }
  
  const userSkillsSet = new Set(
    topSkills.map(skill => skill.skill.name.toLowerCase())
  );
  
  const aiSkillsForDisplay: AISkillForDisplay[] = [];
  
  verifiedSkillsMap.forEach((data, skillName) => {
    if (!userSkillsSet.has(skillName)) {
      aiSkillsForDisplay.push({
        name: skillName,
        type: data.type,
        confidence: data.confidence
      });
    }
  });
  
  return (
    <>
      {topSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">User Skills</h4>
          <div className="flex flex-wrap gap-2">
            {topSkills.map((userSkill) => {
              const isVerified = verifiedSkillsMap.has(userSkill.skill.name.toLowerCase());
              
              return (
                <div
                  key={userSkill.skillId}
                  className="relative inline-flex group"
                >
                  <Badge
                    className={`${isVerified ? "pr-7" : ""}`}
                    variant={isVerified ? "default" : "secondary"}
                  >
                    {userSkill.skill.name}
                    {isVerified && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-background"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </Badge>
                  {isVerified && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none whitespace-nowrap">
                      Verified through projects
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {aiVerifiedSkills && aiSkillsForDisplay.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Code2 className="h-4 w-4 mr-1.5" />
            Tech Stack from Projects
          </h4>
          <div className="flex flex-wrap gap-2">
            {aiSkillsForDisplay.map((skill) => {
              let badgeClass = "bg-primary/5 text-primary";
              
              if (skill.type === 'framework') {
                badgeClass = "bg-secondary/5 text-secondary";
              } else if (skill.type === 'technology') {
                badgeClass = "bg-accent/5 text-accent";
              }
              
              return (
                <Badge
                  key={`${skill.type}-${skill.name}`}
                  variant="outline"
                  className={badgeClass}
                >
                  {skill.name}
                  {skill.confidence && skill.confidence > 0.7 && (
                    <span className="ml-1 text-xs opacity-70">
                      (High)
                    </span>
                  )}
                  {skill.confidence && skill.confidence > 0.4 && skill.confidence <= 0.7 && (
                    <span className="ml-1 text-xs opacity-70">
                      (Medium)
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
});
