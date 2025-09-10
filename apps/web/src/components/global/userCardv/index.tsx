import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MapPin, ExternalLink, GraduationCap } from "lucide-react"

// Define a specific type for the props expected by this card
// based on what `getAllUsers` now provides
interface ProfileCardProps {
  profile: {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string | null;
    profilePicture: string | null;
    headline: string | null; // Added headline
    bio: string | null;
    location: string | null; // Added location
    college: string | null; // <<< Added college
    skills: { 
      skill: { id: string; name: string; category: string | null; }
    }[];
    // Add other fields if needed for display later
  };
}

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}` || 'U' // Fallback to 'U'
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  // Combine first and last name safely
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const profileUsername = profile.username ?? 'profile'; // Fallback username for URL

  return (
    <Card className="flex flex-col gap-3 items-center p-6 overflow-hidden h-full hover:shadow-lg transition-shadow duration-200 bg-card text-center">
      <Avatar className="h-20 w-20 border mb-4">
        <AvatarImage src={profile.profilePicture || undefined} alt={fullName} />
        <AvatarFallback>{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-semibold mb-1 truncate w-full">
        <Link href={`/${profileUsername}`} className="hover:underline">
          {fullName || "Unnamed User"}
        </Link>
      </h2>
      <p className="text-sm text-muted-foreground mb-4 px-2 line-clamp-2">
        {profile.headline || profile.bio || "No headline provided."} 
      </p>
      {profile.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {profile.skills.slice(0, 4).map(({ skill }) => (
            <Badge key={skill.id} variant="default" className="text-xs font-medium">{skill.name}</Badge>
          ))}
        </div>
      )}
      {profile.college && (
        <p className={cn(
          "text-sm font-medium mb-1",
          profile.college.toLowerCase().includes("iit") ? "text-amber-700" : "text-foreground"
        )}>
          {profile.college}
        </p>
      )}
      {profile.location && (
        <p className="text-xs text-muted-foreground mb-6">
          {profile.location}
        </p>
      )}
      <Button variant="default" size="lg" className="mt-auto w-full max-w-xs" asChild>
        <Link href={`/${profileUsername}`}>
          View Profile
        </Link>
      </Button>
    </Card>
  );
}

export default ProfileCard;
