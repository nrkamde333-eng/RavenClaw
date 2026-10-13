export interface SamplePreset {
  id: string;
  name: string;
  source: 'gemini' | 'chatgpt' | 'claude' | 'deepseek';
  target: 'gemini' | 'chatgpt' | 'claude' | 'deepseek' | 'generic';
  description: string;
  wordCountEstimate: number;
  expectedMode: 'direct' | 'snapshot';
  rawText: string;
  customObjective: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'gemini-short-fix',
    name: 'Gemini -> Claude (Direct Mode, <600 words)',
    source: 'gemini',
    target: 'claude',
    description: 'A concise Python Redis caching bug fix session from Gemini.',
    wordCountEstimate: 240,
    expectedMode: 'direct',
    customObjective: 'Now add unit tests using pytest-asyncio and mock the Redis client.',
    rawText: `Prompt:
I have an async Redis client in FastAPI that throws a ConnectionResetError when connection pool runs out under heavy load. How can I implement robust connection retry logic and connection pool limits?

Gemini:
Here is how you can resolve the Redis ConnectionResetError by configuring a bounded ConnectionPool with exponential backoff retry mechanics in ` + '`redis-py`' + `:

` + '```python\n# filepath: app/services/cache.py\nimport asyncio\nimport logging\nimport redis.asyncio as aioredis\nfrom redis.exceptions import ConnectionError, TimeoutError\n\nlogger = logging.getLogger(__name__)\n\nclass RedisManager:\n    def __init__(self, redis_url: str):\n        self.pool = aioredis.ConnectionPool.from_url(\n            redis_url,\n            max_connections=20,\n            socket_timeout=2.0,\n            socket_connect_timeout=2.0,\n            retry_on_timeout=True\n        )\n        self.client = aioredis.Redis(connection_pool=self.pool)\n\n    async def get_with_retry(self, key: str, retries: int = 3):\n        for attempt in range(retries):\n            try:\n                return await self.client.get(key)\n            except (ConnectionError, TimeoutError) as e:\n                if attempt == retries - 1:\n                    logger.error(f"Redis get failed after {retries} attempts: {e}")\n                    raise\n                await asyncio.sleep(0.1 * (2 ** attempt))\n```' + `

Key decisions made:
1. Max connections capped at 20 to prevent socket exhaustion.
2. Exponential backoff with jitter on transient connection resets.
3. Explicit socket timeouts configured on pool creation.

Prompt:
That makes sense. Can we also ensure the client cleans up cleanly on FastAPI shutdown?

Gemini:
Yes, hook the disconnect into the FastAPI lifespan context manager:

` + '```python\n# filepath: app/main.py\nfrom contextlib import asynccontextmanager\nfrom fastapi import FastAPI\nfrom app.services.cache import RedisManager\n\nredis_manager = RedisManager("redis://localhost:6379/0")\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    # Startup\n    yield\n    # Graceful shutdown\n    await redis_manager.client.aclose()\n    await redis_manager.pool.disconnect()\n\napp = FastAPI(lifespan=lifespan)\n```' + `
`,
  },
  {
    id: 'claude-fullstack-architecture',
    name: 'Claude -> ChatGPT (Snapshot Mode, >600 words)',
    source: 'claude',
    target: 'chatgpt',
    description: 'A comprehensive multi-turn web app architecture design with schemas and utilities.',
    wordCountEstimate: 980,
    expectedMode: 'snapshot',
    customObjective: 'Now design the Stripe checkout webhook handler and database synchronization logic in TypeScript.',
    rawText: `Human:
We are building a multi-tenant SaaS platform called "TeamSync" using Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL. We need to plan out the tenant isolation strategy, user roles, database schema, and authentication middleware.

Claude:
Here is the recommended multi-tenant architecture for TeamSync.

### 1. Multi-Tenant Isolation Strategy
We will use row-level tenant isolation with a mandatory ` + '`organizationId`' + ` on all tenant-scoped tables. This keeps infrastructure costs low while providing clean logical separation.

### 2. Prisma Database Schema
Here is the initial database schema supporting organizations, memberships, and role-based access control:

` + '```prisma\n// filepath: prisma/schema.prisma\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\nenum Role {\n  OWNER\n  ADMIN\n  MEMBER\n  VIEWER\n}\n\nmodel Organization {\n  id          String       @id @default(cuid())\n  name        String\n  slug        String       @unique\n  plan        String       @default("free")\n  createdAt   DateTime     @default(now())\n  memberships Membership[]\n  projects    Project[]\n}\n\nmodel User {\n  id          String       @id @default(cuid())\n  email       String       @unique\n  name        String?\n  avatarUrl   String?\n  createdAt   DateTime     @default(now())\n  memberships Membership[]\n}\n\nmodel Membership {\n  id             String       @id @default(cuid())\n  role           Role         @default(MEMBER)\n  userId         String\n  organizationId String\n  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)\n  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, organizationId])\n  @@index([organizationId])\n}\n\nmodel Project {\n  id             String       @id @default(cuid())\n  title          String\n  description    String?\n  organizationId String\n  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  createdAt      DateTime     @default(now())\n  updatedAt      DateTime     @updatedAt\n\n  @@index([organizationId])\n}\n```' + `

Human:
Please write the authentication and tenant context resolver helper that reads the session and organization slug from the subdomain or request headers.

Claude:
Here is the tenant resolution helper using Next.js server actions and React cache:

` + '```typescript\n// filepath: src/lib/tenant.ts\nimport { cache } from "react";\nimport { cookies, headers } from "next/headers";\nimport { prisma } from "@/lib/prisma";\nimport { getCurrentSessionUser } from "@/lib/auth";\n\nexport interface TenantContext {\n  user: {\n    id: string;\n    email: string;\n    name?: string | null;\n  };\n  organization: {\n    id: string;\n    name: string;\n    slug: string;\n    plan: string;\n  };\n  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";\n}\n\nexport const getTenantContext = cache(async (): Promise<TenantContext> => {\n  const user = await getCurrentSessionUser();\n  if (!user) {\n    throw new Error("UNAUTHORIZED");\n  }\n\n  const headerList = await headers();\n  const orgSlug = headerList.get("x-org-slug") || (await cookies()).get("current_org_slug")?.value;\n\n  if (!orgSlug) {\n    throw new Error("NO_TENANT_SELECTED");\n  }\n\n  const membership = await prisma.membership.findFirst({\n    where: {\n      userId: user.id,\n      organization: { slug: orgSlug },\n    },\n    include: { organization: true },\n  });\n\n  if (!membership) {\n    throw new Error("FORBIDDEN_TENANT_ACCESS");\n  }\n\n  return {\n    user: {\n      id: user.id,\n      email: user.email,\n      name: user.name,\n    },\n    organization: membership.organization,\n    role: membership.role,\n  };\n});\n```' + `

Human:
We also decided that all team invitations will be signed JWT tokens valid for 72 hours. What should the token payload structure look like?

Claude:
The invitation JWT should contain:
- ` + '`email`' + `: The invitee's email address
- ` + '`organizationId`' + `: Target organization ID
- ` + '`role`' + `: Assigned initial role (ADMIN, MEMBER, VIEWER)
- ` + '`invitedBy`' + `: User ID of inviter
- ` + '`exp`' + `: Standard expiration timestamp (72 hours from issue)

Key architectural decisions so far:
1. Row-level multi-tenancy using ` + '`organizationId`' + ` in PostgreSQL with Prisma.
2. Next.js 14 cached tenant resolution via React cache and cookie/header routing.
3. 72-hour signed JWT invitations for team onboarding.
4. Cascading deletion on organization memberships.`,
  },
  {
    id: 'deepseek-algorithm',
    name: 'DeepSeek -> Gemini (Algorithm & Reasoning)',
    source: 'deepseek',
    target: 'gemini',
    description: 'DeepSeek R1 algorithm design session with thinking process and vector math.',
    wordCountEstimate: 420,
    expectedMode: 'direct',
    customObjective: 'Optimize the cosine similarity computation using WebAssembly or SIMD intrinsics.',
    rawText: `User:
How can I calculate cosine similarity across high-dimensional vector embeddings in TypeScript with fast batching?

DeepSeek:
<think>
The user wants fast batch cosine similarity in TypeScript.
Cosine similarity formula: dot(A, B) / (norm(A) * norm(B)).
To optimize in TS:
1. Use Float32Array for typed memory buffers.
2. Precompute vector norms so we only do dot products in the inner loop.
3. Loop unrolling or batch matrix dot product.
</think>

Here is an optimized batch cosine similarity implementation using ` + '`Float32Array`' + ` with precomputed norms:

` + '```typescript\n// filepath: src/lib/vectorMath.ts\nexport class VectorIndex {\n  private dimensions: number;\n  private vectors: Float32Array;\n  private norms: Float32Array;\n  private count: number;\n\n  constructor(dimensions: number, capacity: number = 10000) {\n    this.dimensions = dimensions;\n    this.vectors = new Float32Array(capacity * dimensions);\n    this.norms = new Float32Array(capacity);\n    this.count = 0;\n  }\n\n  public addVector(vector: ArrayLike<number>): number {\n    const id = this.count++;\n    const offset = id * this.dimensions;\n    let sumSquares = 0;\n\n    for (let i = 0; i < this.dimensions; i++) {\n      const val = vector[i];\n      this.vectors[offset + i] = val;\n      sumSquares += val * val;\n    }\n\n    this.norms[id] = Math.sqrt(sumSquares) || 1e-10;\n    return id;\n  }\n\n  public queryTopK(queryVec: Float32Array, k: number = 5): { id: number; score: number }[] {\n    let querySumSq = 0;\n    for (let i = 0; i < this.dimensions; i++) {\n      querySumSq += queryVec[i] * queryVec[i];\n    }\n    const queryNorm = Math.sqrt(querySumSq) || 1e-10;\n\n    const results: { id: number; score: number }[] = [];\n    for (let id = 0; id < this.count; id++) {\n      const offset = id * this.dimensions;\n      let dot = 0;\n      for (let i = 0; i < this.dimensions; i++) {\n        dot += queryVec[i] * this.vectors[offset + i];\n      }\n      const similarity = dot / (queryNorm * this.norms[id]);\n      results.push({ id, score: similarity });\n    }\n\n    return results.sort((a, b) => b.score - a.score).slice(0, k);\n  }\n}\n```' + `

Key decisions made:
1. Contiguous typed array storage (` + '`Float32Array`' + `) avoids garbage collection churn.
2. Norms are cached during insertion, reducing query-time operations by half.
`,
  }
];
