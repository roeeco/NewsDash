import type { ContentType } from '../types.ts';

export interface ContentTypeMeta {
  value: ContentType;
  label: string;
  badgeClass: string;
  dotClass: string;
  accentBorder: string;
  filterActiveClass: string;
  filterInactiveClass: string;
  description: string;
}

export const CONTENT_TYPE_REGISTRY: Record<ContentType, ContentTypeMeta> = {
  research: {
    value: 'research',
    label: 'מחקר',
    badgeClass: 'bg-[#EEF2F6] text-[#1E3A5F] border-[#C7D7E8]',
    dotClass: 'bg-[#2563EB]',
    accentBorder: 'border-r-[#2563EB]',
    filterActiveClass: 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-xs',
    filterInactiveClass: 'bg-[#EEF2F6]/60 text-[#1E3A5F] border-[#C7D7E8] hover:bg-[#EEF2F6]',
    description: 'מאמרים אקדמיים, סקירות ספרות ומחקרי שדה',
  },
  tool: {
    value: 'tool',
    label: 'כלי',
    badgeClass: 'bg-[#E6F4F1] text-[#0D5C4D] border-[#BCE2DB]',
    dotClass: 'bg-[#0F766E]',
    accentBorder: 'border-r-[#0F766E]',
    filterActiveClass: 'bg-[#0D5C4D] text-white border-[#0D5C4D] shadow-xs',
    filterInactiveClass: 'bg-[#E6F4F1]/60 text-[#0D5C4D] border-[#BCE2DB] hover:bg-[#E6F4F1]',
    description: 'פלטפורמות, תוכנות וכלי בינה מלאכותית ומייקינג',
  },
  workshop: {
    value: 'workshop',
    label: 'סדנה',
    badgeClass: 'bg-[#FBF2E9] text-[#8F4824] border-[#F2D8C2]',
    dotClass: 'bg-[#C2673B]',
    accentBorder: 'border-r-[#C2673B]',
    filterActiveClass: 'bg-[#8F4824] text-white border-[#8F4824] shadow-xs',
    filterInactiveClass: 'bg-[#FBF2E9]/60 text-[#8F4824] border-[#F2D8C2] hover:bg-[#FBF2E9]',
    description: 'פעילויות מעשיות, סדנאות מייקרים והתנסויות',
  },
  case_study: {
    value: 'case_study',
    label: 'מקרה בוחן',
    badgeClass: 'bg-[#F7EDF4] text-[#702459] border-[#E8C9DF]',
    dotClass: 'bg-[#9D2D7D]',
    accentBorder: 'border-r-[#9D2D7D]',
    filterActiveClass: 'bg-[#702459] text-white border-[#702459] shadow-xs',
    filterInactiveClass: 'bg-[#F7EDF4]/60 text-[#702459] border-[#E8C9DF] hover:bg-[#F7EDF4]',
    description: 'ניתוח מקרים מהשטח ודוגמאות יישום פדגוגי',
  },
  teaching_resource: {
    value: 'teaching_resource',
    label: 'משאב הוראה',
    badgeClass: 'bg-[#EDF5EE] text-[#1E5E3A] border-[#C4E3CA]',
    dotClass: 'bg-[#228B53]',
    accentBorder: 'border-r-[#228B53]',
    filterActiveClass: 'bg-[#1E5E3A] text-white border-[#1E5E3A] shadow-xs',
    filterInactiveClass: 'bg-[#EDF5EE]/60 text-[#1E5E3A] border-[#C4E3CA] hover:bg-[#EDF5EE]',
    description: 'מערכי שיעור, דפי הנחיה ומדריכים להוראה',
  },
  article: {
    value: 'article',
    label: 'מאמר',
    badgeClass: 'bg-[#F4EFEA] text-[#5C4434] border-[#DFD3C7]',
    dotClass: 'bg-[#7A5B47]',
    accentBorder: 'border-r-[#7A5B47]',
    filterActiveClass: 'bg-[#5C4434] text-white border-[#5C4434] shadow-xs',
    filterInactiveClass: 'bg-[#F4EFEA]/60 text-[#5C4434] border-[#DFD3C7] hover:bg-[#F4EFEA]',
    description: 'מאמרי דעה, סקירות מגמות ומסות עיוניות',
  },
  webinar: {
    value: 'webinar',
    label: 'וובינר',
    badgeClass: 'bg-[#F1EEF9] text-[#4C2D82] border-[#D7CEF0]',
    dotClass: 'bg-[#6B46C1]',
    accentBorder: 'border-r-[#6B46C1]',
    filterActiveClass: 'bg-[#4C2D82] text-white border-[#4C2D82] shadow-xs',
    filterInactiveClass: 'bg-[#F1EEF9]/60 text-[#4C2D82] border-[#D7CEF0] hover:bg-[#F1EEF9]',
    description: 'הרצאות מקוונות, מפגשי זום והקלטות וידאו',
  },
  product_update: {
    value: 'product_update',
    label: 'עדכון מוצר',
    badgeClass: 'bg-[#ECEFF3] text-[#334155] border-[#CBD5E1]',
    dotClass: 'bg-[#475569]',
    accentBorder: 'border-r-[#475569]',
    filterActiveClass: 'bg-[#334155] text-white border-[#334155] shadow-xs',
    filterInactiveClass: 'bg-[#ECEFF3]/60 text-[#334155] border-[#CBD5E1] hover:bg-[#ECEFF3]',
    description: 'עדכוני גרסאות, תכונות חדשות והכרזות',
  },
  program_update: {
    value: 'program_update',
    label: 'עדכון תוכנית לימודים',
    badgeClass: 'bg-[#F4F4E8] text-[#525419] border-[#DDDDB8]',
    dotClass: 'bg-[#6B6D24]',
    accentBorder: 'border-r-[#6B6D24]',
    filterActiveClass: 'bg-[#525419] text-white border-[#525419] shadow-xs',
    filterInactiveClass: 'bg-[#F4F4E8]/60 text-[#525419] border-[#DDDDB8] hover:bg-[#F4F4E8]',
    description: 'שינויים והתאמות בסילבוסים ובמסלולי הוראה',
  },
};

const DEFAULT_META: ContentTypeMeta = {
  value: 'workshop',
  label: 'סדנה',
  badgeClass: 'bg-[#F0ECE4] text-[#3D352E] border-[#DDD6CB]',
  dotClass: 'bg-[#3D352E]',
  accentBorder: 'border-r-[#3D352E]',
  filterActiveClass: 'bg-[#1C2024] text-white border-[#14181F]',
  filterInactiveClass: 'bg-[#FAF8F5] text-[#556070] border-[#E5DFD5] hover:bg-white',
  description: '',
};

export function getContentTypeMeta(type: string): ContentTypeMeta {
  return CONTENT_TYPE_REGISTRY[type as ContentType] || {
    ...DEFAULT_META,
    value: type as ContentType,
    label: type,
  };
}

export const ALL_CONTENT_TYPES: ContentTypeMeta[] = [
  CONTENT_TYPE_REGISTRY.research,
  CONTENT_TYPE_REGISTRY.tool,
  CONTENT_TYPE_REGISTRY.workshop,
  CONTENT_TYPE_REGISTRY.case_study,
  CONTENT_TYPE_REGISTRY.teaching_resource,
  CONTENT_TYPE_REGISTRY.article,
  CONTENT_TYPE_REGISTRY.webinar,
  CONTENT_TYPE_REGISTRY.product_update,
  CONTENT_TYPE_REGISTRY.program_update,
];
