import React, { memo } from "react";
import type { UserProfileData, AISkillsData, LeaderboardData } from "@/react-query/user";

interface ProfileStructuredDataProps {
  user: UserProfileData;
  aiSkills?: AISkillsData;
  leaderboard?: LeaderboardData;
  username: string;
}

const ProfileStructuredData = memo<ProfileStructuredDataProps>(({
  user,
  aiSkills,
  leaderboard,
  username,
}) => {
  if (!user) {
    return null;
  }
  const fullName = `${user.firstName} ${user.lastName || ''}`.trim();

  // Build skills array
  const skills = [
    ...(user.skills || []).map(skill => skill.skill.name),
    ...(aiSkills?.languages || []).map(skill => skill.skillName),
    ...(aiSkills?.frameworks || []).map(skill => skill.skillName),
    ...(aiSkills?.libraries || []).map(skill => skill.skillName),
    ...(aiSkills?.tools || []).map(skill => skill.skillName),
    ...(aiSkills?.databases || []).map(skill => skill.skillName),
    ...(aiSkills?.cloud || []).map(skill => skill.skillName),
  ];

  // Build experience array
  const workExperience = (user.experience || []).map(exp => ({
    "@type": "OrganizationRole",
    "roleName": exp.jobTitle,
    "worksFor": {
      "@type": "Organization",
      "name": exp.companyName,
      "address": exp.location ? {
        "@type": "PostalAddress",
        "addressLocality": exp.location
      } : undefined
    },
    "startDate": exp.startDate,
    "endDate": exp.current ? undefined : exp.endDate,
    "description": exp.description
  }));

  // Build education array
  const education = (user.education || []).map(edu => ({
    "@type": "EducationalOrganization",
    "name": edu.institution,
    "description": edu.degree || edu.fieldOfStudy,
    "startDate": edu.startDate,
    "endDate": edu.current ? undefined : edu.endDate
  }));

  // Build portfolio items
  const portfolioItems = (user.showcasedItems || []).map(item => ({
    "@type": "CreativeWork",
    "name": item.title,
    "description": item.description,
    "url": item.url,
    "dateCreated": item.showcasedAt
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": fullName,
    "alternateName": username,
    "description": user.bio || user.headline,
    "url": `https://0unveiled.com/${username}`,
    "image": user.profilePicture ? {
      "@type": "ImageObject",
      "url": user.profilePicture,
      "width": 400,
      "height": 400
    } : undefined,
    "jobTitle": user.headline,
    "worksFor": user.experience?.find(exp => exp.current) ? {
      "@type": "Organization",
      "name": user.experience.find(exp => exp.current)?.companyName
    } : undefined,
    "address": user.location ? {
      "@type": "PostalAddress",
      "addressLocality": user.location
    } : undefined,
    "alumniOf": user.college ? {
      "@type": "EducationalOrganization",
      "name": user.college
    } : undefined,
    "knowsAbout": [...new Set(skills)], // Remove duplicates
    "hasOccupation": workExperience,
    "creator": portfolioItems,
    "sameAs": [
      user.githubUrl,
      user.linkedinUrl,
      user.websiteUrl
    ].filter(Boolean),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://0unveiled.com/${username}`
    }
  };

  // Add leaderboard information if available
  if (leaderboard && 'success' in leaderboard) {
    (structuredData as any)["award"] = {
      "@type": "Award",
      "name": "Developer Leaderboard",
      "description": `Ranked #${leaderboard.rank} on 0Unveiled leaderboard with ${leaderboard.score} points`,
      "dateAwarded": new Date().toISOString()
    };
  }
    
  if (education.length > 0) {
    (structuredData as any)["alumniOf"] = education;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
});

ProfileStructuredData.displayName = "ProfileStructuredData";

export default ProfileStructuredData;
