import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { memo } from "react";
import { Edit, Code2, Github, Linkedin, Twitter, Dribbble, Globe, MapPin, GraduationCap } from "lucide-react";
import { ProfileAnalyzer } from "@/components/profile/profile-analyzer";
import { ProfileActions } from "@/components/profile/profile-actions";
import { UserProfileDetails } from "@/data/user";

// Define proper TypeScript interface for the component props
interface ProfileHeaderProps {
  user: UserProfileDetails;
  fullName: string;
  isOwnProfile: boolean;
  username: string;
}

const ProfileHeader = memo(function ProfileHeader({
  user,
  fullName,
  isOwnProfile,
  username,
}: ProfileHeaderProps) {
  if (!user) return null;

  // Social links component to avoid repetitive code
  const SocialLinks = () => (
    <div className="flex justify-center md:justify-start flex-wrap gap-1 mt-3">
      {user.githubUrl && (
        <Link
          href={user.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          passHref
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <Github className="h-4 w-4" />
          </Button>
        </Link>
      )}
      {user.linkedinUrl && (
        <Link
          href={user.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          passHref
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <Linkedin className="h-4 w-4" />
          </Button>
        </Link>
      )}
      {user.twitterUrl && (
        <Link
          href={user.twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          passHref
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <Twitter className="h-4 w-4" />
          </Button>
        </Link>
      )}
      {user.dribbbleUrl && (
        <Link
          href={user.dribbbleUrl}
          target="_blank"
          rel="noopener noreferrer"
          passHref
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <Dribbble className="h-4 w-4" />
          </Button>
        </Link>
      )}
      {user.websiteUrl && (
        <Link
          href={user.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          passHref
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <Globe className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <Card className="mb-6 shadow-lg border border-border/10 overflow-visible">
      <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 relative">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-md mt-[-48px] md:mt-[-60px] shrink-0">
          <AvatarImage
            className={""}
            src={user.profilePicture ?? undefined}
            alt={`${fullName}'s profile picture`}
            loading="eager" // Prioritize avatar loading
          />
          <AvatarFallback className="text-4xl">
            {user.firstName?.charAt(0) || ""}
            {user.lastName?.charAt(0) || ""}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center md:text-left w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {fullName}
          </h1>
          {user.username && (
            <p className="text-sm text-muted-foreground -mt-1">
              @{user.username}
            </p>
          )}

          {user.headline && (
            <p className="text-lg text-primary mt-1 font-medium">
              {user.headline}
            </p>
          )}
          {!user.headline && user.experience?.[0]?.current && (
            <p className="text-lg text-primary mt-1 font-medium">
              {user.experience[0].jobTitle} at{" "}
              {user.experience[0].companyName}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            {user.college && (
              <div className="flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-4 w-4 shrink-0 text-primary/80" />
                <span>{user.college}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{user.location}</span>
              </div>
            )}
          </div>

          <SocialLinks />
        </div>

        <div className="flex gap-2 mt-4 md:mt-0 md:ml-auto shrink-0 items-center">
          {isOwnProfile ? (
            <>
              <ProfileAnalyzer
                username={username}
                isOwnProfile={isOwnProfile}
              />
              <Link href="/profile/edit" passHref>
                <Button size="sm" variant="default" className="">
                  <Edit className="h-4 w-4 mr-1.5" /> Edit Profile
                </Button>
              </Link>
            </>
          ) : user ? (
            <ProfileActions
              profileUserId={user.id}
              initialConnectionStatus={user.connectionStatus}
              initialConnectionRequestId={user.connectionRequestId}
              profileUsername={user.username || ""}
              isUserLoggedIn={!!user}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
});

export default ProfileHeader;
