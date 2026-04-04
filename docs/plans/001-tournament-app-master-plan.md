# Table Tennis Tournament Manager — Master Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a world-class table tennis tournament management application that starts simple (knockout, round-robin, group-then-knockout) and scales to become the best open-source alternative to Stadium, Bracket, and other platforms — purpose-built for table tennis but extensible to any racquet sport.

**Architecture:** Modern full-stack web app — Next.js (App Router, React Server Components) for the frontend + API, PostgreSQL for data, Prisma as ORM, deployed on Vercel with Edge Functions where latency matters. TypeScript throughout. Mobile-first responsive design.

**Tech Stack:**
- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui components
- Backend: Next.js Server Actions + API Routes, Prisma ORM
- Database: PostgreSQL (Vercel Postgres or Neon)
- Auth: NextAuth.js v5 (email magic links + Google OAuth)
- Real-time: Server-Sent Events (SSE) for live score updates
- Hosting: Vercel (seamless with GitHub, auto-deploys)
- Testing: Vitest (unit), Playwright (E2E)
- Validation: Zod schemas throughout

---

## Competitive Analysis — What We Must Beat

Studied the market leaders:

**Stadium (free, market leader for table tennis):**
- Live self-reported scores, no player accounts needed, Stripe payments
- USATT/Ratings Central/SPINDEX integrations, CSV import
- ELO rating system, match monitoring admin view
- Weaknesses: closed source, limited format customization, no offline mode

**Bracket (open source, multi-sport):**
- Swiss, elimination, round-robin, multiple stages
- Drag-and-drop scheduling, public dashboards
- Weaknesses: not table-tennis-specific, basic UI, no player payments

**What TT organizers actually want (from Reddit/forum research):**
- Taking entries, draw generation, scoring, fixture progression
- Table assignment, time tracking and estimation
- Simple score reporting from phones, live results feed
- Support for groups + knockout (standard TT format)

---

## Tournament Formats (Phase-by-Phase)

### Phase 1 — Simple Formats (MVP)
1. **Single Knockout** — Losers eliminated, winners advance
2. **Round Robin** — Everyone plays everyone, ranked by wins
3. **Double Knockout** — Winners bracket + losers bracket (consolation)
4. **Group Stage → Knockout** — Groups of 4, top 2 advance to knockout

### Phase 2 — Advanced Formats
5. **Swiss System** — Pair by current score, no elimination
6. **Round Robin + Consolation** — Everyone guaranteed N games, top playoff
7. **King of the Table** — Rotating ladder format for casual play

### Phase 3 — League & Rating
8. **League Mode** — Ongoing season with fixture scheduling
9. **ELO/Glicko Rating System** — Auto-ratings based on match results
10. **Player Profiles & Stats** — Win rates, head-to-head, streaks

---

## Implementation Plan

### Phase 1: Foundation & MVP (Tasks 1–20)

---

### Task 1: Initialize Next.js Project with TypeScript

**Objective:** Set up the base Next.js 15 project with TypeScript, Tailwind CSS 4, and basic configuration.

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`

**Step 1: Initialize project**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Verify setup**

```bash
npm run dev
# Expected: Server running at http://localhost:3000
# Open browser, should see default Next.js page
```

**Step 3: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Set Up Database with Prisma + PostgreSQL

**Objective:** Configure Prisma ORM with PostgreSQL connection and create the initial schema.

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env.local` (add to .gitignore, document in .env.example)

**Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npx prisma init
```

**Step 2: Install shadcn/ui component library dependencies**

```bash
npx shadcn@latest init
# Choose: Default, CSS Variables, Slate palette
```

**Step 3: Define initial Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tournament {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        String   // knockout, round-robin, double-knockout, groups-then-knockout
  status      String   @default("draft") // draft, in-progress, completed, cancelled
  startDate   DateTime?
  endDate     DateTime?
  maxPlayers  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  players     Player[]
  matches     Match[]
  groups      Group[]
}

model Player {
  id           String      @id @default(cuid())
  name         String
  email        String?
  phone        String?
  seed         Int?
  tournamentId String
  tournament   Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  group        Group?      @relation(fields: [groupId], references: [id])
  groupId      String?
  createdAt    DateTime    @default(now())

  wins         MatchPlayer[] @relation("MatchPlayerWins")
  matches      MatchPlayer[]
}

model Group {
  id           String   @id @default(cuid())
  name         String   // "Group A", "Group B", etc.
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  players      Player[]

  @@unique([tournamentId, name])
}

model Match {
  id           String   @id @default(cuid())
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  round        Int      // Round number (1 = first round)
  matchNumber  Int      // Match number within the round
  stage        String   @default("main") // main, losers-bracket, playoff

  player1      MatchPlayer? @relation("MatchPlayer1")
  player2      MatchPlayer? @relation("MatchPlayer2")
  
  winnerId     String?
  winnerScore  Int?
  loserScore   Int?
  bestOf       Int      @default(5) // Best of 5 or 7 games
  
  table        String?
  scheduledAt  DateTime?
  startedAt    DateTime?
  completedAt  DateTime?
  status       String   @default("pending") // pending, scheduled, in-progress, completed, walkover

  gameScores   GameScore[]

  @@unique([tournamentId, round, matchNumber, stage])
  @@index([tournamentId, status])
}

model MatchPlayer {
  id        String  @id @default(cuid())
  matchId   String
  match     Match   @relation(fields: [matchId], references: [id], onDelete: Cascade)
  playerId  String
  player    Player  @relation(fields: [playerId], references: [id])

  // Which position in the match (1 or 2)
  position  Int // 1 = top/left, 2 = bottom/right
  isWinner  Boolean @default(false)

  @@unique([matchId, position])

  // Relations for winner/loser tracking
  winningMatches Match[] @relation("MatchPlayerWins")
}

model GameScore {
  id        String @id @default(cuid())
  matchId   String
  match     Match  @relation(fields: [matchId], references: [id], onDelete: Cascade)
  gameNumber Int  // 1, 2, 3, 4, 5, 6, 7
  player1Score Int
  player2Score Int

  @@unique([matchId, gameNumber])
}
```

**Step 4: Push schema to database**

```bash
npx prisma db push
# Expected: Your database is now in sync with your Prisma schema
```

**Step 5: Verify Prisma Studio**

```bash
npx prisma studio
# Expected: Opens Prisma Studio at http://localhost:5555
```

**Step 6: Commit**

```bash
git add prisma/ .env.example .env.local
git commit -m "feat: set up Prisma ORM with PostgreSQL schema for tournaments, players, matches"
```

---

### Task 3: Create Layout, Header, and Basic UI Shell

**Objective:** Build the application shell with header navigation, footer, and responsive layout.

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/layout/page-container.tsx`

**Step 1: Install shadcn/ui components needed**

```bash
npx shadcn@latest add button navigation-menu card separator sheet
```

**Step 2: Create header with navigation**

```tsx
// src/components/layout/header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TT</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">TT Manager</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/tournaments">
            <Button variant="ghost">Tournaments</Button>
          </Link>
          <Link href="/new">
            <Button size="sm">New Tournament</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

