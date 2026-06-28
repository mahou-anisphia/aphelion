import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { db } from './db/index.js';
import { projects } from './db/schema.js';
import { eq, asc, and, ne, sql, count } from 'drizzle-orm';
import { z } from 'zod';

const app = express();
const port = process.env['PORT'] ?? 3000;

app.use(express.json());

// CORS — allows the Angular dev server and any Tailscale client to reach the API
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// ─── Column metadata (fixed, no DB table) ──────────────────────────────────────

const COLUMNS = [
  { id: 'active', title: 'Active', status: 'active' as const },
  { id: 'paused', title: 'Paused', status: 'paused' as const },
  { id: 'abandoned', title: 'Abandoned', status: 'abandoned' as const },
  { id: 'done', title: 'Done', status: 'done' as const },
];

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateLabelFor(status: string): string {
  return COLUMNS.find((c) => c.status === status)?.title ?? status;
}

function toProject(row: typeof projects.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    date: row.date,
    dateLabel: row.dateLabel,
    position: row.position,
  };
}

// ─── GET /api/board ─────────────────────────────────────────────────────────────

app.get('/api/board', async (_req: Request, res: Response) => {
  try {
    const all = await db.select().from(projects).orderBy(asc(projects.position));
    const columns = COLUMNS.map((col) => ({
      ...col,
      projects: all.filter((p) => p.status === col.status).map(toProject),
    }));
    res.json({ columns });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load board' });
  }
});

// ─── POST /api/projects ─────────────────────────────────────────────────────────

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['active', 'paused', 'abandoned', 'done']),
});

app.post('/api/projects', async (req: Request, res: Response) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { title, description, status } = parsed.data;

  try {
    const created = await db.transaction(async (tx) => {
      // Shift existing projects in the column down to make room at position 0
      await tx
        .update(projects)
        .set({ position: sql`${projects.position} + 1` })
        .where(eq(projects.status, status));

      const [row] = await tx
        .insert(projects)
        .values({
          title,
          description,
          status,
          date: formatDate(new Date()),
          dateLabel: dateLabelFor(status),
          position: 0,
        })
        .returning();

      return row!;
    });

    res.status(201).json(toProject(created));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ─── PATCH /api/projects/:id ────────────────────────────────────────────────────
// Handles three cases:
//   • Edit fields (title, description) — any combination
//   • Move to a different column — send { status: newStatus }
//   • Reorder within the same column — send { position: newIndex }

const PatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['active', 'paused', 'abandoned', 'done']).optional(),
  position: z.number().int().min(0).optional(),
});

app.patch('/api/projects/:id', async (req: Request, res: Response) => {
  const id = req.params['id'];
  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }

  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { title, description, status: newStatus, position: newPosition } = parsed.data;

  try {
    const updated = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(projects).where(eq(projects.id, id));
      if (!current) return null;

      const updates: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;

      const isMovingColumn = newStatus !== undefined && newStatus !== current.status;
      const isReordering = newPosition !== undefined && !isMovingColumn;

      if (isMovingColumn) {
        // 1. Close the gap left in the old column
        await tx
          .update(projects)
          .set({ position: sql`${projects.position} - 1` })
          .where(and(eq(projects.status, current.status), sql`${projects.position} > ${current.position}`));

        // 2. Count existing items in the new column to place this one at the end
        const countRows = await tx
          .select({ value: count() })
          .from(projects)
          .where(eq(projects.status, newStatus));

        updates.status = newStatus;
        updates.position = countRows[0]?.value ?? 0;
        updates.date = formatDate(new Date());
        updates.dateLabel = dateLabelFor(newStatus);
      } else if (isReordering) {
        // Fetch all siblings sorted by position, then re-insert at new index
        const siblings = await tx
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.status, current.status), ne(projects.id, id)))
          .orderBy(asc(projects.position));

        const clamped = Math.min(newPosition, siblings.length);

        // Re-assign sequential positions with the current project spliced in at clamped
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i]!;
          const assignedPos = i >= clamped ? i + 1 : i;
          await tx.update(projects).set({ position: assignedPos }).where(eq(projects.id, sibling.id));
        }

        updates.position = clamped;
      }

      const [row] = await tx.update(projects).set(updates).where(eq(projects.id, id)).returning();
      return row ?? null;
    });

    if (!updated) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(toProject(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ─── DELETE /api/projects/:id ───────────────────────────────────────────────────

app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  const id = req.params['id'];
  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      const [deleted] = await tx.delete(projects).where(eq(projects.id, id)).returning();
      if (!deleted) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      // Close the gap left by the deleted project
      await tx
        .update(projects)
        .set({ position: sql`${projects.position} - 1` })
        .where(and(eq(projects.status, deleted.status), sql`${projects.position} > ${deleted.position}`));

      res.json({ success: true });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ─── DELETE /api/board — wipe all projects (dev / admin) ───────────────────────

app.delete('/api/board', async (_req: Request, res: Response) => {
  try {
    await db.delete(projects);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to clear board' });
  }
});

// ─── Static file serving (production only) ─────────────────────────────────────
// When the Angular dist is copied into ./public (Docker image), Express serves it.
// In development the Angular dev server handles the FE; ./public won't exist.
const publicDir = join(process.cwd(), 'public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — any path that isn't an /api route returns index.html
  app.use((req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(publicDir, 'index.html'));
    }
  });
}

app.listen(port, () => {
  console.log(`Aphelion running at http://localhost:${port}`);
});
