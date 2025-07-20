# 🗄️ @0unveiled/database

Production-ready database package for 0Unveiled platform using **Drizzle ORM** with **PostgreSQL**. This package contains the complete schema converted from Prisma to Drizzle ORM.

## 🚀 Features

- **Drizzle ORM** - Type-safe SQL query builder
- **PostgreSQL** - Robust relational database
- **TypeScript** - Full type safety with comprehensive types
- **Migrations** - Automated schema management
- **Studio** - Database GUI for development
- **pgvector** - Vector embeddings for AI features
- **Production Ready** - Complete schema with all relationships

## 📦 Installation

The package is automatically installed as part of the monorepo:

```bash
bun install
```

## 🔧 Setup

### Environment Variables

Add to your `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/0unveiled"
DIRECT_URL="postgresql://username:password@localhost:5432/0unveiled"
SHADOW_DATABASE_URL="postgresql://username:password@localhost:5432/0unveiled_shadow"
```

### Database Connection

```typescript
import { createDatabase } from "@0unveiled/database";

const db = createDatabase();
```

## 📊 Schema Overview

The schema includes all production tables from the original Prisma schema:

### Core Entities

- **Users** - Complete user profiles with social links and preferences
- **Projects** - Project management with roles and skills
- **Clubs** - Community management
- **Posts** - User-generated content
- **Messages** - Real-time communication
- **Tasks** - Project task management

### Relationships

- **Connections** - User networking
- **Applications** - Project/club applications
- **Memberships** - Project and club memberships
- **Skills** - User and project skills
- **Showcased Items** - External platform integrations

### AI Features

- **Knowledge Articles** - Vector embeddings for RAG
- **pgvector** - Vector similarity search support

## 🛠️ Development

### Initial Setup

```bash
# Setup database with pgvector extension
bun run db:setup

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate
```

### Database Management

```bash
# Generate new migrations
bun run db:generate

# Apply migrations
bun run db:migrate

# Open database studio
bun run db:studio

# Type check
bun run type-check

# Lint
bun run lint
```

## 📁 File Structure

```
packages/database/
├── src/
│   ├── index.ts      # Database connection and exports
│   ├── schema.ts     # Complete production schema
│   ├── migrations.ts # Migration utilities
│   └── setup.ts      # Database setup script
├── drizzle/          # Generated migration files
├── drizzle.config.ts # Drizzle configuration
├── .eslintrc.cjs     # ESLint configuration
├── tsconfig.json     # TypeScript configuration
├── package.json      # Package configuration
└── README.md         # Documentation
```

## 🔗 Integration Examples

### User Management

```typescript
import { createDatabase, users, accounts } from "@0unveiled/database";

const db = createDatabase();

// Create a new user
const newUser = await db.insert(users).values({
  supabaseId: "auth-user-id",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  role: "USER",
  onboarded: false,
});

// Link OAuth account
await db.insert(accounts).values({
  userId: newUser.id,
  provider: "github",
  providerAccountId: "github-user-id",
  accessToken: "github-access-token",
});
```

### Project Management

```typescript
import {
  createDatabase,
  projects,
  projectMembers,
  skills,
} from "@0unveiled/database";
import { eq } from "drizzle-orm";

const db = createDatabase();

// Create project with required skills
const project = await db.insert(projects).values({
  title: "AI Chat Application",
  description: "Modern chat app with AI features",
  ownerId: userId,
  publicSummary: "AI-powered chat application",
  status: "ACTIVE",
  visibility: "PUBLIC",
});

// Add project skills
await db.insert(projectSkills).values([
  { projectId: project.id, skillId: reactSkillId },
  { projectId: project.id, skillId: aiSkillId },
]);
```

### Vector Search (AI Features)

```typescript
import { createDatabase, knowledgeArticles } from "@0unveiled/database";
import { sql } from "drizzle-orm";

const db = createDatabase();

// Store knowledge article with embedding
await db.insert(knowledgeArticles).values({
  title: "React Best Practices",
  content: "Comprehensive guide to React...",
  embedding: vectorEmbedding, // 768-dimensional vector
  metadata: { category: "frontend", tags: ["react", "javascript"] },
});

// Vector similarity search
const similarArticles = await db
  .select()
  .from(knowledgeArticles)
  .where(sql`embedding <-> ${queryEmbedding} < 0.5`)
  .orderBy(sql`embedding <-> ${queryEmbedding}`)
  .limit(5);
```

## 🎯 Type Safety

All database operations are fully typed with comprehensive types:

```typescript
import type {
  User,
  NewUser,
  Project,
  NewProject,
  Skill,
  NewSkill,
} from "@0unveiled/database";

// Type-safe operations
const user: User = await db.select().from(users).where(eq(users.id, userId));
const newProject: NewProject = {
  title: "My Project",
  description: "Project description",
  ownerId: user.id,
  publicSummary: "Public summary",
};
```

## 🚀 Production Deployment

For production deployment:

1. **Set up PostgreSQL** with pgvector extension
2. **Configure environment variables**:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db"
   DIRECT_URL="postgresql://user:pass@host:5432/db"
   SHADOW_DATABASE_URL="postgresql://user:pass@host:5432/db_shadow"
   ```
3. **Run setup**: `bun run db:setup`
4. **Apply migrations**: `bun run db:migrate`
5. **Build package**: `bun run build`

## 🔄 Migration from Prisma

This schema has been carefully converted from the original Prisma schema:

- ✅ **All tables preserved** with exact same structure
- ✅ **All relationships maintained** with proper foreign keys
- ✅ **All enums converted** to PostgreSQL enums
- ✅ **All indexes preserved** for performance
- ✅ **All constraints maintained** for data integrity
- ✅ **Type safety enhanced** with Drizzle's type inference

## 📚 Learn More

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🎯 Production Notes

- **Backup your data** before running migrations
- **Test migrations** in staging environment first
- **Monitor performance** with the provided indexes
- **Use connection pooling** for production workloads
- **Enable pgvector extension** for AI features
