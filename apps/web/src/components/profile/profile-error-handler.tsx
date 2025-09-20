"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LogIn, Home } from "lucide-react";
import Link from "next/link";

interface ProfileErrorHandlerProps {
  error: Error;
  username: string;
  onRetry?: () => void;
}

const ProfileErrorHandler = ({ error, username, onRetry }: ProfileErrorHandlerProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    } else {
      window.location.reload();
    }
  };

  // Determine error type
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized');
  const isNotFoundError = error.message.includes('not found') || error.message.includes('404');
  const isCacheError = error.message.includes('cache') || error.message.includes('2MB');

  return (
    <div className="py-20 lg:py-24">
      <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">
              {isAuthError && "Authentication Required"}
              {isNotFoundError && "Profile Not Found"}
              {isCacheError && "Loading Error"}
              {!isAuthError && !isNotFoundError && !isCacheError && "Something went wrong"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {isAuthError && "Please log in to view this profile or check if the username is correct."}
              {isNotFoundError && `The profile "${username}" doesn't exist or is not accessible.`}
              {isCacheError && "There was an issue loading the profile data. This might be due to large data size."}
              {!isAuthError && !isNotFoundError && !isCacheError && "We encountered an error while loading this profile."}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {isAuthError && (
                <Link href="/login">
                  <Button className="w-full sm:w-auto">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </Button>
                </Link>
              )}
              
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                disabled={isRetrying}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
              
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Additional help for cache errors */}
            {isCacheError && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> This profile has a lot of data. Try refreshing the page or check back later.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileErrorHandler;
