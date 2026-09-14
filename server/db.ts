import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  BriefingPayload,
  BriefingRecord,
  CoverageItem,
  ImportLogRecord,
  ItemUserState,
  LibraryItem,
  ProgramCatalogReview,
  SchemaItem,
  BackupFormat,
  UserStatus,
} from '../src/types.ts';
import { normalizeUrl } from '../src/lib/validator.ts';
import { SAMPLE_BRIEFING } from '../src/data/sample-briefing.ts';

interface DatabaseSchema {
  version: 1;
  cleared_by_user?: boolean;
  items: Record<string, LibraryItem>;
  briefings: Record<string, BriefingRecord>;
  import_logs: ImportLogRecord[];
  item_briefing_links: Array<{
    item_id: string;
    briefing_id: string;
    briefing_date: string;
    linked_at: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inspiration_db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    version: 1,
    items: {},
    briefings: {},
    import_logs: [],
    item_briefing_links: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.items) {
          this.data = parsed;
        }
      } else {
        this.save();
      }

      // If database is brand new and empty (and not deliberately cleared by user), seed with initial sample briefing
      if (Object.keys(this.data.items).length === 0 && !this.data.cleared_by_user) {
        this.importBriefing(
          SAMPLE_BRIEFING,
          SAMPLE_BRIEFING.items.map((_, i) => i),
          true
        );
      }
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  public getStats() {
    const items = Object.values(this.data.items);
    const briefings = Object.values(this.data.briefings);
    // Sort briefings by date
    briefings.sort((a, b) => b.briefing_date.localeCompare(a.briefing_date));
    const lastBriefing = briefings[0] || null;

    const logs = [...this.data.import_logs];
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const lastImport = logs[0] || null;

    return {
      total_items: items.length,
      total_briefings: briefings.length,
      last_import_at: lastImport ? lastImport.timestamp : null,
      last_briefing_date: lastBriefing ? lastBriefing.briefing_date : null,
      last_briefing_id: lastBriefing ? lastBriefing.briefing_id : null,
    };
  }

  public getAllItems(): LibraryItem[] {
    return Object.values(this.data.items);
  }

  public getItemById(id: string): LibraryItem | null {
    return this.data.items[id] || null;
  }

  public updateUserState(
    id: string,
    patch: {
      rating?: 1 | 2 | 3 | 4 | 5 | null;
      status?: UserStatus;
      personal_note?: string;
    }
  ): LibraryItem | null {
    const item = this.data.items[id];
    if (!item) return null;

    const now = new Date().toISOString();
    const current = item.user_state || {
      rating: null,
      status: 'new',
      personal_note: '',
      updated_at: now,
    };

    item.user_state = {
      rating: patch.rating !== undefined ? patch.rating : current.rating,
      status: patch.status !== undefined ? patch.status : current.status,
      personal_note: patch.personal_note !== undefined ? patch.personal_note : current.personal_note,
      updated_at: now,
    };
    // Note: Per spec, updating user state does NOT modify item.updated_at or content dates
    this.save();
    return item;
  }

  public updateItemContent(id: string, patch: Partial<SchemaItem>): LibraryItem | null {
    const item = this.data.items[id];
    if (!item) return null;

    const now = new Date().toISOString();
    Object.assign(item, patch, {
      updated_at: now,
      manually_edited: true,
    });

    this.save();
    return item;
  }

  public importBriefing(
    briefing: BriefingPayload,
    selectedIndices: number[],
    allowPartial = true
  ): {
    success: boolean;
    added_count: number;
    updated_count: number;
    skipped_count: number;
    unaccepted_count: number;
    unaccepted_details: Array<{ title: string; reason: string }>;
    log_id: string;
  } {
    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const unacceptedDetails: Array<{ title: string; reason: string }> = [];

    const existingItems = Object.values(this.data.items);

    // Save or update briefing record
    const existingBriefing = this.data.briefings[briefing.briefing_id];
    if (!existingBriefing) {
      this.data.briefings[briefing.briefing_id] = {
        briefing_id: briefing.briefing_id,
        briefing_date: briefing.briefing_date,
        timezone: briefing.timezone,
        status: briefing.status,
        coverage: briefing.coverage,
        program_catalog_review: briefing.program_catalog_review,
        limitations: briefing.limitations,
        imported_at: now,
        items_count: briefing.items.length,
      };
    } else {
      existingBriefing.imported_at = now;
      existingBriefing.coverage = briefing.coverage;
      existingBriefing.program_catalog_review = briefing.program_catalog_review;
      existingBriefing.limitations = briefing.limitations;
    }

    // Process items
    const selectedSet = new Set(selectedIndices);

    briefing.items.forEach((item, index) => {
      if (!selectedSet.has(index)) {
        skippedCount++;
        return;
      }

      const normUrl = normalizeUrl(item.source_url);
      const titleNorm = item.title.trim().toLowerCase();

      // Find existing match
      let matched: LibraryItem | undefined;
      for (const ex of existingItems) {
        const exTitleNorm = ex.title.trim().toLowerCase();
        const exNormUrl = normalizeUrl(ex.source_url);

        if (ex.briefing_id === briefing.briefing_id && exTitleNorm === titleNorm) {
          matched = ex;
          break;
        }
        if (exNormUrl === normUrl) {
          if (exTitleNorm === titleNorm || (item.event_date && ex.event_date === item.event_date)) {
            matched = ex;
            break;
          }
        }
      }

      if (matched) {
        // Update existing item while strictly preserving ID, manual edits, ratings, personal note, user status
        matched.briefing_id = briefing.briefing_id;
        matched.briefing_date = briefing.briefing_date;
        matched.updated_at = now;

        // If manually edited, do not overwrite content without explicit confirmation
        if (!matched.manually_edited) {
          matched.title = item.title;
          matched.channels = item.channels;
          matched.content_type = item.content_type;
          matched.subjects = item.subjects;
          matched.source_name = item.source_name;
          matched.source_url = item.source_url;
          matched.published_date = item.published_date;
          matched.event_date = item.event_date;
          matched.novelty = item.novelty;
          matched.summary = item.summary;
          matched.relevance = item.relevance;
          matched.details = item.details;
          matched.program_matches = item.program_matches;
          matched.sources = item.sources;
          matched.program_change = item.program_change;
          matched.image = item.image;
          matched.caveat = item.caveat;
        }

        updatedCount++;
      } else {
        // Generate new stable ID
        const itemId = `item_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const newLibraryItem: LibraryItem = {
          ...item,
          id: itemId,
          briefing_id: briefing.briefing_id,
          briefing_date: briefing.briefing_date,
          created_at: now,
          updated_at: now,
          user_state: {
            rating: null,
            status: 'new',
            personal_note: '',
            updated_at: now,
          },
        };

        this.data.items[itemId] = newLibraryItem;
        this.data.item_briefing_links.push({
          item_id: itemId,
          briefing_id: briefing.briefing_id,
          briefing_date: briefing.briefing_date,
          linked_at: now,
        });

        addedCount++;
      }
    });

    const unacceptedCount = unacceptedDetails.length;
    const logId = `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const importStatus =
      unacceptedCount > 0 ? 'partial' : addedCount + updatedCount > 0 ? 'success' : 'failed';

    const logRecord: ImportLogRecord = {
      id: logId,
      timestamp: now,
      briefing_id: briefing.briefing_id,
      briefing_date: briefing.briefing_date,
      agent_status: briefing.status,
      import_status: importStatus,
      added_count: addedCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      unaccepted_count: unacceptedCount,
      unaccepted_details: unacceptedDetails.length > 0 ? unacceptedDetails : undefined,
      limitations: briefing.limitations || [],
      notes: `ייבוא נקלט: ${addedCount} חדשים, ${updatedCount} עודכנו, ${skippedCount} דולגו.`,
    };

    this.data.import_logs.unshift(logRecord);
    this.save();

    return {
      success: true,
      added_count: addedCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      unaccepted_count: unacceptedCount,
      unaccepted_details: unacceptedDetails,
      log_id: logId,
    };
  }

  public getBriefings(): BriefingRecord[] {
    const list = Object.values(this.data.briefings);
    list.sort((a, b) => b.briefing_date.localeCompare(a.briefing_date));
    return list;
  }

  public getImportLogs(): ImportLogRecord[] {
    return this.data.import_logs;
  }

  public createBackup(scope: 'full' | 'filtered' | 'selected', itemIds?: string[]): BackupFormat {
    const now = new Date().toISOString();
    let itemsToExport = Object.values(this.data.items);

    if (itemIds && itemIds.length > 0 && scope !== 'full') {
      const set = new Set(itemIds);
      itemsToExport = itemsToExport.filter((item) => set.has(item.id));
    }

    return {
      format: 'inspiration-library-backup',
      version: 1,
      schema_version: 1,
      exported_at: now,
      scope,
      stats: {
        total_items: itemsToExport.length,
        total_briefings: Object.keys(this.data.briefings).length,
        total_logs: this.data.import_logs.length,
      },
      items: itemsToExport,
      briefings: Object.values(this.data.briefings),
      import_logs: this.data.import_logs,
    };
  }

  public restoreBackup(
    backup: BackupFormat,
    mode: 'merge' | 'replace'
  ): {
    success: boolean;
    restored_items_count: number;
    restored_briefings_count: number;
    message: string;
  } {
    if (backup.format !== 'inspiration-library-backup' || backup.version !== 1) {
      throw new Error('קובץ גיבוי לא תקין או פורמט שאינו נתמך');
    }

    if (mode === 'replace') {
      this.data.items = {};
      this.data.briefings = {};
      this.data.import_logs = [];
      this.data.item_briefing_links = [];
    }

    let restoredItems = 0;
    for (const item of backup.items || []) {
      if (item && item.id) {
        this.data.items[item.id] = item;
        restoredItems++;
      }
    }

    let restoredBriefings = 0;
    for (const br of backup.briefings || []) {
      if (br && br.briefing_id) {
        this.data.briefings[br.briefing_id] = br;
        restoredBriefings++;
      }
    }

    if (Array.isArray(backup.import_logs)) {
      if (mode === 'replace') {
        this.data.import_logs = backup.import_logs;
      } else {
        const existingIds = new Set(this.data.import_logs.map((l) => l.id));
        for (const log of backup.import_logs) {
          if (!existingIds.has(log.id)) {
            this.data.import_logs.push(log);
          }
        }
        this.data.import_logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
    }

    this.save();
    return {
      success: true,
      restored_items_count: restoredItems,
      restored_briefings_count: restoredBriefings,
      message:
        mode === 'replace'
          ? `המאגר הוחלף בהצלחה: שוחזרו ${restoredItems} פריטים ו־${restoredBriefings} תדריכים.`
          : `מיזוג הושלם בהצלחה: נוספו/עודכנו ${restoredItems} פריטים ו־${restoredBriefings} תדריכים.`,
    };
  }

  public clearDatabase(reseedSample: boolean = false): {
    success: boolean;
    deleted_items_count: number;
    deleted_briefings_count: number;
    reseeded: boolean;
    message: string;
  } {
    const prevItemCount = Object.keys(this.data.items).length;
    const prevBriefingCount = Object.keys(this.data.briefings).length;

    this.data.items = {};
    this.data.briefings = {};
    this.data.import_logs = [];
    this.data.item_briefing_links = [];

    let reseeded = false;
    if (reseedSample) {
      this.data.cleared_by_user = false;
      this.importBriefing(
        SAMPLE_BRIEFING,
        SAMPLE_BRIEFING.items.map((_, i) => i),
        true
      );
      reseeded = true;
    } else {
      this.data.cleared_by_user = true;
    }

    this.save();

    return {
      success: true,
      deleted_items_count: prevItemCount,
      deleted_briefings_count: prevBriefingCount,
      reseeded,
      message: reseeded
        ? `המאגר אופס ונטען מחדש עם תדריך הדוגמה (${SAMPLE_BRIEFING.items.length} פריטים).`
        : `כל נתוני המאגר נמחקו בהצלחה (${prevItemCount} פריטים, ${prevBriefingCount} תדריכים). המאגר כעת ריק לחלוטין.`,
    };
  }
}

export const db = new DatabaseStore();
