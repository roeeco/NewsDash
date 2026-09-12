import type { LibraryItem } from '../types.ts';

const CHANNEL_LABELS: Record<string, string> = {
  workshops: 'סדנאות למורים',
  education_ai: 'חינוך ובינה מלאכותית',
  builder_updates: 'עדכוני כלי בנייה',
  college_programs: 'תוכניות לימוד',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  workshop: 'סדנה',
  webinar: 'וובינר',
  research: 'מחקר',
  article: 'מאמר',
  tool: 'כלי',
  product_update: 'עדכון מוצר',
  case_study: 'מקרה בוחן',
  teaching_resource: 'משאב הוראה',
  program_update: 'עדכון תוכנית לימודים',
};

const NOVELTY_LABELS: Record<string, string> = {
  newly_published: 'פורסם לאחרונה',
  newly_discovered: 'התגלה בסקירה',
  material_update: 'עדכון מהותי',
};

const USER_STATUS_LABELS: Record<string, string> = {
  new: 'חדש',
  to_read: 'לקריאה',
  saved: 'נשמר',
  tried: 'נוסה',
  archived: 'ארכיון',
};

/**
 * Sanitize cell text against CSV formula injection without altering raw underlying database data
 */
function sanitizeCellForCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val);

  // Check for formula injection triggers
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaChars.includes(str.charAt(0))) {
    str = `'${str}`;
  }

  // Escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsvString(items: LibraryItem[], includePersonalData = false): string {
  const headers = [
    'מזהה פריט',
    'כותרת',
    'סוג תוכן',
    'ערוצי איסוף',
    'נושאים',
    'מקור ראשי',
    'כתובת מקור',
    'תאריך פרסום',
    'מועד אירוע',
    'חידוש',
    'תקציר',
    'רלוונטיות',
    'קהל יעד',
    'מה המשתתפים עושים',
    'היגיון פדגוגי',
    'בסיס ההיגיון',
    'מה אפשר ללמוד',
    'הערות גישה',
    'תוכניות לימוד מותאמות (תקציר)',
    'תוכניות לימוד מותאמות (JSON)',
    'אסמכתאות (תקציר)',
    'אסמכתאות (JSON)',
    'שינוי בתוכנית לימודים',
    'הסתייגות',
    'מזהה תדריך',
    'תאריך תדריך',
    'תאריך הוספה',
  ];

  if (includePersonalData) {
    headers.push('דירוג אישי (1-5)', 'סטטוס אישי', 'הערה אישית');
  }

  const rows: string[] = [];
  rows.push(headers.map(sanitizeCellForCsv).join(','));

  for (const item of items) {
    const channelsStr = (item.channels || []).map((c) => CHANNEL_LABELS[c] || c).join(' | ');
    const subjectsStr = (item.subjects || []).join(' | ');
    const contentTypeStr = CONTENT_TYPE_LABELS[item.content_type] || item.content_type;
    const noveltyStr = NOVELTY_LABELS[item.novelty] || item.novelty;

    const programMatchesSummary = (item.program_matches || [])
      .map((p) => `${p.name} (${p.level}): ${p.reason}`)
      .join(' | ');

    const sourcesSummary = (item.sources || []).map((s) => `${s.url} [${s.supports}]`).join(' | ');

    const programChangeSummary = item.program_change
      ? `${item.program_change.kind}: ${item.program_change.previous} -> ${item.program_change.current} (${item.program_change.comparison_basis})`
      : '';

    const rationaleBasisHebrew =
      item.details?.rationale_basis === 'inferred'
        ? 'פרשנות על בסיס המקור'
        : item.details?.rationale_basis === 'stated'
          ? 'מופיע בתיאור המקור'
          : '';

    const row = [
      item.id,
      item.title,
      contentTypeStr,
      channelsStr,
      subjectsStr,
      item.source_name,
      item.source_url,
      item.published_date || '',
      item.event_date || '',
      noveltyStr,
      item.summary,
      item.relevance,
      item.details?.audience || '',
      item.details?.participant_actions || '',
      item.details?.pedagogical_rationale || '',
      rationaleBasisHebrew,
      item.details?.practical_takeaway || '',
      item.details?.access_notes || '',
      programMatchesSummary,
      JSON.stringify(item.program_matches || []),
      sourcesSummary,
      JSON.stringify(item.sources || []),
      programChangeSummary,
      item.caveat || '',
      item.briefing_id,
      item.briefing_date,
      item.created_at,
    ];

    if (includePersonalData) {
      row.push(
        item.user_state?.rating !== null && item.user_state?.rating !== undefined
          ? String(item.user_state.rating)
          : 'ללא דירוג',
        USER_STATUS_LABELS[item.user_state?.status || 'new'] || item.user_state?.status || 'חדש',
        item.user_state?.personal_note || ''
      );
    }

    rows.push(row.map(sanitizeCellForCsv).join(','));
  }

  // Prepend UTF-8 BOM for Hebrew support in Microsoft Excel
  return '\uFEFF' + rows.join('\r\n');
}