**Step 3: Create footer**

```tsx
// src/components/layout/footer.tsx
export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          Open-source table tennis tournament manager
        </p>
      </div>
    </footer>
  );
}
```

**Step 4: Create page container**

```tsx
// src/components/layout/page-container.tsx
export function PageContainer({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {(title || description) && (
        <div className="mb-8">
          {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
```

**Step 5: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TT Manager — Table Tennis Tournament Management",
  description: "Create, manage, and run table tennis tournaments with ease. Free and open source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

**Step 6: Verify**

```bash
npm run dev
# Open http://localhost:3000 — should see header, footer, centered content
```

**Step 7: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx
git commit -m "feat: add application shell with header, footer, page container"
```

---

### Task 4: Set Up Authentication with NextAuth v5

**Objective:** Add authentication via email magic links so tournament organizers can create and manage events.

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Create: `src/components/auth/sign-in-form.tsx`

**Step 1: Install NextAuth**

```bash
npm install next-auth@beta @auth/prisma-adapter
npx prisma migrate dev --name add-auth-models
```

**Step 2: Add auth models to Prisma schema**

Add these to `prisma/schema.prisma`:
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  tournaments   Tournament[] @relation("UserTournaments")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}
```

**Step 3: Create auth config**

```ts
// src/lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
});
```

**Step 4: Create auth route handler**

```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

**Step 5: Add environment variables to .env.example**

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate-with-openssl"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ prisma/schema.prisma .env.example
git commit -m "feat: add NextAuth v5 with Google and Resend email providers"
```

---

### Task 5: Create Tournament Creation Form

**Objective:** Build a form to create new tournaments with name, description, format, and settings.

**Files:**
- Create: `src/app/new/page.tsx`
- Create: `src/components/tournaments/create-tournament-form.tsx`
- Create: `src/lib/tournament-actions.ts` (Server Actions)
- Modify: `prisma/schema.prisma` (add owner relation)

**Step 1: Add owner relation to Tournament model**

```prisma
// Add to Tournament model:
ownerId     String?
owner       User?   @relation("UserTournaments", fields: [ownerId], references: [id])
```

**Step 2: Install shadcn components**

```bash
npx shadcn@latest add input label select textarea radio-group
```

**Step 3: Create the form component**

```tsx
// src/components/tournaments/create-tournament-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/tournament-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const FORMATS = [
  { value: "knockout", label: "Single Knockout", desc: "Lose and you're out. Simple and fast." },
  { value: "round-robin", label: "Round Robin", desc: "Everyone plays everyone. Fair and complete." },
  { value: "double-knockout", label: "Double Knockout", desc: "Winners + losers bracket. Second chance." },
  { value: "groups-then-knockout", label: "Groups + Knockout", desc: "Group stage then knockout playoffs." },
];

export function CreateTournamentForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTournament(formData);
      if (result.success && result.tournamentId) {
        router.push(`/tournaments/${result.tournamentId}`);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="name">Tournament Name</Label>
        <Input id="name" name="name" required placeholder="e.g. Ormeau Club Championship" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="Details about the tournament..." />
      </div>

      <div className="space-y-3">
        <Label>Format</Label>
        <RadioGroup name="type" defaultValue="knockout" required>
          {FORMATS.map((f) => (
            <div key={f.value} className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value={f.value} id={f.value} />
              <div>
                <Label htmlFor={f.value} className="font-medium">{f.label}</Label>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxPlayers">Max Players (optional)</Label>
        <Input id="maxPlayers" name="maxPlayers" type="number" min="2" placeholder="No limit" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating..." : "Create Tournament"}
      </Button>
    </form>
  );
}
```

**Step 4: Create Server Action**

```ts
// src/lib/tournament-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tournamentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["knockout", "round-robin", "double-knockout", "groups-then-knockout"]),
  maxPlayers: z.coerce.number().int().min(2).nullable(),
  ownerId: z.string(),
});

export async function createTournament(formData: FormData) {
  const data = tournamentSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    maxPlayers: formData.get("maxPlayers") ? Number(formData.get("maxPlayers")) : null,
    ownerId: formData.get("ownerId"),
  });

  const tournament = await prisma.tournament.create({
    data,
  });

  revalidatePath("/tournaments");
  return { success: true, tournamentId: tournament.id };
}
```

**Step 5: Create page**

```tsx
// src/app/new/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { CreateTournamentForm } from "@/components/tournaments/create-tournament-form";

export default async function NewTournamentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <PageContainer title="New Tournament" description="Set up your table tennis tournament.">
      <CreateTournamentForm userId={session.user.id} />
    </PageContainer>
  );
}
```

**Step 6: Commit**

```bash
git add src/app/new/ src/components/tournaments/ src/lib/tournament-actions.ts
git commit -m "feat: add tournament creation form with Server Actions and Zod validation"
```

---

### Task 6: Build Player Registration System

**Objective:** Allow organizers to add players individually or via CSV bulk upload.

**Files:**
- Create: `src/components/players/add-player-form.tsx`
- Create: `src/components/players/csv-upload.tsx`
- Create: `src/components/players/player-list.tsx`
- Create: `src/lib/player-actions.ts`
- Modify: `src/app/tournaments/[id]/page.tsx`

**Step 1: Install CSV parsing**

```bash
npm install papaparse @types/papaparse
```

**Step 2: Create player actions**

```ts
// src/lib/player-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const playerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  seed: z.coerce.number().int().min(1).nullable(),
  tournamentId: z.string(),
  groupId: z.string().nullable(),
});

export async function addPlayer(formData: FormData) {
  const data = playerSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    seed: formData.get("seed") ? Number(formData.get("seed")) : null,
    tournamentId: formData.get("tournamentId"),
    groupId: formData.get("groupId") || null,
  });

  await prisma.player.create({ data });
  revalidatePath(`/tournaments/${data.tournamentId}`);
  return { success: true };
}

export async function addPlayersBulk(players: { name: string; email?: string; phone?: string; seed?: number }[], tournamentId: string) {
  // Check max players
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { maxPlayers: true },
  });

  const currentCount = await prisma.player.count({ where: { tournamentId } });
  if (tournament?.maxPlayers && currentCount + players.length > tournament.maxPlayers) {
    return { success: false, error: "Would exceed max players" };
  }

  await prisma.player.createMany({
    data: players.map((p) => ({
      ...p,
      tournamentId,
      seed: p.seed ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
    })),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function removePlayer(playerId: string, tournamentId: string) {
  await prisma.player.delete({ where: { id: playerId } });
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}
```

**Step 3: Create CSV upload component**

