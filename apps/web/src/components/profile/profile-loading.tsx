"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton component for leaderboard card
export const LeaderboardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <div className="h-5 w-5 bg-muted animate-pulse rounded" />
        <Skeleton className="h-6 w-24" />
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-8" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="mt-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-9 w-full" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton component for about card
export const AboutSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-semibold">About</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton component for skills card
export const SkillsSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-lg font-semibold">Skills</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
    </CardContent>
  </Card>
);

// Skeleton component for experience/education
export const ExperienceEducationSkeleton = () => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <Skeleton className="h-6 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="relative pl-6 pb-4">
            <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-muted animate-pulse" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <Skeleton className="h-6 w-20" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 1 }).map((_, i) => (
          <div key={i} className="relative pl-6 pb-4">
            <div className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-muted animate-pulse" />
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-3 w-40 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  </>
);

// Skeleton component for portfolio
export const PortfolioSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-semibold">Portfolio</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Main loading component
export const ProfileLoading = () => (
  <div className="py-20 lg:py-24">
    <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
      {/* Profile header skeleton */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <LeaderboardSkeleton />
          <AboutSkeleton />
          <SkillsSkeleton />
          <ExperienceEducationSkeleton />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <PortfolioSkeleton />
        </div>
      </div>
    </div>
  </div>
);

export default ProfileLoading;
