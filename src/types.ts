/**
 * Types definition for "ספריית השראה" (Inspiration Library)
 * Conforming strictly to inspiration-briefing.schema.json v1 and application persistence requirements.
 */

export type Channel = 'workshops' | 'education_ai' | 'builder_updates' | 'college_programs';

export type ContentType =
  | 'workshop'
  | 'webinar'
  | 'research'
  | 'article'
  | 'tool'
  | 'product_update'
  | 'case_study'
  | 'teaching_resource'
  | 'program_update';

export type Novelty = 'newly_published' | 'newly_discovered' | 'material_update';

export type AcademicLevel = 'תואר ראשון' | 'תואר שני' | 'לימודי תעודה' | 'הסבת אקדמאים';

export type RationaleBasis = 'stated' | 'inferred' | null;

export type ProgramChangeKind = 'added' | 'removed' | 'renamed' | 'focus_changed';

export type UserStatus = 'new' | 'to_read' | 'saved' | 'tried' | 'archived';

export interface ItemDetails {
  audience: string | null;
  participant_actions: string | null;
  pedagogical_rationale: string | null;
  rationale_basis: RationaleBasis;
  practical_takeaway: string | null;
  access_notes: string | null;
}

export interface ProgramMatch {
  name: string;
  level: AcademicLevel;
  program_url: string;
  reason: string;
  workshop_idea: string;
  basis: 'inferred';
}

export interface SourceCitation {
  url: string;
  supports: string;
}

export interface ProgramChange {
  kind: ProgramChangeKind;
  previous: string;
  current: string;
  comparison_basis: string;
}

export interface ItemImage {
  url: string;
  alt: string;
  source_url: string;
  usage_note: string;
}

export interface SchemaItem {
  title: string;
  channels: Channel[];
  content_type: ContentType;
  subjects: string[];
  source_name: string;
  source_url: string;
  published_date: string | null;
  event_date: string | null;
  novelty: Novelty;
  summary: string;
  relevance: string;
  details: ItemDetails;
  program_matches: ProgramMatch[];
  sources: SourceCitation[];
  program_change: ProgramChange | null;
  image: ItemImage | null;
  caveat: string | null;
}

export interface CoverageItem {
  channel: Channel;
  status: 'complete' | 'partial' | 'failed' | 'not_due';
  note: string;
}

export interface VerifiedProgram {
  name: string;
  level: AcademicLevel;
  url: string;
  focus: string;
}

export interface ProgramCatalogReview {
  mode: 'baseline' | 'targeted' | 'full';
  comparison_status: 'baseline_only' | 'compared' | 'not_compared';
  verified_programs: VerifiedProgram[];
  note: string | null;
}

export interface BriefingPayload {
  schema_version: 1;
  briefing_id: string;
  briefing_date: string;
  timezone: 'Asia/Jerusalem';
  status: 'complete' | 'partial' | 'failed';
  coverage: [CoverageItem, CoverageItem, CoverageItem, CoverageItem];
  program_catalog_review: ProgramCatalogReview;
  limitations: string[];
  items: SchemaItem[];
}

export interface ItemUserState {
  rating: 1 | 2 | 3 | 4 | 5 | null;
  status: UserStatus;
  personal_note: string;
  updated_at: string;
}

export interface LibraryItem extends SchemaItem {
  id: string;
  briefing_id: string;
  briefing_date: string;
  created_at: string;
  updated_at: string;
  manually_edited?: boolean;
  user_state: ItemUserState;
}

export interface BriefingRecord {
  briefing_id: string;
  briefing_date: string;
  timezone: string;
  status: 'complete' | 'partial' | 'failed';
  coverage: CoverageItem[];
  program_catalog_review: ProgramCatalogReview;
  limitations: string[];
  imported_at: string;
  items_count: number;
}

export interface ImportLogRecord {
  id: string;
  timestamp: string;
  briefing_id: string;
  briefing_date: string;
  agent_status: 'complete' | 'partial' | 'failed';
  import_status: 'success' | 'partial' | 'failed';
  added_count: number;
  updated_count: number;
  skipped_count: number;
  unaccepted_count: number;
  unaccepted_details?: Array<{ title: string; reason: string }>;
  limitations: string[];
  notes: string;
}

export type PreviewItemStatus =
  | 'new'
  | 'existing_unchanged'
  | 'proposed_update'
  | 'suspected_duplicate'
  | 'invalid';

export interface ValidationPreviewItem {
  index: number;
  item: SchemaItem;
  status: PreviewItemStatus;
  existing_id?: string;
  existing_title?: string;
  diff_fields?: string[];
  match_reasons?: string[];
  validation_errors?: string[];
  selected_for_import: boolean;
}

export interface BriefingValidationResult {
  valid_envelope: boolean;
  envelope_errors: string[];
  briefing_id?: string;
  briefing_date?: string;
  agent_status?: 'complete' | 'partial' | 'failed';
  coverage?: CoverageItem[];
  limitations?: string[];
  program_catalog_review?: ProgramCatalogReview;
  total_items: number;
  items_preview: ValidationPreviewItem[];
  counts: {
    new: number;
    existing_unchanged: number;
    proposed_update: number;
    suspected_duplicate: number;
    invalid: number;
  };
  is_backup_file?: boolean;
}

export interface BackupFormat {
  format: 'inspiration-library-backup';
  version: 1;
  schema_version: 1;
  exported_at: string;
  scope: 'full' | 'filtered' | 'selected';
  stats: {
    total_items: number;
    total_briefings: number;
    total_logs: number;
  };
  items: LibraryItem[];
  briefings: BriefingRecord[];
  import_logs: ImportLogRecord[];
}

export interface FilterState {
  search: string;
  quickView: 'all' | 'latest_briefing' | 'high_rating' | 'saved' | 'tried' | 'unrated' | 'archived';
  dateRange: 'all' | 'today' | '7_days' | '30_days' | 'custom';
  dateField: 'briefing_date' | 'created_at' | 'published_date' | 'event_date';
  customDateStart?: string;
  customDateEnd?: string;
  contentTypes: ContentType[];
  channels: Channel[];
  subjects: string[];
  subjectMatchAll: boolean;
  source: string;
  program: string;
  academicLevel: AcademicLevel | '';
  minRating: number | null; // null or 1-5, or 'unrated'
  userStatus: UserStatus | '';
  hasPersonalNote: boolean;
  hasProgramMatch: boolean;
}

export type NavigationTab = 'library' | 'programs' | 'import' | 'backup';

export interface LibraryStats {
  total_items: number;
  total_briefings: number;
  last_import_at: string | null;
  last_briefing_date: string | null;
  last_briefing_id: string | null;
}

export type SortField =
  | 'briefing_date'
  | 'created_at'
  | 'published_date'
  | 'event_date'
  | 'rating'
  | 'title'
  | 'content_type'
  | 'subject';

export type SortOrder = 'asc' | 'desc';
