# 🚀 0Unveiled v3 - AI-Powered Platform Monorepo

Welcome to 0Unveiled v3, a modern, scalable monorepo built with cutting-edge technologies for AI-powered applications.

## 📋 Table of Contents

- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Apps & Packages](#-apps--packages)
- [🎨 Tailwind CSS v4 + shadcn/ui](#-tailwind-css-v4--shadcnui)
- [🐳 Docker Support](#-docker-support)
- [🔧 Development](#-development)
- [🚢 Deployment](#-deployment)
- [📚 Learn More](#-learn-more)

## 🏗️ Architecture

This monorepo follows a microservices architecture with clear separation of concerns:

```
0unveiled/
├── apps/
│   ├── web/                 # Next.js 14 frontend (App Router + shadcn/ui)
│   ├── api/                 # Node.js backend (Express + TypeScript)
│   ├── ai-service/          # FastAPI AI microservice (Python)
│   └── docs/                # Storybook component documentation
│
├── packages/
│   ├── ui/                  # shadcn/ui component library (Tailwind v4)
│   ├── lib/                 # Shared utilities (Supabase, utils, constants)
│   ├── config/              # Shared configurations (ESLint, TypeScript, etc.)
│   └── tailwind-config/     # Shared Tailwind CSS v4 configuration
│
├── docker/                  # Dockerfiles for each service
├── .github/workflows/       # CI/CD configuration
└── turbo.json              # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Bun** 1.0+ (package manager)
- **Python** 3.11+ (for AI service)
- **Docker** (optional, for containerized development)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd 0unveiled
   bun install
   ```

2. **Build packages:**

   ```bash
   bun build
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers:**

   ```bash
   # All services
   bun dev

   # Or individual services
   bun dev --filter=@0unveiled/web     # Next.js frontend
   bun dev --filter=@0unveiled/api     # Node.js API
   ```

5. **Start AI service separately:**
   ```bash
   cd apps/ai-service
   pip install -e .
   uvicorn ai_service.main:app --reload
   ```

## 📦 Apps & Packages

### 🌐 Apps

#### **apps/web** - Next.js Frontend

- **Framework:** Next.js 14 with App Router
- **UI:** shadcn/ui + Tailwind CSS v4 + Lucide icons
- **State:** React Query (TanStack Query)
- **Auth:** Supabase Auth integration
- **Database:** Drizzle ORM + Supabase PostgreSQL

**Key Features:**

- ✅ Modern, responsive UI with shadcn/ui components
- ✅ Dark/light mode support via CSS variables
- ✅ Form handling with React Hook Form + Zod
- ✅ Real-time data with Supabase subscriptions
- ✅ Tailwind CSS v4 with advanced features

#### **apps/api** - Node.js Backend

- **Framework:** Express.js + TypeScript
- **Database:** Supabase PostgreSQL
- **Logging:** Winston with structured logging
- **Validation:** Zod schema validation
- **Security:** Helmet, CORS, rate limiting

**Endpoints:**

- `/health` - Health check
- `/api/auth/*` - Authentication routes
- `/api/user/*` - User management

#### **apps/ai-service** - FastAPI AI Service

- **Framework:** FastAPI + Python 3.11+
- **AI/ML:** OpenAI GPT integration, scikit-learn, transformers
- **Features:** Text generation, summarization, sentiment analysis
- **Async:** Full async/await support with proper error handling

**Endpoints:**

- `/health` - Service health
- `/api/ai/generate` - Text generation
- `/api/ai/summarize` - Text summarization
- `/api/ai/analyze` - Text analysis

### 📦 Packages

#### **packages/ui** - shadcn/ui Component Library

Complete shadcn/ui integration with Tailwind CSS v4:

- ✅ Button, Card, Input, Label components
- ✅ Dialog, Toast notification system
- ✅ Consistent design tokens via CSS variables
- ✅ Full TypeScript support with proper type exports
- ✅ Tailwind CSS v4 native integration

#### **packages/lib** - Shared Utilities

- **Supabase:** Client and server-side configurations
- **Utils:** `cn()` class merger, date formatting, etc.
- **Constants:** API routes, storage keys, app configuration
- **Validations:** Shared Zod schemas

#### **packages/config** - Shared Configuration

- **ESLint:** Base, React, Next.js, Node.js configurations
- **TypeScript:** Shared tsconfig for different environments
- **Tailwind:** Base configuration with design system
- **Prettier:** Code formatting with import sorting

#### **packages/tailwind-config** - Shared Tailwind CSS v4

- **Shared Styles:** Centralized design system
- **CSS Variables:** Consistent theming across apps
- **PostCSS:** Optimized build configuration

## 🎨 Tailwind CSS v4 + shadcn/ui

This project features a cutting-edge setup with **Tailwind CSS v4** and **shadcn/ui** in a monorepo:

### ✨ New Features with Tailwind v4

- **Native CSS imports** - No more complex config files
- **Better performance** - Faster builds and smaller bundles
- **CSS-first approach** - More intuitive styling workflow
- **Enhanced theming** - Better CSS custom property support

### 🏗️ Monorepo Structure

```
packages/
├── tailwind-config/          # Shared Tailwind v4 styles
│   ├── shared-styles.css    # Design system + CSS variables
│   └── postcss.config.js    # PostCSS configuration
│
└── ui/                      # Component library
    ├── src/
    │   ├── components/      # shadcn/ui components
    │   ├── lib/            # Utilities (cn function)
    │   ├── styles/         # Additional styles
    │   └── index.ts        # Main exports
    └── components.json     # shadcn CLI configuration
```

### 🎯 Using Components

```tsx
// Import from the 0unveiled package
import { Button } from "@0unveiled/ui/components/button";
import { Card, CardContent } from "@0unveiled/ui/components/card";
import { cn } from "@0unveiled/ui/lib/utils";

export function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Button className={cn("w-full", "bg-primary")}>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

### 📱 Adding New Components

```bash
# From the web app directory
cd apps/web
bunx --bun shadcn@canary add dropdown-menu
bunx --bun shadcn@canary add select
bunx --bun shadcn@canary add tabs
```

The CLI automatically:

- ✅ Installs components in `packages/ui/src/components/`
- ✅ Updates import paths for monorepo structure
- ✅ Handles dependencies and configuration
- ✅ Maintains consistent theming across 0unveiled

### 🎨 Design System

```css
/* Centralized in packages/tailwind-config/shared-styles.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... full design system */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variants */
}
```

## 🐳 Docker Support

### Development with Docker

```bash
# Start all services
docker-compose up

# Build images
bun docker:build

# View logs
docker-compose logs -f web
```

### Individual Services

```bash
# Frontend only
docker-compose up web

# Backend only
docker-compose up api

# AI service only
docker-compose up ai-service
```

## 🔧 Development

### Commands

```bash
# Development
bun dev                    # Start all apps
bun dev --filter=web       # Start specific app
bun build                  # Build all packages
bun lint                   # Lint all code
bun type-check            # TypeScript validation

# Package management
bun add <package>          # Add to root
bun add <package> -w @0unveiled/web  # Add to specific app

# Tailwind CSS
bun run build:styles      # Build Tailwind styles
bun run dev:styles        # Watch Tailwind styles

# Testing
bun test                   # Run all tests
bun test --filter=ui       # Test specific package
```

### Turborepo Benefits

- ⚡ **Incremental builds** - Only rebuild what changed
- 📦 **Dependency awareness** - Builds packages in correct order
- 🏠 **Remote caching** - Share build cache across team
- 🔄 **Parallel execution** - Run tasks across packages simultaneously

### File Structure Conventions

```
apps/*/
  src/
    app/              # Next.js app directory
    components/       # React components
    lib/             # App-specific utilities
    styles/          # CSS and styling

packages/*/
  src/               # Source code
  dist/              # Built output (auto-generated)
```

## 🚢 Deployment

### Environment Variables

Key environment variables needed:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for AI service)
OPENAI_API_KEY=your_openai_api_key

# Authentication
JWT_SECRET=your_jwt_secret
```

### Deployment Targets

- **Frontend:** Vercel, Netlify, or any static host
- **API:** Railway, Fly.io, or any Node.js host
- **AI Service:** Railway, Google Cloud Run, or any Python host
- **Database:** Supabase (managed) or self-hosted PostgreSQL

### Production Build

```bash
# Build all packages for production
bun run build

# Start production servers
bun start
```

## 📚 Learn More

### Technologies Used

- **🏗️ Monorepo:** [Turborepo](https://turbo.build/)
- **⚡ Package Manager:** [Bun](https://bun.sh/)
- **🌐 Frontend:** [Next.js 14](https://nextjs.org/)
- **🎨 UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **🎯 Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **🏗️ Backend:** [Express.js](https://expressjs.com/)
- **🤖 AI Service:** [FastAPI](https://fastapi.tiangolo.com/)
- **🗄️ Database:** [Supabase](https://supabase.com/)
- **📝 Type Safety:** [TypeScript](https://www.typescriptlang.org/)
- **🐳 Containers:** [Docker](https://www.docker.com/)

### Project Structure Benefits

1. **🔄 Code Reuse** - Shared packages prevent duplication
2. **📦 Independent Deployment** - Deploy services separately
3. **🎯 Type Safety** - End-to-end TypeScript coverage
4. **⚡ Fast Development** - Turborepo caching and parallel builds
5. **📏 Consistent Standards** - Shared linting and formatting rules
6. **🎨 Unified Design** - Shared Tailwind v4 configuration

### Getting Help

- 📖 **Documentation:** Check individual app README files
- 🐛 **Issues:** Create GitHub issues for bugs
- 💬 **Discussions:** Use GitHub Discussions for questions
- 🔧 **Development:** See `CONTRIBUTING.md` for guidelines

---

**Built with ❤️ by the 0Unveiled Team using Tailwind CSS v4 + shadcn/ui**