```tsx
// src/components/players/csv-upload.tsx
"use client";

import { useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { addPlayersBulk } from "@/lib/player-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CsvUpload({ tournamentId }: { tournamentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [parsedData, setParsedData] = useState<{name: string; email?: string; phone?: string}[]>([]);
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    onDrop: (files) => {
      Papa.parse(files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const players = results.data
            .filter((row: any) => row.name?.trim())
            .map((row: any) => ({
              name: row.name.trim(),
              email: row.email?.trim() || undefined,
              phone: row.phone?.trim() || undefined,
            }));
          setParsedData(players);
        },
      });
    },
  });

  async function handleUpload() {
    setUploading(true);
    await addPlayersBulk(parsedData, tournamentId);
    setUploading(false);
    setParsedData([]);
  }

  // ... render dropzone, preview table, upload button
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Add Players</CardTitle>
        <CardDescription>Upload a CSV with columns: name, email, phone</CardDescription>
      </CardHeader>
      <CardContent>
        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary">
          <input {...getInputProps()} />
          {isDragActive ? "Drop the file here" : parsedData.length > 0
            ? `${parsedData.length} players loaded`
            : "Drag & drop CSV here, or click to select"}
        </div>
        {parsedData.length > 0 && (
          <Button onClick={handleUpload} disabled={uploading} className="mt-4">
            Upload {parsedData.length} Players
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/players/ src/lib/player-actions.ts
git commit -m "feat: add player registration with individual form and CSV bulk upload"
```

---

### Task 7: Implement Knockout Draw Generator

**Objective:** Generate a single-elimination bracket from the registered players, with seeding logic and bye handling.

**Files:**
- Create: `src/lib/draws/knockout.ts`
- Create: `src/lib/draws/index.ts`
- Create: `src/lib/draws/types.ts`

**Step 1: Define draw types**

```ts
// src/lib/draws/types.ts
export interface DrawPlayer {
  id: string;
  name: string;
  seed?: number;
}

export interface DrawMatch {
  id: string;
  round: number;
  matchNumber: number;
  player1: { id: string; name: string } | null;
  player2: { id: string; name: string } | null;
  stage?: "main" | "losers-bracket" | "playoff";
}

export interface GeneratedDraw {
  matches: DrawMatch[];
  rounds: number;
}
```

**Step 2: Implement knockout draw algorithm**

```ts
// src/lib/draws/knockout.ts
import type { DrawPlayer, GeneratedDraw } from "./types";

export function generateKnockoutDraw(players: DrawPlayer[]): GeneratedDraw {
  // Sort by seed (unseeded go to bottom)
  const seeded = players.filter(p => p.seed != null).sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
  const unseeded = players.filter(p => p.seed == null).sort(() => Math.random() - 0.5);
  const allPlayers = [...seeded, ...unseeded];

  // Calculate bracket size (next power of 2)
  const n = allPlayers.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const rounds = Math.log2(bracketSize);
  const byes = bracketSize - n;

  // Create seeded positions for classic bracket
  const positions = generateSeededPositions(bracketSize);

  // Fill bracket
  const bracket: (DrawPlayer | null)[] = new Array(bracketSize).fill(null);
  allPlayers.forEach((player, i) => {
    bracket[positions[i]] = player;
  });

  // Generate first round matches
  const matches: GeneratedDraw["matches"] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = bracket[i * 2];
    const p2 = bracket[i * 2 + 1];
    matches.push({
      id: `r1-m${i + 1}`,
      round: 1,
      matchNumber: i + 1,
      player1: p1 ? { id: p1.id, name: p1.name } : null,
      player2: p2 ? { id: p2.id, name: p2.name } : null,
      stage: "main",
    });
  }

  // Generate empty slots for remaining rounds
  let matchesInRound = bracketSize / 4;
  for (let round = 2; round <= rounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `r${round}-m${i + 1}`,
        round,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        stage: "main",
      });
    }
    matchesInRound = Math.floor(matchesInRound / 2);
  }

  return { matches, rounds };
}

// Classic seeding: 1v2, 3v4, etc. for proper bracket structure
function generateSeededPositions(size: number): number[] {
  if (size === 2) return [0, 1];
  const half = generateSeededPositions(size / 2);
  const result: number[] = [];
  for (const pos of half) {
    result.push(pos * 2);
    result.push(size - 1 - pos * 2);
  }
  return result;
}
```

**Step 3: Create draw generator entry point**

```ts
// src/lib/draws/index.ts
import type { DrawPlayer, GeneratedDraw } from "./types";
import { generateKnockoutDraw } from "./knockout";

export type { DrawPlayer, GeneratedDraw };

export function generateDraw(type: "knockout" | "round-robin" | "double-knockout" | "groups-then-knockout", players: DrawPlayer[]): GeneratedDraw {
  switch (type) {
    case "knockout":
      return generateKnockoutDraw(players);
    default:
      throw new Error(`Draw generation for "${type}" not yet implemented`);
  }
}
```

**Step 4: Write tests**

```ts
// src/lib/draws/__tests__/knockout.test.ts
import { describe, it, expect } from "vitest";
import { generateKnockoutDraw } from "../knockout";

describe("knockout draw", () => {
  it("generates correct bracket for 4 players", () => {
    const players = [
      { id: "1", name: "A", seed: 1 },
      { id: "2", name: "B", seed: 2 },
      { id: "3", name: "C", seed: 3 },
      { id: "4", name: "D", seed: 4 },
    ];
    const draw = generateKnockoutDraw(players);
    expect(draw.rounds).toBe(2);
    expect(draw.matches).toHaveLength(3); // 2 first round + 1 final
    // Seed 1 should play seed 4, seed 2 should play seed 3
    const firstRound = draw.matches.filter(m => m.round === 1);
    expect(firstRound).toHaveLength(2);
  });

  it("handles byes for non-power-of-2 players", () => {
    const players = [
      { id: "1", name: "A", seed: 1 },
      { id: "2", name: "B", seed: 2 },
      { id: "3", name: "C" },
    ];
    const draw = generateKnockoutDraw(players);
    expect(draw.rounds).toBe(2);
    expect(draw.matches).toHaveLength(3);
    // Top seed should get a bye (one match has null player2)
    const firstRound = draw.matches.filter(m => m.round === 1);
    const hasBye = firstRound.some(m => m.player1 === null || m.player2 === null);
    expect(hasBye).toBe(true);
  });
});
```

**Step 5: Run tests**

```bash
npm install -D vitest
npx vitest run
# Expected: 2 passing
```

**Step 6: Commit**

```bash
git add src/lib/draws/
git commit -m "feat: implement knockout draw generator with seeding and bye handling"
```

---

### Task 8: Implement Round Robin Draw Generator

**Objective:** Generate a round-robin schedule where every player plays every other player exactly once.

**Files:**
- Create: `src/lib/draws/round-robin.ts`

**Step 1: Implement the round-robin algorithm (circle method)**

