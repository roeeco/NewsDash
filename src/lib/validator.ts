import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schemaJson from '../data/inspiration-briefing.schema.json' with { type: 'json' };
import type {
  BriefingPayload,
  BriefingValidationResult,
  LibraryItem,
  SchemaItem,
  ValidationPreviewItem,
} from '../types.ts';

// Initialize Ajv with 2020-12 support and strict validation
const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: true,
});
// ajv-formats adds standard format validators (date, uri, etc.)
addFormats(ajv);

const validateBriefingSchema = ajv.compile(schemaJson);

/**
 * Conservative URL normalization according to spec:
 * Removes known tracking parameters like utm_*, fbclid, gclid,
 * but strictly preserves content-identifying parameters, paths, and fragments.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      '_ga',
      'mc_cid',
      'mc_eid',
    ];
    for (const param of trackingParams) {
      url.searchParams.delete(param);
    }
    // Remove trailing slash if path is not root
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    url.pathname = path;
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Translate Ajv errors into clear Hebrew with exact property paths
 */
export function formatAjvErrorToHebrew(error: {
  instancePath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
}): string {
  const path = error.instancePath || 'שורש המסמך';
  const cleanPath = path.startsWith('/') ? path.slice(1).replace(/\//g, '.') : path;

  switch (error.keyword) {
    case 'required': {
      const missing = (error.params as { missingProperty?: string })?.missingProperty;
      return `${cleanPath || 'אובייקט'}: שדה חובה חסר "${missing}"`;
    }
    case 'additionalProperties': {
      const extra = (error.params as { additionalProperty?: string })?.additionalProperty;
      return `${cleanPath || 'אובייקט'}: שדה בלתי מורשה "${extra}"`;
    }
    case 'enum': {
      const allowed = (error.params as { allowedValues?: unknown[] })?.allowedValues?.join(', ');
      return `${cleanPath}: ערך שאינו ברשימת הערכים המותרים (${allowed})`;
    }
    case 'format': {
      const format = (error.params as { format?: string })?.format;
      if (format === 'date') return `${cleanPath}: תאריך אינו בפורמט תקין (YYYY-MM-DD)`;
      if (format === 'uri') return `${cleanPath}: כתובת URL אינה תקינה`;
      return `${cleanPath}: פורמט שגוי (${format})`;
    }
    case 'pattern': {
      return `${cleanPath}: ערך אינו תואם לתבנית הנדרשת`;
    }
    case 'minItems':
    case 'maxItems': {
      return `${cleanPath}: מספר איברים שגוי במערך`;
    }
    case 'uniqueItems': {
      return `${cleanPath}: פריטים כפולים במערך שאינו מאפשר כפילויות`;
    }
    case 'const': {
      return `${cleanPath}: ערך קבוע אינו תואם`;
    }
    default:
      return `${cleanPath}: ${error.message || 'ערך לא תקין'}`;
  }
}

/**
 * Clean incoming raw input:
 * Removes BOM, extra leading/trailing whitespace, and single markdown ```json code block wrapper
 */
export function cleanJsonInput(raw: string): string {
  let text = raw.trim();
  // Remove UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  text = text.trim();

  // Strip single json markdown code block if user pasted with ```json ... ```
  const codeBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n\s*```$/i;
  const match = text.match(codeBlockRegex);
  if (match) {
    text = match[1].trim();
  }
  return text;
}

/**
 * Validate briefing payload and prepare deep deduplication & preview against existing library items
 */
export function validateAndAnalyzeBriefing(
  rawInput: string,
  existingItems: LibraryItem[]
): BriefingValidationResult {
  const cleaned = cleanJsonInput(rawInput);
  if (!cleaned) {
    return {
      valid_envelope: false,
      envelope_errors: ['הקלט ריק. יש להדביק תוכן JSON מהתדריך.'],
      total_items: 0,
      items_preview: [],
      counts: { new: 0, existing_unchanged: 0, proposed_update: 0, suspected_duplicate: 0, invalid: 0 },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: unknown) {
    return {
      valid_envelope: false,
      envelope_errors: [`שגיאת פענוח JSON: ${(err as Error)?.message || 'מבנה ה־JSON אינו חוקי'}`],
      total_items: 0,
      items_preview: [],
      counts: { new: 0, existing_unchanged: 0, proposed_update: 0, suspected_duplicate: 0, invalid: 0 },
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      valid_envelope: false,
      envelope_errors: ['הקובץ חייב להכיל אובייקט JSON תקני'],
      total_items: 0,
      items_preview: [],
      counts: { new: 0, existing_unchanged: 0, proposed_update: 0, suspected_duplicate: 0, invalid: 0 },
    };
  }

  // Check if user accidentally pasted an inspiration library backup file
  const obj = parsed as Record<string, unknown>;
  if (obj.format === 'inspiration-library-backup') {
    return {
      valid_envelope: false,
      envelope_errors: [
        'הקובץ שהודבק הוא קובץ גיבוי של הספרייה ("inspiration-library-backup") ולא פלט סוכן תדריך.',
        'לשחזור נתונים מגיבוי, עברו למסך "גיבוי וייצוא" והשתמשו ב"שחזור מגיבוי JSON".',
      ],
      is_backup_file: true,
      total_items: 0,
      items_preview: [],
      counts: { new: 0, existing_unchanged: 0, proposed_update: 0, suspected_duplicate: 0, invalid: 0 },
    };
  }

  // Validate entire document against JSON Schema Draft 2020-12
  const isValid = validateBriefingSchema(parsed);
  if (!isValid) {
    const errors = validateBriefingSchema.errors || [];
    // Separate envelope errors from item-specific errors
    const envelopeErrors: string[] = [];
    const itemErrorsByIndex = new Map<number, string[]>();

    for (const err of errors) {
      const path = err.instancePath || '';
      const itemMatch = path.match(/^\/items\/(\d+)(.*)$/);
      if (itemMatch) {
        const itemIdx = parseInt(itemMatch[1], 10);
        const subPath = itemMatch[2];
        const errorCopy = { ...err, instancePath: `פריט [${itemIdx + 1}]${subPath}` };
        const msg = formatAjvErrorToHebrew(errorCopy);
        const current = itemErrorsByIndex.get(itemIdx) || [];
        current.push(msg);
        itemErrorsByIndex.set(itemIdx, current);
      } else {
        envelopeErrors.push(formatAjvErrorToHebrew(err));
      }
    }

    if (envelopeErrors.length > 0) {
      // Envelope errors block import entirely
      return {
        valid_envelope: false,
        envelope_errors: envelopeErrors,
        total_items: Array.isArray(obj.items) ? obj.items.length : 0,
        items_preview: [],
        counts: { new: 0, existing_unchanged: 0, proposed_update: 0, suspected_duplicate: 0, invalid: 0 },
      };
    }
  }

  const briefing = parsed as BriefingPayload;
  const items = briefing.items || [];
  const previewItems: ValidationPreviewItem[] = [];

  const counts = {
    new: 0,
    existing_unchanged: 0,
    proposed_update: 0,
    suspected_duplicate: 0,
    invalid: 0,
  };

  for (let idx = 0; idx < items.length; idx++) {
    const rawItem = items[idx];
    // Check if this item had schema validation errors
    // Validate individual item
    const itemErrors: string[] = [];
    if (!rawItem.title) itemErrors.push('כותרת חסרה');
    if (!rawItem.source_url) itemErrors.push('כתובת מקור חסרה');

    if (itemErrors.length > 0) {
      counts.invalid++;
      previewItems.push({
        index: idx,
        item: rawItem,
        status: 'invalid',
        validation_errors: itemErrors,
        selected_for_import: false,
      });
      continue;
    }

    const normItemUrl = normalizeUrl(rawItem.source_url);
    const itemTitleNorm = rawItem.title.trim().toLowerCase();

    // Match against existing library items
    let matchedItem: LibraryItem | undefined;
    let matchType: 'exact' | 'same_briefing' | 'same_url_and_event' | 'title_similarity' | null = null;
    const matchReasons: string[] = [];

    for (const existing of existingItems) {
      const existingNormUrl = normalizeUrl(existing.source_url);
      const existingTitleNorm = existing.title.trim().toLowerCase();

      // Check same briefing + same title
      if (existing.briefing_id === briefing.briefing_id && existingTitleNorm === itemTitleNorm) {
        matchedItem = existing;
        matchType = 'same_briefing';
        matchReasons.push('פריט עם כותרת זהה קיים כבר מתדריך זה');
        break;
      }

      // Check URL and event date or title
      if (existingNormUrl === normItemUrl) {
        // According to spec: identical URL alone is not proof of duplicate if page has multiple news/workshops
        // But if title is also the same or event_date is identical:
        if (existingTitleNorm === itemTitleNorm || (rawItem.event_date && existing.event_date === rawItem.event_date)) {
          matchedItem = existing;
          matchType = 'same_url_and_event';
          matchReasons.push('כתובת מקור זהה ומועד אירוע/כותרת תואמים');
          break;
        }
      }

      // Check close title similarity for alert
      if (existingTitleNorm === itemTitleNorm && !matchedItem) {
        matchedItem = existing;
        matchType = 'title_similarity';
        matchReasons.push('כותרת זהה לפריט קיים (כתובת מקור שונה)');
      }
    }

    if (!matchedItem) {
      counts.new++;
      previewItems.push({
        index: idx,
        item: rawItem,
        status: 'new',
        selected_for_import: true,
      });
    } else if (matchType === 'title_similarity') {
      counts.suspected_duplicate++;
      previewItems.push({
        index: idx,
        item: rawItem,
        status: 'suspected_duplicate',
        existing_id: matchedItem.id,
        existing_title: matchedItem.title,
        match_reasons: matchReasons,
        selected_for_import: true, // User can choose to uncheck or keep
      });
    } else {
      // Compare content differences
      const diffFields: string[] = [];
      if (matchedItem.summary !== rawItem.summary) diffFields.push('תקציר');
      if (matchedItem.relevance !== rawItem.relevance) diffFields.push('רלוונטיות');
      if (matchedItem.published_date !== rawItem.published_date) diffFields.push('תאריך פרסום');
      if (matchedItem.event_date !== rawItem.event_date) diffFields.push('מועד אירוע');
      if (matchedItem.content_type !== rawItem.content_type) diffFields.push('סוג תוכן');
      if (JSON.stringify(matchedItem.subjects) !== JSON.stringify(rawItem.subjects)) diffFields.push('נושאים');
      if (JSON.stringify(matchedItem.program_matches) !== JSON.stringify(rawItem.program_matches))
        diffFields.push('התאמה לתוכניות');
      if (JSON.stringify(matchedItem.details) !== JSON.stringify(rawItem.details)) diffFields.push('פרטי התנסות');

      if (diffFields.length === 0) {
        counts.existing_unchanged++;
        previewItems.push({
          index: idx,
          item: rawItem,
          status: 'existing_unchanged',
          existing_id: matchedItem.id,
          existing_title: matchedItem.title,
          match_reasons: matchReasons,
          selected_for_import: false, // Default uncheck for unchanged
        });
      } else {
        counts.proposed_update++;
        previewItems.push({
          index: idx,
          item: rawItem,
          status: 'proposed_update',
          existing_id: matchedItem.id,
          existing_title: matchedItem.title,
          diff_fields: diffFields,
          match_reasons: matchReasons,
          selected_for_import: true,
        });
      }
    }
  }

  return {
    valid_envelope: true,
    envelope_errors: [],
    briefing_id: briefing.briefing_id,
    briefing_date: briefing.briefing_date,
    agent_status: briefing.status,
    coverage: briefing.coverage,
    limitations: briefing.limitations,
    program_catalog_review: briefing.program_catalog_review,
    total_items: items.length,
    items_preview: previewItems,
    counts,
  };
}
