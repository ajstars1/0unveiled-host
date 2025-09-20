"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase as BriefcaseIcon, Building, CalendarDays, GraduationCap } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import type { UserProfileData } from "@/react-query/user";

interface OptimizedExperienceEducationProps {
  user: UserProfileData;
}

// Memoized experience item component
const ExperienceItem = memo(({ 
  exp, 
  isLast 
}: { 
  exp: any; 
  isLast: boolean; 
}) => (
  <div className="relative pl-6 pb-4 last:pb-0">
    {!isLast && (
      <div className="absolute left-[7px] top-5 h-full w-0.5 bg-border" />
    )}
    <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
    </div>
    <h4 className="font-medium text-sm">{exp.jobTitle}</h4>
    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
      <Building className="h-3.5 w-3.5" />
      {exp.companyName} {exp.location && `· ${exp.location}`}
    </p>
    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <CalendarDays className="h-3.5 w-3.5" />
      {formatShortDate(exp.startDate)} -{" "}
      {exp.current
        ? "Present"
        : exp.endDate
          ? formatShortDate(exp.endDate)
          : "N/A"}
    </p>
    {exp.description && (
      <p className="mt-2 text-sm text-muted-foreground">
        {exp.description}
      </p>
    )}
  </div>
));

ExperienceItem.displayName = "ExperienceItem";

// Memoized education item component
const EducationItem = memo(({ 
  edu, 
  isLast 
}: { 
  edu: any; 
  isLast: boolean; 
}) => (
  <div className="relative pl-6 pb-4 last:pb-0">
    {!isLast && (
      <div className="absolute left-[7px] top-5 h-full w-0.5 bg-border" />
    )}
    <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
    </div>
    <h4 className="font-medium text-sm">
      {edu.degree || edu.fieldOfStudy || "Studies"}
    </h4>
    <p className="text-sm text-muted-foreground">
      {edu.institution}
    </p>
    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <CalendarDays className="h-3.5 w-3.5" />
      {formatShortDate(edu.startDate)} -{" "}
      {edu.current
        ? "Present"
        : edu.endDate
          ? formatShortDate(edu.endDate)
          : "N/A"}
    </p>
    {edu.description && (
      <p className="mt-2 text-sm text-muted-foreground">
        {edu.description}
      </p>
    )}
  </div>
));

EducationItem.displayName = "EducationItem";

// Memoized experience section
const ExperienceSection = memo(({ experience }: { experience: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <BriefcaseIcon className="h-5 w-5 text-primary" /> Experience
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">
      {experience?.length > 0 ? (
        experience.map((exp, index) => (
          <ExperienceItem
            key={exp.id}
            exp={exp}
            isLast={index === experience.length - 1}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No work experience listed.
        </p>
      )}
    </CardContent>
  </Card>
));

ExperienceSection.displayName = "ExperienceSection";

// Memoized education section
const EducationSection = memo(({ education }: { education: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" /> Education
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">
      {education?.length > 0 ? (
        education.map((edu, index) => (
          <EducationItem
            key={edu.id}
            edu={edu}
            isLast={index === education.length - 1}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No education details available.
        </p>
      )}
    </CardContent>
  </Card>
));

EducationSection.displayName = "EducationSection";

// Main optimized experience and education component
const OptimizedExperienceEducation = memo<OptimizedExperienceEducationProps>(({ user }) => {
  // Memoize the sections to prevent unnecessary re-renders
  const experienceSection = useMemo(() => (
    <ExperienceSection experience={user?.experience || []} />
  ), [user?.experience]);

  const educationSection = useMemo(() => (
    <EducationSection education={user?.education || []} />
  ), [user?.education]);

  return (
    <div className="space-y-6">
      {experienceSection}
      {educationSection}
    </div>
  );
});

OptimizedExperienceEducation.displayName = "OptimizedExperienceEducation";

export default OptimizedExperienceEducation;