```ts
// src/lib/draws/round-robin.ts
import type { DrawPlayer, GeneratedDraw } from "./types";

export function generateRoundRobinDraw(players: DrawPlayer[]): GeneratedDraw {
  const n = players.length;
  if (n < 2) throw new Error("Need at least 2 players");

  const isOdd = n % 2 !== 0;
  const playerList = isOdd ? [...players, { id: "BYE", name: "BYE" }] : [...players];
  const size = playerList.length;
  const rounds = size - 1;
  const matchesPerRound = size / 2;

  const matches: GeneratedDraw["matches"] = [];

  // Circle method: fix first player, rotate rest
  const rotating = playerList.slice(1);

  for (let round = 0; round < rounds; round++) {
    const list = [playerList[0], ...rotating];

    for (let match = 0; match < matchesPerRound; match++) {
      const p1 = list[match];
      const p2 = list[size - 1 - match];

      // Skip BYE matches
      if (p1.id === "BYE" || p2.id === "BYE") continue;

      matches.push({
        id: `r${round + 1}-m${match + 1}`,
        round: round + 1,
        matchNumber: match + 1,
        player1: { id: p1.id, name: p1.name },
        player2: { id: p2.id, name: p2.name },
        stage: "main",
      });
    }

    // Rotate
    rotating.push(rotating.shift()!);
  }

  return { matches, rounds };
}
```

**Step 2: Add tests**

```ts
// src/lib/draws/__tests__/round-robin.test.ts
import { describe, it, expect } from "vitest";
import { generateRoundRobinDraw } from "../round-robin";

describe("round robin draw", () => {
  it("generates correct schedule for 4 players (6 matches, 3 rounds)", () => {
    const players = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
      { id: "4", name: "D" },
    ];
    const draw = generateRoundRobinDraw(players);
    expect(draw.rounds).toBe(3);
    expect(draw.matches).toHaveLength(6); // 4 * 3 / 2 = 6

    // Every player plays every other player exactly once
    const pairs = new Set(draw.matches.map(m => {
      const ids = [m.player1!.id, m.player2!.id].sort();
      return ids.join("-");
    }));
    expect(pairs.size).toBe(6);
    expect(pairs.has("1-2")).toBe(true);
    expect(pairs.has("1-3")).toBe(true);
    expect(pairs.has("1-4")).toBe(true);
    expect(pairs.has("2-3")).toBe(true);
    expect(pairs.has("2-4")).toBe(true);
    expect(pairs.has("3-4")).toBe(true);
  });

  it("handles odd number of players (one rest per round)", () => {
    const players = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
    ];
    const draw = generateRoundRobinDraw(players);
    expect(draw.rounds).toBe(2);
    expect(draw.matches).toHaveLength(3); // 3 players, 2 rounds, 1 match per round + BYE
  });
});
```

**Step 3: Update draw index**

```ts
// Add to src/lib/draws/index.ts
import { generateRoundRobinDraw } from "./round-robin";

// In switch statement:
case "round-robin":
  return generateRoundRobinDraw(players);
```

**Step 4: Run tests**

```bash
npx vitest run
# Expected: 4 passing (2 knockout + 2 round-robin)
```

**Step 5: Commit**

```bash
git add src/lib/draws/
git commit -m "feat: implement round-robin draw generator with circle method"
```

---

### Task 9: Implement Double Knockout Draw Generator

**Objective:** Generate winners bracket + losers bracket for double elimination tournaments.

**Files:**
- Create: `src/lib/draws/double-knockout.ts`

**Step 1: Implement double elimination algorithm**

```ts
// src/lib/draws/double-knockout.ts
import type { DrawPlayer, GeneratedDraw } from "./types";
import { generateKnockoutDraw } from "./knockout";

export function generateDoubleKnockoutDraw(players: DrawPlayer[]): GeneratedDraw {
  // Generate the main (winners) bracket first
  const winnersBracket = generateKnockoutDraw(players);
  const matches: GeneratedDraw["matches"] = [];

  // Copy all winners bracket matches
  winnersBracket.matches.forEach(m => {
    matches.push({ ...m, stage: "main" });
  });

  // Generate losers bracket
  // Each round in losers bracket has approximately 2x the matches of the corresponding winners round
  const totalWinnersRounds = winnersBracket.rounds;
  
  for (let round = 1; round < totalWinnersRounds; round++) {
    const winnersMatches = winnersBracket.matches.filter(m => m.round === round);
    const losersMatchesCount = winnersMatches.length - 1;
    
    // Losers bracket round structure:
    // Round 1: No losers yet
    // Round 2+: Losers of winners round N play in losers bracket
    for (let i = 0; i < losersMatchesCount; i++) {
      matches.push({
        id: `lb-r${round}-m${i + 1}`,
        round: round,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        stage: "losers-bracket",
      });
    }
  }

  // Grand final: winners bracket winner vs losers bracket winner
  matches.push({
    id: "grand-final",
    round: totalWinnersRounds + 1,
    matchNumber: 1,
    player1: null,
    player2: null,
    stage: "playoff",
  });

  // Possible second grand final (if losers bracket winner wins first)
  matches.push({
    id: "grand-final-2",
    round: totalWinnersRounds + 1,
    matchNumber: 2,
    player1: null,
    player2: null,
    stage: "playoff",
  });

  return { matches, rounds: totalWinnersRounds + 1 };
}
```

**Step 2: Add basic test**

```ts
// src/lib/draws/__tests__/double-knockout.test.ts
import { describe, it, expect } from "vitest";
import { generateDoubleKnockoutDraw } from "../double-knockout";

describe("double knockout draw", () => {
  it("has winners bracket, losers bracket, and grand final", () => {
    const players = [
      { id: "1", name: "A", seed: 1 },
      { id: "2", name: "B", seed: 2 },
      { id: "3", name: "C", seed: 3 },
      { id: "4", name: "D", seed: 4 },
    ];
    const draw = generateDoubleKnockoutDraw(players);
    
    const mainMatches = draw.matches.filter(m => m.stage === "main");
    const losersMatches = draw.matches.filter(m => m.stage === "losers-bracket");
    const playoffMatches = draw.matches.filter(m => m.stage === "playoff");
    
    expect(mainMatches.length).toBeGreaterThan(0);
    expect(losersMatches.length).toBeGreaterThan(0);
    expect(playoffMatches).toHaveLength(2); // Grand final + possible rematch
  });
});
```

**Step 3: Update draw index and run tests**

```bash
npx vitest run
# Expected: 5 passing
```

**Step 4: Commit**

```bash
git add src/lib/draws/
git commit -m "feat: implement double knockout draw generator with winners/losers brackets"
```

---

### Task 10: Build the Tournament Dashboard Page

**Objective:** Create the main tournament detail page showing brackets, player list, and match schedule.

**Files:**
- Create: `src/app/tournaments/[id]/page.tsx`
- Create: `src/components/tournaments/tournament-header.tsx`
- Create: `src/components/tournaments/bracket-view.tsx`

**Step 1: Create server-side data fetcher**

```ts
// src/lib/tournament-queries.ts
import { prisma } from "@/lib/prisma";

export async function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      players: { orderBy: { seed: "asc" }, include: { group: true } },
      matches: { orderBy: [{ round: "asc" }, { matchNumber: "asc" }] },
      groups: { orderBy: { name: "asc" } },
    },
  });
}
```

**Step 2: Create tournament page**

```tsx
// src/app/tournaments/[id]/page.tsx
import { getTournament } from "@/lib/tournament-queries";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { TournamentHeader } from "@/components/tournaments/tournament-header";
import { BracketView } from "@/components/tournaments/bracket-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  return (
    <PageContainer>
      <TournamentHeader tournament={tournament} />
      <Tabs defaultValue="bracket" className="mt-6">
        <TabsList>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="players">Players ({tournament.players.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="bracket" className="mt-4">
          <BracketView tournament={tournament} />
        </TabsContent>
        <TabsContent value="players" className="mt-4">
          {/* Player list component */}
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          {/* Schedule component */}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
```

