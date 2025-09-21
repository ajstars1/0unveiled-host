import ProfilePortfolio from "@/components/profile/profile-portfolio"

interface ProfileMainProps {
  pinnedItems: any[];
  allItems: any[];
  isOwnProfile: boolean;
  username: string;
}

export function ProfileMain({ pinnedItems, allItems, isOwnProfile, username }: ProfileMainProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <ProfilePortfolio
        pinnedItems={pinnedItems}
        allItems={allItems}
        isOwnProfile={isOwnProfile}
        username={username}
      />
    </div>
  )
}
