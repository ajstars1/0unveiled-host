"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import ProfileErrorHandler from "./profile-error-handler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  username?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Profile Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.error && this.props.username) {
        return (
          <ProfileErrorHandler
            error={this.state.error}
            username={this.props.username}
            onRetry={this.handleRetry}
          />
        );
      }

      return (
        <div className="py-20 lg:py-24">
          <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl">Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  We encountered an error while loading this profile. This might be a temporary issue.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {this.state.error.message}
                      {this.state.error.stack && `\n\n${this.state.error.stack}`}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2 justify-center">
                  <Button onClick={this.handleRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Reload Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProfileErrorBoundary;