**Step 3: Create bracket visualization**

```tsx
// src/components/tournaments/bracket-view.tsx
import { type Tournament, type Match, type Player } from "@prisma/client";
import { Card } from "@/components/ui/card";

type TournamentWithDetails = Tournament & {
  matches: Match[];
  players: Player[];
};

export function BracketView({ tournament }: { tournament: TournamentWithDetails }) {
  const rounds = Array.from(new Set(tournament.matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {rounds.map(round => (
          <div key={round} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-center mb-2">Round {round}</h3>
            {tournament.matches
              .filter(m => m.round === round)
              .map(match => (
                <Card key={match.id} className="w-64 p-3">
                  <div className="space-y-2">
                    <MatchPlayerSlot player={match.player1} isWinner={false} />
                    <div className="h-px bg-border" />
                    <MatchPlayerSlot player={match.player2} isWinner={false} />
                  </div>
                  {match.status === "completed" && match.winnerScore != null && (
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      {match.winnerScore} - {match.loserScore}
                    </div>
                  )}
                </Card>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchPlayerSlot({ player, isWinner }: { player: any; isWinner: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 ${isWinner ? "font-bold" : ""}`}>
      <span>{player?.name || "TBD"}</span>
    </div>
  );
}
```

**Step 4: Install tabs component**

```bash
npx shadcn@latest add tabs
```

**Step 5: Commit**

```bash
git add src/app/tournaments/[id]/ src/components/tournaments/
git commit -m "feat: build tournament dashboard with bracket visualization and tabs"
```

---

### Task 11: Build Match Scoring Interface

**Objective:** Create the UI for entering match scores game-by-game (e.g., 11-9, 7-11, 11-5).

**Files:**
- Create: `src/components/matches/scoring-interface.tsx`
- Create: `src/lib/match-actions.ts`

**Step 1: Create match actions**

```ts
// src/lib/match-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const scoreSchema = z.object({
  matchId: z.string(),
  gameScores: z.array(z.object({
    gameNumber: z.number(),
    player1Score: z.number(),
    player2Score: z.number(),
  })),
});

export async function submitMatchScore(matchId: string, gameScores: { gameNumber: number; player1Score: number; player2Score: number }[]) {
  if (gameScores.length === 0) return { success: false, error: "No game scores provided" };

  // Calculate winner
  let player1Wins = 0;
  let player2Wins = 0;

  for (const game of gameScores) {
    if (game.player1Score > game.player2Score) player1Wins++;
    else player2Wins++;
  }

  if (player1Wins === player2Wins) {
    return { success: false, error: "Match must have a winner" };
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { player1: true, player2: true },
  });

  if (!match || !match.player1 || !match.player2) {
    return { success: false, error: "Match not found or incomplete" };
  }

  const winnerId = player1Wins > player2Wins ? match.player1.playerId : match.player2.playerId;

  await prisma.$transaction(async (tx) => {
    // Delete existing game scores
    await tx.gameScore.deleteMany({ where: { matchId } });

    // Insert new game scores
    await tx.gameScore.createMany({
      data: gameScores.map(g => ({
        matchId,
        gameNumber: g.gameNumber,
        player1Score: g.player1Score,
        player2Score: g.player2Score,
      })),
    });

    // Update match
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "completed",
        completedAt: new Date(),
        winnerId: match.winnerId || winnerId,
        winnerScore: Math.max(player1Wins, player2Wins),
        loserScore: Math.min(player1Wins, player2Wins),
      },
    });

    // Update MatchPlayer isWinner
    await tx.matchPlayer.updateMany({
      where: { matchId, playerId: winnerId },
      data: { isWinner: true },
    });
  });

  // Advance winner to next match
  await advanceWinner(match.id, winnerId);

  revalidatePath(`/tournaments/${match.tournamentId}`);
  return { success: true };
}

async function advanceWinner(matchId: string, winnerPlayerId: string) {
  // Find next match that should receive this winner
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true, round: true, matchNumber: true, stage: true },
  });

  if (!match) return;

  const nextRound = match.round + 1;
  const nextMatchNumber = Math.ceil(match.matchNumber / 2);

  const nextMatch = await prisma.match.findFirst({
    where: {
      tournamentId: match.tournamentId,
      round: nextRound,
      matchNumber: nextMatchNumber,
      stage: match.stage,
    },
    include: { player1: true, player2: true },
  });

  if (!nextMatch) return;

  const winner = await prisma.player.findUnique({
    where: { id: winnerPlayerId },
    select: { id: true, name: true },
  });

  if (!winner) return;

  // Assign to next match (determine position based on current match number being even/odd)
  const position = match.matchNumber % 2 === 1 ? 1 : 2;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.matchPlayer.findFirst({
      where: { matchId: nextMatch.id, position },
    });

    if (existing) {
      await tx.matchPlayer.update({
        where: { id: existing.id },
        data: { playerId: winnerPlayerId },
      });
    } else {
      await tx.matchPlayer.create({
        data: {
          matchId: nextMatch.id,
          playerId: winnerPlayerId,
          position,
        },
      });
    }
  });
}
```

**Step 2: Create scoring UI**

```tsx
// src/components/matches/scoring-interface.tsx
"use client";

import { useState, useTransition } from "react";
import { submitMatchScore } from "@/lib/match-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface MatchWithDetails {
  id: string;
  player1: { name: string } | null;
  player2: { name: string } | null;
  bestOf: number;
  status: string;
}

