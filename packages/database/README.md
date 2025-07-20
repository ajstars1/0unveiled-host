# 🗄️ @0unveiled/database

Database package for 0Unveiled platform using **Drizzle ORM** with **PostgreSQL**.

## 🚀 Features

- **Drizzle ORM** - Type-safe SQL query builder
- **PostgreSQL** - Robust relational database
- **TypeScript** - Full type safety
- **Migrations** - Automated schema management
- **Studio** - Database GUI for development

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
```

### Database Connection

```typescript
import { createDatabase } from "@0unveiled/database";

const db = createDatabase();
```

## 📊 Schema

### Users Table

```typescript
import { users } from "@0unveiled/database";

// Create a new user
const newUser = await db.insert(users).values({
  email: "user@example.com",
  name: "John Doe",
});

// Query users
const allUsers = await db.select().from(users);
```

### Posts Table

```typescript
import { posts } from "@0unveiled/database";

// Create a new post
const newPost = await db.insert(posts).values({
  title: "My First Post",
  content: "Hello World!",
  authorId: userId,
  published: true,
});

// Query posts with author
const postsWithAuthor = await db
  .select()
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));
```

## 🛠️ Development

### Generate Migrations

```bash
bun run db:generate
```

### Run Migrations

```bash
bun run db:migrate
```

### Open Database Studio

```bash
bun run db:studio
```

### Type Check

```bash
bun run type-check
```

### Lint

```bash
bun run lint
```

## 📁 File Structure

```
packages/database/
├── src/
│   ├── index.ts      # Main exports and database connection
│   ├── schema.ts     # Database schema definitions
│   └── migrations.ts # Migration utilities
├── drizzle/          # Generated migration files
├── drizzle.config.ts # Drizzle configuration
└── package.json
```

## 🔗 Integration

### With Next.js

```typescript
// app/api/users/route.ts
import { createDatabase } from "@0unveiled/database";
import { users } from "@0unveiled/database";

export async function GET() {
  const db = createDatabase();
  const allUsers = await db.select().from(users);
  return Response.json(allUsers);
}
```

### With Express API

```typescript
// api/routes/users.ts
import { createDatabase } from "@0unveiled/database";
import { users } from "@0unveiled/database";

const db = createDatabase();

app.get("/users", async (req, res) => {
  const allUsers = await db.select().from(users);
  res.json(allUsers);
});
```

## 🎯 Type Safety

All database operations are fully typed:

```typescript
import type { User, NewUser } from "@0unveiled/database";

// Type-safe insert
const newUser: NewUser = {
  email: "user@example.com",
  name: "John Doe",
};

// Type-safe select
const user: User = await db.select().from(users).where(eq(users.id, userId));
```

## 🚀 Production

For production deployment:

1. Set up PostgreSQL database
2. Configure `DATABASE_URL` environment variable
3. Run migrations: `bun run db:migrate`
4. Build the package: `bun run build`

## 📚 Learn More

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
