import { type AIVerifiedSkill } from "@0unveiled/database";

// Enhanced types for better type safety
export interface AIVerifiedSkillsData {
  languages?: AIVerifiedSkill[];
  frameworks?: AIVerifiedSkill[];
  libraries?: AIVerifiedSkill[];
  tools?: AIVerifiedSkill[];
  databases?: AIVerifiedSkill[];
  cloud?: AIVerifiedSkill[];
  technologies?: AIVerifiedSkill[];
  totalSkills?: number;
  lastVerified?: string | null;
  isLoading?: boolean;
  error?: string | null;
}

export interface UserSkill {
  skillId: string;
  userId: string;
  skill: {
    id: string;
    name: string;
    category?: string;
  };
  level?: number;
}

export interface VerifiedSkillData {
  type: SkillType;
  confidence?: number;
  repositoryCount?: number;
  linesOfCodeCount?: number;
  sourceAnalysis?: any;
}

export interface AISkillForDisplay {
  name: string;
  type: SkillType;
  confidence?: number;
  repositoryCount?: number;
  linesOfCodeCount?: number;
}

export type SkillType = keyof typeof SKILL_TYPE_CONFIG;

// Skill type configuration for consistent styling and categorization
export const SKILL_TYPE_CONFIG = {
  language: {
    badgeClass: "bg-primary/5 text-primary border-primary/20",
    icon: "💻",
    label: "Programming Language"
  },
  framework: {
    badgeClass: "bg-secondary/5 text-secondary border-secondary/20",
    icon: "🏗️",
    label: "Framework"
  },
  library: {
    badgeClass: "bg-indigo-50/50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
    icon: "📚",
    label: "Library"
  },
  tool: {
    badgeClass: "bg-orange-50/50 text-orange-600 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800",
    icon: "🔧",
    label: "Tool"
  },
  database: {
    badgeClass: "bg-red-50/50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
    icon: "🗄️",
    label: "Database"
  },
  cloud: {
    badgeClass: "bg-cyan-50/50 text-cyan-600 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800",
    icon: "☁️",
    label: "Cloud Platform"
  },
  technology: {
    badgeClass: "bg-accent/5 text-accent border-accent/20",
    icon: "⚡",
    label: "Technology"
  },
  default: {
    badgeClass: "bg-muted/5 text-muted-foreground border-muted/20",
    icon: "🎯",
    label: "Skill"
  }
} as const;

/**
 * Utility function to build verified skills map from AI data
 */
export function buildVerifiedSkillsMap(aiVerifiedSkills?: AIVerifiedSkillsData): Map<string, VerifiedSkillData> {
  const verifiedSkillsMap = new Map<string, VerifiedSkillData>();

  if (!aiVerifiedSkills) return verifiedSkillsMap;

  // Process all available skill types dynamically
  const skillTypes: Array<{
    key: keyof AIVerifiedSkillsData,
    type: SkillType
  }> = [
    { key: 'languages', type: 'language' },
    { key: 'frameworks', type: 'framework' },
    { key: 'libraries', type: 'library' },
    { key: 'tools', type: 'tool' },
    { key: 'databases', type: 'database' },
    { key: 'cloud', type: 'cloud' },
    { key: 'technologies', type: 'technology' },
  ];

  skillTypes.forEach(({ key, type }) => {
    const skills = aiVerifiedSkills[key];
    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        if (skill.skillName) {
          verifiedSkillsMap.set(skill.skillName.toLowerCase(), {
            type,
            confidence: skill.confidenceScore || undefined,
            repositoryCount: skill.repositoryCount || undefined,
            linesOfCodeCount: skill.linesOfCodeCount || undefined,
            sourceAnalysis: skill.sourceAnalysis || undefined
          });
        }
      });
    }
  });

  return verifiedSkillsMap;
}

/**
 * Get confidence level label and styling
 */
