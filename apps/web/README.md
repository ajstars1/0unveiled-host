# 🌐 0Unveiled Web App

Modern Next.js 14 frontend with **Tailwind CSS v4**, **shadcn/ui**, and **Supabase** integration in a monorepo setup.

## 🚀 Quick Start

```bash
# Install dependencies (from root)
bun install

# Build packages first
bun build

# Start development server
bun dev --filter=@0unveiled/web

# Or from this directory
cd apps/web
bun dev
```

## 🎨 Tailwind CSS v4 + shadcn/ui Monorepo

This app uses a cutting-edge setup with **Tailwind CSS v4** and **shadcn/ui** components organized in a monorepo structure.

### 🏗️ Package Structure

```
packages/
├── tailwind-config/          # Shared Tailwind v4 styles
│   └── shared-styles.css    # Design system + CSS variables
├── ui/                      # Component library
│   ├── src/components/      # shadcn/ui components
│   ├── src/lib/utils.ts     # cn() utility function
│   └── components.json      # shadcn CLI config
└── lib/                     # Shared utilities
```

### ✨ Tailwind CSS v4 Features

- **Native CSS imports** - No more config files needed
- **Better performance** - Faster builds, smaller bundles
- **CSS-first approach** - More intuitive workflow
- **Enhanced theming** - Better CSS custom properties

### 📱 Using Components

All shadcn/ui components are available through the 0unveiled:

```tsx
// Import from 0unveiled packages
import { Button } from "@0unveiled/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@0unveiled/ui/components/card";
import { Input } from "@0unveiled/ui/components/input";
import { Label } from "@0unveiled/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@0unveiled/ui/components/dialog";
import { cn } from "@0unveiled/ui/lib/utils";

// Usage example
export function LoginForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to 0Unveiled</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className={cn("w-full")}
            />
          </div>
          <Button className="w-full">Sign In</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 🎯 Adding New Components

Use the shadcn CLI from the web app directory:

```bash
# From the web app directory
cd apps/web

# Add new shadcn components
bunx --bun shadcn@canary add dropdown-menu
bunx --bun shadcn@canary add select
bunx --bun shadcn@canary add tabs
bunx --bun shadcn@canary add checkbox
```

The CLI automatically:

- ✅ Installs components in `packages/ui/src/components/`
- ✅ Updates import paths for monorepo structure
- ✅ Handles dependencies and peer dependencies
- ✅ Maintains consistent theming across 0unveiled

### 🎨 Design System

The design system is centralized in `packages/tailwind-config/shared-styles.css`:

```css
/* Shared design tokens */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  /* ... complete design system */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variants */
}
```

### 🎨 Component Variants

Components come with multiple variants and sizes:

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">📧</Button>

// Custom styling with cn()
<Button className={cn("w-full", "bg-linear-to-r", "from-blue-500", "to-purple-600")}>
  Gradient Button
</Button>
```

## 🎯 Styling with Tailwind CSS v4

### 🆕 New CSS Import Syntax

```css
/* In your CSS files */
@import "tailwindcss";
@import "@repo/tailwind-config";
@import "@repo/ui/styles.css";
```

### 🎨 Utility Classes

Common utility patterns with v4:

```tsx
// Layout (same as v3)
<div className="flex items-center justify-between">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div className="container mx-auto px-4 py-8">

// Spacing
<div className="space-y-4">      {/* Vertical spacing */}
<div className="space-x-2">      {/* Horizontal spacing */}
<div className="p-6">            {/* Padding */}
<div className="mt-4 mb-2">      {/* Margins */}

// Colors (using design system)
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="border border-border">

// New v4 features
<div className="bg-linear-to-r from-primary to-secondary">
<div className="backdrop-blur-sm bg-background/80">
```

## 🔌 Supabase Integration

### Client-side Usage

```tsx
import { supabase } from "@0unveiled/lib/supabase";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@0unveiled/ui/components/card";

export function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <Card>
      <CardContent>
        <p>Welcome, {user?.email || "Guest"}</p>
      </CardContent>
    </Card>
  );
}
```

### Server-side Usage

```tsx
import { createClient } from "@0unveiled/lib/supabase";
import { cookies } from "next/headers";
import { Card, CardContent } from "@0unveiled/ui/components/card";

export default async function PostsPage() {
  const supabase = createClient(cookies());

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-4">
      {posts?.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-muted-foreground">{post.excerpt}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## 📱 Responsive Design

### Breakpoint Strategy

```tsx
// Mobile-first responsive design with Tailwind v4
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4
  sm:gap-6
">

// Component responsive patterns
<Button className="w-full sm:w-auto">
  Responsive Button
</Button>

// Typography scaling
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

### Common Responsive Patterns

```tsx
// Hide/show on different screens
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>

// Container queries (new in v4)
<div className="@container">
  <div className="@lg:flex @lg:items-center">
    Container-based responsive design
  </div>
</div>
```

## 🎨 Dark Mode

Dark mode is built-in via CSS variables and can be toggled:

```tsx
import { Button } from "@0unveiled/ui/components/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
```

## 📁 File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles (imports only)
├── components/
│   ├── ui/                # Local component re-exports
│   └── ...                # Custom app components
├── lib/
│   └── utils.ts           # App-specific utilities
└── styles/                # Additional styles
```

## 🚀 Performance & Features

### Next.js 14 Optimizations

- ⚡ **App Router** with automatic optimizations
- 📦 **Bundle splitting** and code splitting
- 🖼️ **Image optimization** with next/image
- 🔄 **Static generation** where possible
- 📱 **Progressive Web App** capabilities

### Tailwind CSS v4 Benefits

- 🚀 **Faster builds** - Up to 10x faster than v3
- 📦 **Smaller bundles** - Only used styles included
- 🎯 **Better DX** - No config file needed
- 🎨 **Enhanced features** - Better gradients, shadows, etc.

### Best Practices

```tsx
// Lazy loading
const LazyComponent = lazy(() => import("./HeavyComponent"));

// Image optimization
import Image from "next/image";
<Image
  src="/hero.jpg"
  alt="Hero"
  width={800}
  height={600}
  priority // for above-the-fold images
  className="rounded-lg"
/>;

// Font optimization (already configured)
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
```

## 🔧 Development Commands

```bash
# Development
bun dev                    # Start dev server
bun build                  # Build for production
bun start                  # Start production server

# Styling
bun run build:styles       # Build Tailwind styles
bun run dev:styles         # Watch Tailwind styles

# Quality
bun lint                   # ESLint check
bun type-check            # TypeScript check

# Components
bunx shadcn@canary add button  # Add shadcn component
```

## 📚 Learn More

### Official Documentation

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)

### Monorepo Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Workspace Package Management](https://turbo.build/repo/docs/handbook/workspaces)

---

**Built with ❤️ using Tailwind CSS v4 + shadcn/ui in a modern monorepo**