export function ScoringInterface({ match }: { match: MatchWithDetails }) {
  const [games, setGames] = useState<{ player1Score: string; player2Score: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  const gamesNeeded = Math.ceil(match.bestOf / 2);

  function addGame() {
    setGames(prev => [...prev, { player1Score: "", player2Score: "" }]);
  }

  function removeGame(index: number) {
    setGames(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const parsed = games.map((g, i) => ({
      gameNumber: i + 1,
      player1Score: parseInt(g.player1Score),
      player2Score: parseInt(g.player2Score),
    }));

    if (parsed.some(g => isNaN(g.player1Score) || isNaN(g.player2Score))) {
      alert("Please enter valid scores for all games");
      return;
    }

    startTransition(async () => {
      await submitMatchScore(match.id, parsed);
    });
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold">{match.player1?.name || "TBD"}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="font-semibold">{match.player2?.name || "TBD"}</span>
      </div>

      {games.map((game, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground w-12">Game {i + 1}</span>
          <Input
            type="number"
            min="0"
            max="99"
            value={game.player1Score}
            onChange={(e) => {
              const updated = [...games];
              updated[i].player1Score = e.target.value;
              setGames(updated);
            }}
            className="w-16 text-center"
            placeholder="-"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            min="0"
            max="99"
            value={game.player2Score}
            onChange={(e) => {
              const updated = [...games];
              updated[i].player2Score = e.target.value;
              setGames(updated);
            }}
            className="w-16 text-center"
            placeholder="-"
          />
          <Button variant="ghost" size="sm" onClick={() => removeGame(i)}>x</Button>
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <Button variant="outline" onClick={addGame} size="sm">+ Add Game</Button>
        <Button onClick={handleSubmit} disabled={isPending || games.length === 0}>
          Submit Score
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Best of {match.bestOf} — First to {gamesNeeded} games wins
      </p>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/matches/ src/lib/match-actions.ts
git commit -m "feat: build match scoring interface with game-by-game input and auto-advance winner"
```

---

### Task 12: Build Tournament List Page

**Objective:** Create the main page showing all tournaments with status badges and quick actions.

**Files:**
- Create: `src/app/tournaments/page.tsx`
- Create: `src/components/tournaments/tournament-card.tsx`
- Create: `src/app/tournaments/loading.tsx`

**Step 1: Create tournament list page**

```tsx
// src/app/tournaments/page.tsx
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/layout/page-container";
import { TournamentCard } from "@/components/tournaments/tournament-card";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { players: true, matches: true } } },
  });

  return (
    <PageContainer title="Tournaments" description="All your table tennis tournaments.">
      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">No tournaments yet</p>
          <a href="/new" className="text-blue-600 hover:underline">Create your first tournament</a>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map(t => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
```

**Step 2: Create tournament card**

```tsx
// src/components/tournaments/tournament-card.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function TournamentCard({ tournament }: { tournament: any }) {
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg truncate">{tournament.name}</CardTitle>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[tournament.status]}`}>
              {tournament.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {tournament._count.players} players · {tournament._count.matches} matches
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(tournament.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 3: Update header nav to link correctly**

```tsx
// In src/components/layout/header.tsx, change:
<Link href="/tournaments">
  <Button variant="ghost">Tournaments</Button>
</Link>
```

**Step 4: Commit**

```bash
git add src/app/tournaments/ src/components/tournaments/
git commit -m "feat: build tournament list page with cards and loading state"
```

---

### Task 13: Add Tournament Status Management

**Objective:** Allow organizers to change tournament status (draft -> in-progress -> completed) and generate the bracket when ready.

**Files:**
- Create: `src/components/tournaments/tournament-actions-bar.tsx`
- Modify: `src/lib/tournament-actions.ts` (add status change + generate draw)

**Step 1: Add generate draw server action**

```ts
// Add to src/lib/tournament-actions.ts
export async function generateTournamentDraw(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: { orderBy: { seed: "asc" } } },
  });

  if (!tournament || tournament.players.length < 2) {
    return { success: false, error: "Need at least 2 players" };
  }

  const draw = generateDraw(tournament.type as any, tournament.players.map(p => ({
    id: p.id,
    name: p.name,
    seed: p.seed ?? undefined,
  })));

  await prisma.$transaction(async (tx) => {
    // Clear existing matches
    await tx.match.deleteMany({ where: { tournamentId } });

    // Create new matches
    for (const m of draw.matches) {
      const match = await tx.match.create({
        data: {
          tournamentId,
          round: m.round,
          matchNumber: m.matchNumber,
          stage: m.stage,
          player1: m.player1 ? {
            create: {
              playerId: m.player1.id,
              position: 1,
            },
          } : undefined,
          player2: m.player2 ? {
            create: {
              playerId: m.player2.id,
              position: 2,
            },
          } : undefined,
        },
      });
    }

    // Update status
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: "in-progress" },
    });
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}
```

**Step 2: Create actions bar**

```tsx
// src/components/tournaments/tournament-actions-bar.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateTournamentDraw } from "@/lib/tournament-actions";
import { Button } from "@/components/ui/button";

export function TournamentActionBar({ tournamentId, status, playerCount }: {
  tournamentId: string;
  status: string;
  playerCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (status !== "draft") return null;

  return (
    <div className="flex gap-2 mb-6">
      <Button
        onClick={() => startTransition(async () => {
          await generateTournamentDraw(tournamentId);
          router.refresh();
        })}
        disabled={isPending || playerCount < 2}
      >
        {isPending ? "Generating..." : "Generate Draw & Start Tournament"}
      </Button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/tournaments/tournament-actions-bar.tsx src/lib/tournament-actions.ts
git commit -m "feat: add tournament status management and draw generation trigger"
```

---

### Task 14: Implement Group Stage + Knockout Format

**Objective:** Generate group stages (round robin) followed by knockout playoffs for top-placed players.

**Files:**
- Create: `src/lib/draws/groups-then-knockout.ts`

**Step 1: Implement the algorithm**

```ts
// src/lib/draws/groups-then-knockout.ts
import type { DrawPlayer, GeneratedDraw } from "./types";
import { generateRoundRobinDraw } from "./round-robin";
import { generateKnockoutDraw } from "./knockout";

export function generateGroupsThenKnockoutDraw(
  players: DrawPlayer[],
  options: { numGroups?: number; advancePerGroup?: number } = {}
): GeneratedDraw {
  const numGroups = options.numGroups || Math.max(2, Math.ceil(players.length / 4));
  const advancePerGroup = options.advancePerGroup || 2;

  // Create groups by distributing players
  const groups: { name: string; players: DrawPlayer[] }[] = [];
  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];
  
  // Sort by seed first
  const sorted = [...players].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
  
  for (let i = 0; i < numGroups; i++) {
    groups.push({ name: `Group ${groupNames[i]}`, players: [] });
  }

  // Distribute players using serpentine seeding
  sorted.forEach((player, index) => {
    const groupIndex = index % numGroups;
    // Alternate direction for serpentine
    const targetGroup = groupIndex % 2 === 0 ? groupIndex : numGroups - 1 - groupIndex;
    groups[targetGroup].players.push(player);
  });

  const matches: GeneratedDraw["matches"] = [];

  // Generate round robin for each group
  groups.forEach(group => {
    if (group.players.length < 2) return;
    const groupDraw = generateRoundRobinDraw(group.players);
    groupDraw.matches.forEach(m => {
      matches.push({
        ...m,
        id: `${group.name}-${m.id}`,
        stage: group.name, // Use group name as stage
      });
    });
  });

  // Calculate how many knockout matches we'll need
  const knockoutPlayers = numGroups * advancePerGroup;
  if (knockoutPlayers >= 2) {
    const knockoutDraw = generateKnockoutDraw(
      Array(knockoutPlayers).fill(null).map((_, i) => ({
        id: `ko-slot-${i}`,
        name: `TBD`,
      }))
    );
    knockoutDraw.matches.forEach(m => {
      matches.push({
        ...m,
        id: `ko-${m.id}`,
        stage: "knockout",
      });
    });
  }

  return { matches, rounds: 0 }; // Rounds are per-group, we'll compute separately
}
```

**Step 2: Update draw index**

```ts
// Add to switch in src/lib/draws/index.ts
case "groups-then-knockout":
  return generateGroupsThenKnockoutDraw(players);
```

**Step 3: Add tests**

```ts
// src/lib/draws/__tests__/groups-then-knockout.test.ts
import { describe, it, expect } from "vitest";
import { generateGroupsThenKnockoutDraw } from "../groups-then-knockout";

describe("groups then knockout", () => {
  it("creates 2 groups of 4 with knockout for 16 players", () => {
    const players = Array.from({ length: 16 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Player ${i + 1}`,
      seed: i + 1,
    }));
    
    const draw = generateGroupsThenKnockoutDraw(players, { numGroups: 2 });
    
    // Should have group stage matches and knockout matches
    const groupMatches = draw.matches.filter(m => m.stage.startsWith("Group"));
    const knockoutMatches = draw.matches.filter(m => m.stage === "knockout");
    
    expect(groupMatches.length).toBeGreaterThan(0);
    expect(knockoutMatches.length).toBeGreaterThan(0);
  });
});
```

**Step 4: Run tests**

```bash
npx vitest run
# Expected: 6 passing
```

**Step 5: Commit**

```bash
git add src/lib/draws/
git commit -m "feat: implement groups + knockout format with serpentine seeding"
```

---

### Task 15: Build Public Tournament View (No Login Required)

**Objective:** Create a read-only view for spectators to follow live results.

**Files:**
- Create: `src/app/tournaments/[id]/public/page.tsx`
- Create: `src/components/tournaments/live-board.tsx`

**Step 1: Create public page**

```tsx
// src/app/tournaments/[id]/public/page.tsx
import { getTournament } from "@/lib/tournament-queries";
import { notFound } from "next/navigation";
import { LiveBoard } from "@/components/tournaments/live-board";

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  return <LiveBoard tournament={tournament} />;
}
```

**Step 2: Create live board**

```tsx
// src/components/tournaments/live-board.tsx
export function LiveBoard({ tournament }: { tournament: any }) {
  const liveMatches = tournament.matches.filter(m => m.status === "in-progress" || m.status === "scheduled");
  const completedMatches = tournament.matches.filter(m => m.status === "completed");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{tournament.name}</h1>
      <p className="text-muted-foreground mb-6">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
        Live
      </p>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Live Matches</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {liveMatches.map(match => (
              <div key={match.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{match.player1?.player?.name || "TBD"}</span>
                  <span className="text-sm text-muted-foreground">vs</span>
                  <span className="font-medium">{match.player2?.player?.name || "TBD"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Results</h2>
        <div className="space-y-2">
          {completedMatches.map(match => (
            <div key={match.id} className="flex justify-between items-center py-2 border-b">
              <span>R{match.round} — M{match.matchNumber}</span>
              <span>{match.winnerScore} - {match.loserScore}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/tournaments/[id]/public/ src/components/tournaments/live-board.tsx
git commit -m "feat: add public live scoreboard for tournament spectators"
```

---

### Task 16: Add Real-Time Score Updates via SSE

**Objective:** Push live score updates to the public board without page refreshes.

**Files:**
- Create: `src/app/api/tournaments/[id]/live/route.ts`
- Create: `src/lib/sse.ts`
- Modify: `src/components/tournaments/live-board.tsx`

**Step 1: Create SSE endpoint**

```ts
// src/app/api/tournaments/[id]/live/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encoder = new TextEncoder();
  let lastEventId = request.headers.get("last-event-id") || "0";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`));

      const sendUpdate = async () => {
        const matches = await prisma.match.findMany({
          where: { tournamentId: id },
          include: {
            player1: { include: { player: true } },
            player2: { include: { player: true } },
            gameScores: true,
          },
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        });

        const data = JSON.stringify({ type: "update", matches, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`id: ${Date.now()}\ndata: ${data}\n\n`));
      };

      // Initial send
      await sendUpdate();

      // Poll every 3 seconds (replace with real-time later)
      const interval = setInterval(sendUpdate, 3000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 2: Update live board with SSE**

```tsx
// Wrap in "use client" and add:
useEffect(() => {
  const eventSource = new EventSource(`/api/tournaments/${tournament.id}/live`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "update") {
      // Update state with new matches
      setMatches(data.matches);
    }
  };

  return () => eventSource.close();
}, [tournament.id]);
```

**Step 3: Commit**

```bash
git add src/app/api/tournaments/ src/lib/sse.ts
git commit -m "feat: add real-time score updates via Server-Sent Events"
```

---

### Task 17: Add Round Robin Standings & Auto-Scoring

**Objective:** Calculate standings tables for round-robin and group stages automatically.

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `src/components/tournaments/standings-table.tsx`

**Step 1: Implement standings calculation**

```ts
// src/lib/scoring.ts
interface Standing {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  lost: number;
  gamesWon: number;
  gamesLost: number;
  pointsWon: number;
  pointsLost: number;
  points: number; // 2 per win, 0 per loss
}

export function calculateStandings(
  matches: Array<{
    player1: any;
    player2: any;
    status: string;
    winnerId: string | null;
    winnerScore: number | null;
    loserScore: number | null;
  }>
): Standing[] {
  const standings: Map<string, Standing> = new Map();

  matches.forEach(match => {
    if (match.status !== "completed") return;
    if (!match.player1 || !match.player2) return;

    ["player1", "player2"].forEach(key => {
      const p = match[key as "player1" | "player2"];
      if (!p?.player) return;
      const id = p.playerId;
      if (!standings.has(id)) {
        standings.set(id, {
          playerId: id,
          playerName: p.player.name,
          played: 0, won: 0, lost: 0,
          gamesWon: 0, gamesLost: 0,
          pointsWon: 0, pointsLost: 0,
          points: 0,
        });
      }
    });

    const s1 = standings.get(match.player1.playerId)!;
    const s2 = standings.get(match.player2.playerId)!;

    s1.played++; s2.played++;
    s1.gamesWon += match.winnerScore!; s2.gamesWon += match.loserScore!;
    s1.gamesLost += match.loserScore!; s2.gamesLost += match.winnerScore!;

    if (match.winnerId === match.player1.playerId) {
      s1.won++; s2.lost++; s1.points += 2;
    } else {
      s2.won++; s1.lost++; s2.points += 2;
    }
  });

  // Sort: points > games won > games lost ratio > head-to-head
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.gamesWon - a.gamesLost;
    const bDiff = b.gamesWon - b.gamesLost;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.gamesWon - a.gamesWon;
  });
}
```

**Step 2: Create standings table component**

```tsx
// src/components/tournaments/standings-table.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Standing {
  playerId: string; playerName: string; played: number;
  won: number; lost: number; gamesWon: number; gamesLost: number; points: number;
}

export function StandingsTable({ standings, showRank = true }: {
  standings: Standing[];
  showRank?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showRank && <TableHead className="w-8">#</TableHead>}
          <TableHead>Player</TableHead>
          <TableHead className="text-center">P</TableHead>
          <TableHead className="text-center">W</TableHead>
          <TableHead className="text-center">L</TableHead>
          <TableHead className="text-center">GW</TableHead>
          <TableHead className="text-center">GL</TableHead>
          <TableHead className="text-center">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((s, i) => (
          <TableRow key={s.playerId}>
            {showRank && <TableCell className="font-medium">{i + 1}</TableCell>}
            <TableCell>{s.playerName}</TableCell>
            <TableCell className="text-center">{s.played}</TableCell>
            <TableCell className="text-center">{s.won}</TableCell>
            <TableCell className="text-center">{s.lost}</TableCell>
            <TableCell className="text-center">{s.gamesWon}</TableCell>
            <TableCell className="text-center">{s.gamesLost}</TableCell>
            <TableCell className="text-center font-bold">{s.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Step 3: Install table component**

```bash
npx shadcn@latest add table
```

**Step 4: Commit**

```bash
git add src/lib/scoring.ts src/components/tournaments/standings-table.tsx
git commit -m "feat: add automatic round-robin standings calculation and table display"
```

---

### Task 18: Write End-to-End Tests with Playwright

**Objective:** Add E2E tests covering the full tournament creation flow.

**Files:**
- Create: `tests/e2e/create-tournament.spec.ts`
- Create: `playwright.config.ts`

**Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

**Step 2: Configure Playwright**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Write E2E test**

```ts
// tests/e2e/create-tournament.spec.ts
import { test, expect } from "@playwright/test";

test.describe("tournament creation", () => {
  test("can navigate to new tournament page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Tournament" }).click();
    await expect(page).toHaveURL("/new");
    await expect(page.getByRole("heading", { name: "New Tournament" })).toBeVisible();
  });

  test("can view tournament list", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible();
  });
});
```

**Step 4: Run tests**

```bash
npx playwright test
# Expected: tests pass
```

**Step 5: Commit**

```bash
git add tests/e2e/ playwright.config.ts
git commit -m "test: add Playwright E2E tests for tournament creation flow"
```

---

### Task 19: Add Responsive Mobile Scoring UI

**Objective:** Ensure the scoring interface is optimized for phones — organizers should be able to score matches on the table side.

**Files:**
- Modify: `src/components/matches/scoring-interface.tsx`

**Step 1: Add mobile optimizations to scoring interface**

- Large touch targets (min 44px)
- Score input with +/- buttons (no keyboard)
- One-handed use optimization
- Sticky header with match info
- Vibrant color feedback (green for winner)

**Step 2: Use button-based scoring for mobile**

```tsx
// Add these components to scoring interface
function ScoreButton({ value, onChange, isLeading }: {
  value: number;
  onChange: (v: number) => void;
  isLeading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-12 h-12 rounded-full bg-accent text-lg font-bold active:scale-95"
      >−</button>
      <span className={`text-2xl font-bold w-12 text-center ${isLeading ? "text-green-600" : ""}`}>
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-12 h-12 rounded-full bg-accent text-lg font-bold active:scale-95"
      >+</button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/matches/
git commit -m "feat: optimize scoring UI for mobile with large touch targets and button inputs"
```

---

### Task 20: Add README, Deployment Docs, and Launch

**Objective:** Create comprehensive documentation and prepare for deployment.

**Files:**
- Create: `README.md`
- Create: `docs/deployment.md`
- Create: `.github/ISSUE_TEMPLATE/feature-request.md`
- Create: `LICENSE`

**Step 1: Write the README**

```markdown
# TT Manager — Table Tennis Tournament Manager

> Open-source, world-class table tennis tournament management platform.

## Features

- **4 Tournament Formats**: Knockout, Round Robin, Double Knockout, Groups + Knockout
- **Live Scoring**: Submit scores game-by-game from any device
- **Public Scoreboard**: Spectator-friendly live results, no login needed
- **Player Management**: Add players individually or via CSV bulk upload
- **Smart Seeding**: Classic bracket seeding with serpentine group distribution
- **Mobile-First**: Score matches table-side from your phone
- **Real-Time Updates**: Server-Sent Events push scores live

## Quick Start

```bash
git clone https://github.com/clawdbotgk-gk/gk-hermes-test.git
cd gk-hermes-test
npm install

cp .env.example .env.local
# Fill in your DATABASE_URL and auth provider keys

npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 15 (App Router) + React 19
- PostgreSQL + Prisma ORM
- Tailwind CSS 4 + shadcn/ui
- NextAuth v5
- Server-Sent Events (SSE) for real-time

## Deployment

See [docs/deployment.md](docs/deployment.md) for Vercel, Railway, and self-hosted options.

## Contributing

PRs welcome! Check out [open issues](https://github.com/clawdbotgk-gk/gk-hermes-test/issues).

## License

MIT
```

**Step 2: Create deployment guide**

```markdown
# Deployment Guide

## Vercel (Recommended)
1. Connect repo at vercel.com
2. Set environment variables:
   - DATABASE_URL (use Vercel Postgres)
   - AUTH_SECRET (run: `openssl rand -base64 32`)
   - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
   - RESEND_API_KEY
   - EMAIL_FROM
   - NEXT_PUBLIC_APP_URL
3. Deploy — that's it

## Railway
1. Create new project from GitHub
2. Add PostgreSQL service
3. Set env vars as above
4. Deploy

## Self-Hosted (Docker)
Coming soon — Docker Compose setup with PostgreSQL.
```

**Step 3: Add MIT License**

**Step 4: Commit and push**

```bash
git add README.md docs/deployment.md LICENSE .github/
git commit -m "docs: add README, deployment guide, and project documentation"

# Push to GitHub
GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" ~/.hermes/.env | head -1 | cut -d= -f2 | tr -d '\n\r')
git remote set-url origin "https://clawdbotgk-gk:${GITHUB_TOKEN}@github.com/clawdbotgk-gk/gk-hermes-test.git"
git push -u origin main
```

---

## Phase Roadmap Overview

### Phase 1 — MVP (This Plan) -- Tasks 1-20
[x] Project setup, DB, auth
[x] Tournament CRUD with 4 formats
[x] Player management (form + CSV)
[x] Draw generation (all format algorithms)
[x] Match scoring interface
[x] Tournament dashboard with bracket view
[x] Public live scoreboard
[x] Real-time score updates via SSE
[x] Round-robin standings calculation
[x] Mobile-optimized scoring
[x] E2E tests
[x] README + deployment docs

### Phase 2 — Advanced Formats
5. Swiss System draw generator
6. Round Robin + Consolation playoffs
7. King-of-the-Table ladder format

### Phase 3 — League & Rating Engine
8. Ongoing league with fixture scheduling
9. ELO/Glicko rating system
10. Player profiles with stats, head-to-head, streaks

### Phase 4 — Production Features
11. Stripe payment integration for entry fees
12. Email notifications (match reminders, results)
13. Export results as PDF / CSV
14. Admin analytics dashboard
15. Multi-organization support

### Phase 5 — Polish & Scale
16. Offline mode (PWA) for scoring in venues with poor WiFi
17. QR code match sheets for each table
18. Spectator mobile app (same web, optimized view)
19. iCal fixture export for players
20. API for third-party integrations (ratings bodies, club management systems)

---

> **End of Plan** — 20 tasks across Phase 1, with clear file paths, code, tests, and commit messages.
> Next step: Execute via subagent-driven-development or implement sequentially.