export function getConfidenceInfo(confidence?: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (!confidence) {
    return {
      label: "Not verified",
      color: "text-muted-foreground",
      icon: null
    };
  }

  if (confidence >= 80) {
    return {
      label: "Expert",
      color: "text-green-600 dark:text-green-400",
      icon: null
    };
  } else if (confidence >= 60) {
    return {
      label: "Advanced",
      color: "text-blue-600 dark:text-blue-400",
      icon: null
    };
  } else if (confidence >= 40) {
    return {
      label: "Intermediate",
      color: "text-yellow-600 dark:text-yellow-400",
      icon: null
    };
  } else {
    return {
      label: "Beginner",
      color: "text-orange-600 dark:text-orange-400",
      icon: null
    };
  }
}

/**
 * Process AI skills for display, filtering out user skills
 */
export function processAISkillsForDisplay(
  verifiedSkillsMap: Map<string, VerifiedSkillData>,
  userSkills: UserSkill[]
): AISkillForDisplay[] {
  const aiSkills: AISkillForDisplay[] = [];

  // Create a set of user skills for O(1) lookup
  const userSkillNames = new Set(
    userSkills.map(skill => skill.skill.name.toLowerCase())
  );

  // Add skills from verified skills that aren't in user skills
  verifiedSkillsMap.forEach((data, skillName) => {
    if (!userSkillNames.has(skillName)) {
      aiSkills.push({
        name: skillName,
        type: data.type,
        confidence: data.confidence,
        repositoryCount: data.repositoryCount,
        linesOfCodeCount: data.linesOfCodeCount
      });
    }
  });

  // Sort by confidence (highest first)
  return aiSkills.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

/**
 * Get skill verification status for a user skill
 */
export function getSkillVerificationStatus(
  skillName: string,
  verifiedSkillsMap: Map<string, VerifiedSkillData>
): {
  isVerified: boolean;
  verifiedData?: VerifiedSkillData;
} {
  const verifiedData = verifiedSkillsMap.get(skillName.toLowerCase());
  return {
    isVerified: !!verifiedData,
    verifiedData
  };
}

/**
 * Filter and sort skills by various criteria
 */
export function filterAndSortSkills(
  skills: AISkillForDisplay[],
  options: {
    minConfidence?: number;
    maxSkills?: number;
    sortBy?: 'confidence' | 'name' | 'type';
    sortOrder?: 'asc' | 'desc';
  } = {}
): AISkillForDisplay[] {
  const {
    minConfidence = 0,
    maxSkills,
    sortBy = 'confidence',
    sortOrder = 'desc'
  } = options;

  let filtered = skills.filter(skill => (skill.confidence || 0) >= minConfidence);

  // Sort skills
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'confidence':
        comparison = (a.confidence || 0) - (b.confidence || 0);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Limit number of skills if specified
  if (maxSkills) {
    filtered = filtered.slice(0, maxSkills);
  }

  return filtered;
}

/**
 * Calculate skill statistics for analytics
 */
export function calculateSkillStats(
  userSkills: UserSkill[],
  aiVerifiedSkills: AISkillForDisplay[]
): {
  totalSkills: number;
  verifiedSkills: number;
  averageConfidence: number;
  topSkillTypes: Array<{ type: SkillType; count: number }>;
} {
  const totalSkills = userSkills.length + aiVerifiedSkills.length;
  const verifiedSkills = userSkills.filter(skill =>
    aiVerifiedSkills.some(aiSkill =>
      aiSkill.name.toLowerCase() === skill.skill.name.toLowerCase()
    )
  ).length;

  const allConfidences = aiVerifiedSkills
    .map(skill => skill.confidence || 0)
    .filter(conf => conf > 0);

  const averageConfidence = allConfidences.length > 0
    ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length
    : 0;

  // Count skill types
  const typeCount = new Map<SkillType, number>();
  [...userSkills, ...aiVerifiedSkills].forEach(skill => {
    const type = 'type' in skill ? skill.type : 'default';
    typeCount.set(type, (typeCount.get(type) || 0) + 1);
  });

  const topSkillTypes = Array.from(typeCount.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalSkills,
    verifiedSkills,
    averageConfidence,
    topSkillTypes
  };
}