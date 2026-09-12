import type { BriefingPayload } from '../types.ts';

export const SAMPLE_BRIEFING: BriefingPayload = {
  schema_version: 1,
  briefing_id: 'inspiration-2026-05-12',
  briefing_date: '2026-05-12',
  timezone: 'Asia/Jerusalem',
  status: 'complete',
  coverage: [
    {
      channel: 'workshops',
      status: 'complete',
      note: 'נסקרו 8 מאגרי סדנאות ואירועים פדגוגיים פעילים במאי 2026.',
    },
    {
      channel: 'education_ai',
      status: 'complete',
      note: 'אותרו מחקרים ופיתוחים חדשים של AI בחינוך ובחשיבה יצירתית.',
    },
    {
      channel: 'builder_updates',
      status: 'complete',
      note: 'נבדקו עדכוני חומרה פתוחה, כלי ייצור דיגיטלי וסביבות קידוד.',
    },
    {
      channel: 'college_programs',
      status: 'complete',
      note: 'בוצעה הצלבה מול תוכניות הלימוד הרשמיות של מכללת סמינר הקיבוצים.',
    },
  ],
  program_catalog_review: {
    mode: 'full',
    comparison_status: 'compared',
    verified_programs: [
      {
        name: 'הוראת מדעים וטכנולוגיה',
        level: 'תואר ראשון',
        url: 'https://www.smkb.ac.il/science-education',
        focus: 'פדגוגיה פעילה, חקר סביבתי ומייקינג',
      },
      {
        name: 'טכנולוגיה בחינוך',
        level: 'תואר שני',
        url: 'https://www.smkb.ac.il/educational-technology-med',
        focus: 'חדשנות פדגוגית ובינה מלאכותית בהוראה',
      },
      {
        name: 'חינוך דמוקרטי וקהילתי',
        level: 'לימודי תעודה',
        url: 'https://www.smkb.ac.il/democratic-education',
        focus: 'דיאלוג ביקורתי, מעורבות אזרחית וקהילתיות',
      },
      {
        name: 'אמנות ועיצוב בהוראה',
        level: 'תואר ראשון',
        url: 'https://www.smkb.ac.il/art-education',
        focus: 'עיצוב דיגיטלי, פיסול וחומרים מתקדמים',
      },
    ],
    note: 'הצלבה שיטתית מול ידיעון הלימודים המעודכן לשנת תשפ״ו.',
  },
  limitations: [
    'שני אתרי כנסים בינלאומיים דרשו הרשמה מוקדמת לצפייה בסילבוס המלא.',
    'מידע על מועד נוסף של סדנת המייקינג טרם פורסם רשמית.',
  ],
  items: [
    {
      title: 'סדנת בניית חיישנים סביבתיים מבוססי מיקרובקר בכיתה המדעית',
      channels: ['workshops', 'builder_updates'],
      content_type: 'workshop',
      subjects: ['מייקינג', 'חיישנים', 'קיימות', 'חומרה פתוחה'],
      source_name: 'MakerEd Lab & FabLearn',
      source_url: 'https://makered.org/workshops/environmental-sensing-classroom',
      published_date: '2026-05-02',
      event_date: '2026-06-18',
      novelty: 'newly_published',
      summary:
        'סדנה מעשית שבה מורים בונים תחנות ניטור איכות אוויר וטמפרטורה מחומרים ממוחזרים ומיקרובקר ESP32, תוך חיבור לתהליכי חקר סביבתיים.',
      relevance:
        'מדגימה כיצד לחבר תפיסת מייקר־ספייס פתוחה עם חקר מדעי אותנטי ורלוונטיות קהילתית בסביבת בית הספר.',
      details: {
        audience: 'מורי מדעים וטכנולוגיה, מובילי מייקרספייס וסטודנטים להוראה',
        participant_actions:
          'הרכבת מעגלים על לוחות לחם, חיבור חיישני חלקיקים BME680, כתיבת קוד בלוקים ויצירת מארז מקרטון בחיתוך לייזר.',
        pedagogical_rationale:
          'למידה מבוססת יצירה (Constructionism) שבה תוצר מוחשי משמש כעוגן מושגי להבנת מושגים מופשטים באקולוגיה וחישוב.',
        rationale_basis: 'stated',
        practical_takeaway:
          'מערכי שיעור מודולריים שניתן להתאים לכיתות ד׳ עד ט׳ בעלות חומרים נמוכה של כ-40 ש״ח לעמדה.',
        access_notes: 'פתוח ללא עלות, דורש רישום מקדים',
      },
      program_matches: [
        {
          name: 'הוראת מדעים וטכנולוגיה',
          level: 'תואר ראשון',
          program_url: 'https://www.smkb.ac.il/science-education',
          reason: 'מענה ישיר לחובת התנסות בפדגוגיות אקטיביות ובניית דגמי למידה מבוססי פרויקטים (PBL).',
          workshop_idea:
            'פיתוח יחידת לימוד בנושא משבר האקלים המשלבת איסוף נתונים חיים מחצר המכללה.',
          basis: 'inferred',
        },
      ],
      sources: [
        {
          url: 'https://makered.org/workshops/environmental-sensing-classroom',
          supports: 'תיאור הסדנה, רשימת הרכיבים ומועד הפעילות',
        },
      ],
      program_change: null,
      image: null,
      caveat:
        'הסדנה דורשת מחשב נייד עם חיבור USB פעיל; יש לוודא שהפיירוול המוסדי אינו חוסם תקשורת WebSerial.',
    },
    {
      title: 'מחקר: תפקיד סוכני בינה מלאכותית יוצרת בפיגום חשיבה ביקורתית בקרב פרחי הוראה',
      channels: ['education_ai', 'college_programs'],
      content_type: 'research',
      subjects: ['בינה מלאכותית', 'הכשרת מורים', 'חשיבה ביקורתית', 'פדגוגיה ביקורתית'],
      source_name: 'Journal of Educational Technology & Society',
      source_url: 'https://www.j-ets.net/collection/ai-teacher-education-scaffolding-2026',
      published_date: '2026-04-28',
      event_date: null,
      novelty: 'newly_discovered',
      summary:
        'מחקר אורך המדגים כי שימוש בסוכני AI כ"פרקליט השטן" (Devil\'s Advocate) מחדד את יכולת התכנון הפדגוגי של סטודנטים לעומת שימוש ככלי יצירה בלבד.',
      relevance:
        'חיוני לגיבוש מדיניות פדגוגית אקדמית סביב שילוב AI בהכשרת מורים בסמינר הקיבוצים.',
      details: {
        audience: 'חוקרי חינוך, מרצים להכשרת מורים ומובילי חדשנות',
        participant_actions: 'ניתוח רפלקטיבי של מערכי שיעור בליווי משוב ביקורתי מסוכן שפה',
        pedagogical_rationale:
          'עידוד רפלקציה מטה-קוגניטיבית באמצעות ערעור שיטתי על הנחות יסוד פדגוגיות.',
        rationale_basis: 'inferred',
        practical_takeaway:
          'תבנית פרומפט מובנית לביקורת עמיתים וירטואלית על מערכי שיעור לפני כניסה להתנסות מעשית.',
        access_notes: 'מאמר בגישה פתוחה (Open Access)',
      },
      program_matches: [
        {
          name: 'טכנולוגיה בחינוך',
          level: 'תואר שני',
          program_url: 'https://www.smkb.ac.il/educational-technology-med',
          reason: 'התאמה ישירה לסמינריון מחקר על שילוב טכנולוגיות מתקדמות וסוכני שפה בלמידה.',
          workshop_idea:
            'סדנת ניתוח שיח: השוואה בין משוב מנחה אנושי לבין משוב סוכן AI על מערך שיעור.',
          basis: 'inferred',
        },
        {
          name: 'הסבת אקדמאים להוראה',
          level: 'הסבת אקדמאים',
          program_url: 'https://www.smkb.ac.il/career-change-teaching',
          reason: 'פיתוח אוריינות AI מוקדמת כחלק מההתנסות בהוראה.',
          workshop_idea: 'סדנת סימולציות הוראה עם משוב בינה מלאכותית.',
          basis: 'inferred',
        },
      ],
      sources: [
        {
          url: 'https://www.j-ets.net/collection/ai-teacher-education-scaffolding-2026',
          supports: 'ממצאי המחקר ומערך הניסוי',
        },
      ],
      program_change: null,
      image: null,
      caveat:
        'המחקר נערך בהקשר של כיתות על-יסודיות ויש לבחון בזהירות את השלכותיו על החינוך היסודי והגיל הרך.',
    },
    {
      title: 'Tinkercad Codeblocks 2026: מחולל גיאומטרי תלת־ממדי משולב בלוקים ואלגוריתמיקה',
      channels: ['builder_updates', 'workshops'],
      content_type: 'tool',
      subjects: ['הדפסת תלת ממד', 'תכנות חזותי', 'חשיבה חישובית', 'עיצוב'],
      source_name: 'Autodesk Education Release',
      source_url: 'https://www.tinkercad.com/blog/codeblocks-2026-update',
      published_date: '2026-05-08',
      event_date: null,
      novelty: 'material_update',
      summary:
        'עדכון משמעותי לסביבת Codeblocks המאפשר לתלמידים לעצב אובייקטים להדפסה תלת־ממדית באמצעות אלגוריתמים, לולאות ופרמטרים משתנים.',
      relevance:
        'גשר מצוין בין חשיבה מתמטית וחישובית לבין תוצר חומרי ממשי במרחב המייקרספייס המכללתי.',
      details: {
        audience: 'תלמידי בית ספר יסודי וחט״ב, מורי אמנות, מתמטיקה ומייקינג',
        participant_actions:
          'תכנות קוד חזותי להפקת גופים גיאומטריים, בדיקת עמידות וירטואלית והדפסה במדפסת FDM.',
        pedagogical_rationale:
          'המחשה חזותית וחומרית של מושגים מתמטיים מופשטים (וקטורים, טרנספורמציות, יחסים).',
        rationale_basis: 'stated',
        practical_takeaway: 'כלי חינמי בדפדפן הפועל גם על כרומבוקים ללא צורך בהתקנה מקומית.',
        access_notes: 'פתוח ברשת חינם',
      },
      program_matches: [
        {
          name: 'אמנות ועיצוב בהוראה',
          level: 'תואר ראשון',
          program_url: 'https://www.smkb.ac.il/art-education',
          reason: 'חיבור שפת הקוד והחישוביות ליצירה אמנותית, פיסול דיגיטלי ועיצוב תעשייתי.',
          workshop_idea: 'סדנת יצירת תכשיטים ואריחים גיאומטריים בהשראת אמנות אסלאמית ואופ-ארט.',
          basis: 'inferred',
        },
      ],
      sources: [
        {
          url: 'https://www.tinkercad.com/blog/codeblocks-2026-update',
          supports: 'הכרזה רשמית על גרסת 2026',
        },
      ],
      program_change: null,
      image: null,
      caveat: null,
    },
    {
      title: 'משאב הוראה: ערכת דילמות אתיות במרחב הדיגיטלי לדיון כיתתי',
      channels: ['education_ai', 'college_programs'],
      content_type: 'teaching_resource',
      subjects: ['אתיקה', 'דיגיטל', 'דיאלוג פדגוגי', 'אזרחות דיגיטלית'],
      source_name: 'מרכז פדגוגי מקוון — מופ״ת',
      source_url: 'https://www.mofet.macam.ac.il/resources/digital-ethics-dilemma-kit',
      published_date: '2026-05-04',
      event_date: null,
      novelty: 'newly_published',
      summary:
        'ערכה אינטראקטיבית הכוללת 20 כרטיסי דילמה (זיופי Deepfake, ניטור נוכחות ביומטרי, פרטיות ברשתות), עם שאלות מנחות לדיאלוג ביקורתי בכיתה.',
      relevance:
        'מעניקה לפרחי הוראה כלים מיידיים להנחיית דיונים ערכיים בנושאי טכנולוגיה וחברה.',
      details: {
        audience: 'מחנכי כיתות, מורי מדעי החברה ופרחי הוראה',
        participant_actions:
          'משחקי תפקידים, ניתוח נקודות מבט מנוגדות וניסוח קוד אתי כיתתי.',
        pedagogical_rationale:
          'חינוך הומניסטי-דיאלוגי ברוח משנתו של פאולו פריירה והפדגוגיה החברתית-ביקורתית.',
        rationale_basis: 'stated',
        practical_takeaway: 'קובץ PDF מעוצב להדפסה דו-צדדית ומצגת מלווה בפורמט פתוח לעריכה.',
        access_notes: 'פתוח להורדה חופשית למורים',
      },
      program_matches: [
        {
          name: 'חינוך דמוקרטי וקהילתי',
          level: 'לימודי תעודה',
          program_url: 'https://www.smkb.ac.il/democratic-education',
          reason: 'מתכתב ישירות עם עקרונות המעורבות האזרחית, שוויון ודיאלוג שוויוני בכיתה.',
          workshop_idea: 'סימולציית ועדת אתיקה בית-ספרית הדנה בתקנון שימוש בטלפונים ו-AI.',
          basis: 'inferred',
        },
      ],
      sources: [
        {
          url: 'https://www.mofet.macam.ac.il/resources/digital-ethics-dilemma-kit',
          supports: 'קובץ הערכה ומדריך ההנחיה',
        },
      ],
      program_change: null,
      image: null,
      caveat: 'מומלץ להקדים לדיון יצירת מרחב בטוח והסכמה על תרבות שיח מכבדת.',
    },
    {
      title: 'מקרה בוחן: הטמעת גינת רובוטיקה הידרופונית קהילתית בבית ספר יסודי',
      channels: ['workshops', 'builder_updates'],
      content_type: 'case_study',
      subjects: ['רובוטיקה', 'הידרופוניקה', 'מעורבות קהילתית', 'קיימות'],
      source_name: 'FabLearn Fellows Archive',
      source_url: 'https://fablearn.org/case-studies/hydroponics-elementary-makerspace',
      published_date: '2026-04-15',
      event_date: null,
      novelty: 'newly_discovered',
      summary:
        'תיעוד מפורט של תהליך בן שנתיים בבית ספר יסודי בחיפה, שבו הוקמה מערכת הידרופונית אוטומטית המופעלת ומתוחזקת במלואה על ידי תלמידי כיתות ה׳–ו׳.',
      relevance:
        'מדגים דוגמה מובהקת של מייקינג בר-קיימא שאינו מסתכם ביצירת חפצי פלסטיק חסרי ערך מתמשך.',
      details: {
        audience: 'מובילי פדגוגיה סביבתית, מורי מדעים ומנהלי בתי ספר',
        participant_actions:
          'מדידת חומציות (pH), כיול חיישני מוליכות, תכנות בקר ארדואינו וחלוקת ירקות למטבח הקהילתי.',
        pedagogical_rationale:
          'למידה דרך פתרון בעיות אמיתיות בסביבה (Problem-Based Learning) תוך חיזוק תחושת מסוגלות ואחריות קהילתית.',
        rationale_basis: 'stated',
        practical_takeaway: 'מדריך שלב-אחר-שלב, שרטוטי ייצור במייקרספייס ורשימת רכיבים מלאה.',
        access_notes: 'תיעוד פתוח ברשת',
      },
      program_matches: [
        {
          name: 'הוראת מדעים וטכנולוגיה',
          level: 'תואר ראשון',
          program_url: 'https://www.smkb.ac.il/science-education',
          reason: 'המחשה מצוינת לשילוב בוטניקה, פיזיקה ומערכות בקרה בתכנית הלימודים היסודית.',
          workshop_idea: 'הקמת מתקן הדגמה הידרופוני זעיר במעבדת ההוראה בסמינר.',
          basis: 'inferred',
        },
      ],
      sources: [
        {
          url: 'https://fablearn.org/case-studies/hydroponics-elementary-makerspace',
          supports: 'תיאור הפרויקט ותוצרי התלמידים',
        },
      ],
      program_change: null,
      image: null,
      caveat: null,
    },
  ],
};
