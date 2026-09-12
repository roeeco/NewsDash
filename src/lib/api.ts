import type {
  BackupFormat,
  BriefingPayload,
  BriefingRecord,
  BriefingValidationResult,
  ImportLogRecord,
  LibraryItem,
  SchemaItem,
  UserStatus,
} from '../types.ts';

export async function fetchStats(): Promise<{
  total_items: number;
  total_briefings: number;
  last_import_at: string | null;
  last_briefing_date: string | null;
  last_briefing_id: string | null;
}> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('שגיאה בטעינת נתוני מערכת');
  return res.json();
}

export async function fetchAllItems(): Promise<LibraryItem[]> {
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('שגיאה בטעינת פריטי הספרייה');
  return res.json();
}

export const fetchItems = fetchAllItems;

export async function fetchItemById(id: string): Promise<LibraryItem> {
  const res = await fetch(`/api/items/${id}`);
  if (!res.ok) throw new Error('פריט לא נמצא');
  return res.json();
}

export async function updateUserState(
  id: string,
  state: {
    rating?: 1 | 2 | 3 | 4 | 5 | null;
    status?: UserStatus;
    personal_note?: string;
  }
): Promise<LibraryItem> {
  const res = await fetch(`/api/items/${id}/user-state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error('שגיאה בעדכון מצב אישי');
  return res.json();
}

export const updateItemUserState = updateUserState;

export async function updateItemContent(
  id: string,
  content: Partial<SchemaItem>
): Promise<LibraryItem> {
  const res = await fetch(`/api/items/${id}/content`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
  if (!res.ok) throw new Error('שגיאה בעדכון תוכן הפריט');
  return res.json();
}

export async function validateBriefing(rawInput: string): Promise<BriefingValidationResult> {
  const res = await fetch('/api/briefings/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_input: rawInput }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'שגיאה באימות התדריך');
  }
  return res.json();
}

export async function importBriefing(
  briefing: BriefingPayload,
  selectedIndices: number[],
  allowPartial = true
): Promise<{
  success: boolean;
  added_count: number;
  updated_count: number;
  skipped_count: number;
  unaccepted_count: number;
  unaccepted_details: Array<{ title: string; reason: string }>;
  log_id: string;
}> {
  const res = await fetch('/api/briefings/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      briefing,
      selected_indices: selectedIndices,
      allow_partial: allowPartial,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'שגיאה בקליטת התדריך');
  }
  return res.json();
}

export async function fetchBriefings(): Promise<BriefingRecord[]> {
  const res = await fetch('/api/briefings');
  if (!res.ok) throw new Error('שגיאה בטעינת תדריכים');
  return res.json();
}

export async function fetchImportLogs(): Promise<ImportLogRecord[]> {
  const res = await fetch('/api/import-logs');
  if (!res.ok) throw new Error('שגיאה בטעינת יומן ייבוא');
  return res.json();
}

export async function restoreBackup(
  backup: BackupFormat,
  mode: 'merge' | 'replace'
): Promise<{
  success: boolean;
  restored_items_count: number;
  restored_briefings_count: number;
  message: string;
}> {
  const res = await fetch('/api/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backup, mode }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'שגיאה בשחזור הגיבוי');
  }
  return res.json();
}
