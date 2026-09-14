import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.ts';
import { validateAndAnalyzeBriefing } from './src/lib/validator.ts';
import { generateCsvString } from './src/lib/csv.ts';
import type { BackupFormat, BriefingPayload } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/stats', (req, res) => {
    try {
      const stats = db.getStats();
      res.json(stats);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/items', (req, res) => {
    try {
      const items = db.getAllItems();
      res.json(items);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/items/:id', (req, res) => {
    try {
      const item = db.getItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'פריט לא נמצא' });
      }
      res.json(item);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/items/:id/user-state', (req, res) => {
    try {
      const updated = db.updateUserState(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'פריט לא נמצא' });
      }
      res.json(updated);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/items/:id/content', (req, res) => {
    try {
      const updated = db.updateItemContent(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'פריט לא נמצא' });
      }
      res.json(updated);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/briefings/validate', (req, res) => {
    try {
      const { raw_input } = req.body;
      if (!raw_input || typeof raw_input !== 'string') {
        return res.status(400).json({ error: 'לא התקבל קלט לבדיקה' });
      }

      const existingItems = db.getAllItems();
      const analysis = validateAndAnalyzeBriefing(raw_input, existingItems);
      res.json(analysis);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/briefings/import', (req, res) => {
    try {
      const { briefing, selected_indices, allow_partial } = req.body as {
        briefing: BriefingPayload;
        selected_indices: number[];
        allow_partial?: boolean;
      };

      if (!briefing || !Array.isArray(briefing.items)) {
        return res.status(400).json({ error: 'מבנה תדריך שגוי' });
      }

      const result = db.importBriefing(briefing, selected_indices || [], allow_partial !== false);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/briefings', (req, res) => {
    try {
      const briefings = db.getBriefings();
      res.json(briefings);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/import-logs', (req, res) => {
    try {
      const logs = db.getImportLogs();
      res.json(logs);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/backup', (req, res) => {
    try {
      const scope = (req.query.scope as 'full' | 'filtered' | 'selected') || 'full';
      const itemIds = req.query.ids ? String(req.query.ids).split(',') : undefined;
      const backup = db.createBackup(scope, itemIds);

      const filename = `inspiration-library-backup-${scope}-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(backup, null, 2));
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/restore', (req, res) => {
    try {
      const { backup, mode } = req.body as {
        backup: BackupFormat;
        mode: 'merge' | 'replace';
      };

      if (!backup || backup.format !== 'inspiration-library-backup') {
        return res.status(400).json({
          error: 'קובץ הגיבוי אינו תקני או שאינו מכיל את המזהה inspiration-library-backup',
        });
      }

      const result = db.restoreBackup(backup, mode || 'merge');
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/database/reset', (req, res) => {
    try {
      const { reseed } = req.body || {};
      const result = db.clearDatabase(Boolean(reseed));
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Alias endpoint
  app.post('/api/reset', (req, res) => {
    try {
      const { reseed } = req.body || {};
      const result = db.clearDatabase(Boolean(reseed));
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/export/csv', (req, res) => {
    try {
      const { item_ids, include_personal } = req.body as {
        item_ids?: string[];
        include_personal?: boolean;
      };

      let items = db.getAllItems();
      if (Array.isArray(item_ids) && item_ids.length > 0) {
        const idSet = new Set(item_ids);
        items = items.filter((it) => idSet.has(it.id));
      }

      const csvContent = generateCsvString(items, !!include_personal);
      const filename = `inspiration-library-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(csvContent);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
