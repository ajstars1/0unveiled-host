'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User as UserIcon } from 'lucide-react';
import { getAllUsers } from '@/data/user';
import { Skeleton } from '@/components/ui/skeleton';
import { type User, type UserSkill, type Skill } from '@0unveiled/database';

// Type for user with skills relation from getAllUsers
type UserWithSkills = User & {
  skills: (UserSkill & {
    skill: Pick<Skill, 'id' | 'name' | 'category'>
  })[]
};

interface UserAuthProps {
  onUserIdSubmit: (userId: string) => void;
  loading: boolean;
}

const UserCardSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded-xl">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

export function UserAuth({ onUserIdSubmit, loading }: UserAuthProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    return allUsers.filter((user: UserWithSkills) => {
      if (user.role === "ADMIN" || !user.onboarded) {
        return false;
      }

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.headline && user.headline.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
  }, [searchQuery, allUsers]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleSubmit = () => {
    if (selectedUserId) {
      onUserIdSubmit(selectedUserId);
    }
  };

  const selectedUser = allUsers?.find((user: UserWithSkills) => user.id === selectedUserId);

  return (
    <div className="mb-12 bg-white border border-gray-200 rounded-2xl p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Select User for Analysis
      </h2>
      
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search users by name, username, or email..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* Selected User Display */}
      {selectedUser && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser.profilePicture || undefined} className="" />
                <AvatarFallback className="">
                  {selectedUser.firstName?.[0]?.toUpperCase() || selectedUser.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                {selectedUser.headline && (
                  <p className="text-sm text-gray-500">{selectedUser.headline}</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="default"
              size="default"
              className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300"
            >
              {loading ? "Loading..." : "Analyze Repositories"}
            </Button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => <UserCardSkeleton key={i} />)}
          </>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user: UserWithSkills) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedUserId === user.id
                  ? 'border-black bg-gray-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profilePicture || undefined} className="" />
                  <AvatarFallback className="">
                    {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      @{user.username}
                    </Badge>
                  </div>
                  {user.headline && (
                    <p className="text-sm text-gray-600 mt-1">{user.headline}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {user.location && <span>📍 {user.location}</span>}
                    {user.college && <span>🎓 {user.college}</span>}
                    {user.skills && user.skills.length > 0 && (
                      <span>💼 {user.skills.length} skills</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>

      <p className="text-gray-500 mt-6 text-sm">
        Select a user from our database to analyze their GitHub repositories via OAuth integration.
      </p>
    </div>
  );
}
