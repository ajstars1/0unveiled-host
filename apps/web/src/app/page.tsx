import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define the User type based on our database schema
interface User {
  id: string;
  supabaseId: string;
  email: string;
  username?: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  role: "USER" | "ADMIN";
  onboarded: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  location?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  behanceUrl?: string;
  dribbbleUrl?: string;
  college?: string;
  headline?: string;
}

async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/users`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch users");
    }

    return result.data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function HomePage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col">
      <section className="flex min-h-screen items-center justify-center bg-linear-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Welcome to{" "}
              <span className="bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                0Unveiled
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Experience the future with our AI-powered platform. Unleash
              creativity, boost productivity, and transform your ideas into
              reality.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Community
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Meet the amazing people building the future with us
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm">
                {users.length} {users.length === 1 ? "User" : "Users"} Found
              </Badge>
            </div>
          </div>

          {users.length > 0 ? (
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={user.profilePicture || undefined}
                          alt={user.firstName}
                        />
                        <AvatarFallback className="text-lg">
                          {user.firstName.charAt(0)}
                          {user.lastName?.charAt(0) || ""}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-lg">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    {user.username && (
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    )}
                    {user.headline && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.headline}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <div className="flex justify-center gap-2">
                      <Badge
                        variant={
                          user.role === "ADMIN" ? "default" : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                      {user.onboarded && (
                        <Badge variant="outline">Onboarded</Badge>
                      )}
                    </div>

                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    {user.location && (
                      <p className="text-xs text-muted-foreground">
                        📍 {user.location}
                      </p>
                    )}

                    {user.college && (
                      <p className="text-xs text-muted-foreground">
                        🎓 {user.college}
                      </p>
                    )}

                    <div className="flex justify-center gap-2 pt-2">
                      {user.githubUrl && (
                        <a
                          href={user.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </a>
                      )}
                      {user.linkedinUrl && (
                        <a
                          href={user.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      {user.twitterUrl && (
                        <a
                          href={user.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-16 text-center">
              <div className="mx-auto max-w-md">
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-12">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="mt-4 text-lg font-semibold">
                      No Users Found
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No users have been added to the database yet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to build the future
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "AI-Powered",
                description:
                  "Leverage cutting-edge AI technology for better results",
              },
              {
                title: "Scalable",
                description:
                  "Built to grow with your needs and handle any load",
              },
              {
                title: "Secure",
                description: "Enterprise-grade security to protect your data",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative rounded-lg border bg-card p-8 shadow-sm"
              >
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
