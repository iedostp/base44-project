import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DEFAULT_STAGES = [
  { title: 'התארגנות ככלי ביטוח וגידור חשש מאישור תחילת עבודות', order: 1, duration: '1-2 שבועות', budget_percentage: '1.5%', priority: 'גבוהה', icon_name: 'FileText',
    tasks: [
      { text: 'סימון המגרש והכנת גישה', duration: '1-2 ימים', priority: 'גבוהה', order: 1 },
      { text: 'הכנת ביטוח ומסמכי רישוי', duration: '1 שבוע', priority: 'גבוהה', order: 2 },
      { text: 'גידור האתר', duration: '2-3 ימים', priority: 'גבוהה', order: 3 },
    ]
  },
  { title: 'גמר קרקעים וחפירת כללואות', order: 2, duration: '2-3 שבועות', budget_percentage: '7.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'חפירת יסודות', duration: '1 שבוע', priority: 'גבוהה', order: 1 },
      { text: 'הכנת ברזל לביסוס', duration: '1 שבוע', priority: 'גבוהה', order: 2 },
      { text: 'יציקת בטון', duration: '3-5 ימים', priority: 'גבוהה', order: 3 },
    ]
  },
  { title: 'גמר ביסוס ועבודות עפר למילוי וקירוי השטח', order: 3, duration: '2-3 שבועות', budget_percentage: '3.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'הכנת ברזל לביסוס', duration: '1 שבוע', priority: 'גבוהה', order: 1 },
      { text: 'מילוי עפר וצפיפות', duration: '3-5 ימים', priority: 'גבוהה', order: 2 },
      { text: 'קירוי שטח', duration: '1-2 ימים', priority: 'בינונית', order: 3 },
    ]
  },
  { title: 'גמר יציקת קורות יסוד', order: 4, duration: '1-2 שבועות', budget_percentage: '5.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'הכנת ברזל לקורות יסוד', duration: '3-5 ימים', priority: 'גבוהה', order: 1 },
      { text: 'יציקת קורות יסוד', duration: '2-3 ימים', priority: 'גבוהה', order: 2 },
      { text: 'ייבוש ובדיקה', duration: '3-5 ימים', priority: 'גבוהה', order: 3 },
    ]
  },
  { title: 'גמר יציקת קורת קשר', order: 5, duration: '1 שבוע', budget_percentage: '4.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'הכנת ברזל לקורת קשר', duration: '2-3 ימים', priority: 'גבוהה', order: 1 },
      { text: 'יציקת קורת קשר', duration: '1-2 ימים', priority: 'גבוהה', order: 2 },
    ]
  },
  { title: 'גמר יציקת משטחת GSB והמ"ד קומת קרקע', order: 6, duration: '2-3 שבועות', budget_percentage: '8.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'הכנת תשתית GSB', duration: '1 שבוע', priority: 'גבוהה', order: 1 },
      { text: 'הכנת ברזל למ"ד', duration: '1 שבוע', priority: 'גבוהה', order: 2 },
      { text: 'יציקת משטחות', duration: '3-5 ימים', priority: 'גבוהה', order: 3 },
    ]
  },
  { title: 'גמר יציקת חגרה קומת קרקע', order: 7, duration: '1-2 שבועות', budget_percentage: '5.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'הכנת ברזל לחגרות', duration: '3-5 ימים', priority: 'גבוהה', order: 1 },
      { text: 'יציקת חגרות', duration: '2-3 ימים', priority: 'גבוהה', order: 2 },
    ]
  },
  { title: 'גמר יציקת משטחת קומה ראשונה GSB', order: 8, duration: '2-3 שבועות', budget_percentage: '8.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'הכנת תשתית GSB קומה ראשונה', duration: '1 שבוע', priority: 'גבוהה', order: 1 },
      { text: 'יציקת משטח קומה ראשונה', duration: '3-5 ימים', priority: 'גבוהה', order: 2 },
    ]
  },
  { title: 'גמר שלד קומפלט ומשטלם ככלי יציקות פרטות', order: 9, duration: '2-3 שבועות', budget_percentage: '6.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'השלמת שלד', duration: '1 שבוע', priority: 'גבוהה', order: 1 },
      { text: 'יציקות פרטות', duration: '1 שבוע', priority: 'גבוהה', order: 2 },
    ]
  },
  { title: 'גמר הבניות הרטובות וחוזר להמשך עבודות', order: 10, duration: '1-2 שבועות', budget_percentage: '3.0%', priority: 'גבוהה', icon_name: 'Hammer',
    tasks: [
      { text: 'בניית קירות פנים', duration: '1 שבוע', priority: 'גבוהה', order: 1 },
      { text: 'בניית קירות חיצוניים', duration: '1 שבוע', priority: 'גבוהה', order: 2 },
      { text: 'בדיקת בניות', duration: '1-2 ימים', priority: 'בינונית', order: 3 },
    ]
  },
  { title: 'גמר הכנת צינורת מים לפני ניח', order: 11, duration: '1 שבוע', budget_percentage: '2.0%', priority: 'בינונית', icon_name: 'Settings',
    tasks: [
      { text: 'הכנת צנרת מים קרים וחמים', duration: '3-5 ימים', priority: 'גבוהה', order: 1 },
      { text: 'בדיקות לחץ', duration: '1-2 ימים', priority: 'גבוהה', order: 2 },
    ]
  },
  { title: 'אספקה כללים סניטרים לשטח', order: 12, duration: '1 שבוע', budget_percentage: '2.5%', priority: 'בינונית', icon_name: 'ShoppingCart',
    tasks: [
      { text: 'רכישת כלים סניטריים', duration: '1 שבוע', priority: 'בינונית', order: 1 },
    ]
  },
  { title: 'גמר תחילת רכש סניטרים', order: 13, duration: '1 שבוע', budget_percentage: '0.5%', priority: 'בינונית', icon_name: 'ShoppingCart',
    tasks: [
      { text: 'התקנת כלים סניטריים', duration: '1-2 ימים', priority: 'בינונית', order: 1 },
    ]
  },
  { title: 'גמר התקנות דודים', order: 14, duration: '1 שבוע', budget_percentage: '1.0%', priority: 'בינונית', icon_name: 'Settings',
    tasks: [
      { text: 'התקנת דודים', duration: '1-2 ימים', priority: 'בינונית', order: 1 },
    ]
  },
  { title: 'גמר הכנות נגש"ת במהח ובכוון', order: 15, duration: '1 שבוע', budget_percentage: '1.0%', priority: 'בינונית', icon_name: 'Settings',
    tasks: [
      { text: 'הכנת תשתיות חשמל', duration: '3-5 ימים', priority: 'בינונית', order: 1 },
    ]
  },
  { title: 'השקעת חוטים וחומרי לבן ככלי הבנית מילוי אוף גג', order: 16, duration: '1-2 שבועות', budget_percentage: '1.0%', priority: 'בינונית', icon_name: 'Settings',
    tasks: [
      { text: 'התקנת ליזוזות חשמל', duration: '2-3 ימים', priority: 'בינונית', order: 1 },
      { text: 'השקעת חוטים', duration: '3-5 ימים', priority: 'בינונית', order: 2 },
    ]
  },
  { title: 'גמר טיח פנים וחוץ', order: 17, duration: '2-3 שבועות', budget_percentage: '4.0%', priority: 'בינונית', icon_name: 'Hammer',
    tasks: [
      { text: 'טיח פנים', duration: '1 שבוע', priority: 'בינונית', order: 1 },
      { text: 'טיח חוץ', duration: '1 שבוע', priority: 'בינונית', order: 2 },
    ]
  },
  { title: 'גמר ריצוף ואיטום', order: 18, duration: '2-3 שבועות', budget_percentage: '5.0%', priority: 'בינונית', icon_name: 'Hammer',
    tasks: [
      { text: 'איטום חדרים רטובים', duration: '1-2 ימים', priority: 'גבוהה', order: 1 },
      { text: 'ריצוף כלל הבית', duration: '1-2 שבועות', priority: 'בינונית', order: 2 },
      { text: 'איטום קיר חיצוני', duration: '1-2 ימים', priority: 'גבוהה', order: 3 },
    ]
  },
  { title: 'גמר צבע פנים וחוץ', order: 19, duration: '2-3 שבועות', budget_percentage: '3.0%', priority: 'בינונית', icon_name: 'Hammer',
    tasks: [
      { text: 'צביעת קירות פנים', duration: '1 שבוע', priority: 'בינונית', order: 1 },
      { text: 'צביעת קירות חוץ', duration: '1 שבוע', priority: 'בינונית', order: 2 },
    ]
  },
  { title: 'גמר מסגרות וחלונות', order: 20, duration: '1-2 שבועות', budget_percentage: '3.5%', priority: 'בינונית', icon_name: 'Hammer',
    tasks: [
      { text: 'התקנת משקופי אלומיניום', duration: '1 שבוע', priority: 'בינונית', order: 1 },
      { text: 'התקנת ספי שיש בחלונות', duration: '1 שבוע', priority: 'נמוכה', order: 2 },
    ]
  },
  { title: 'גמר נגרות ודלתות', order: 21, duration: '2-3 שבועות', budget_percentage: '4.0%', priority: 'בינונית', icon_name: 'Hammer',
    tasks: [
      { text: 'עבודות גג', duration: '1 שבוע', priority: 'בינונית', order: 1 },
      { text: 'התקנת פרגולות', duration: '1 שבוע', priority: 'נמוכה', order: 2 },
      { text: 'התקנת דלתות פנים', duration: '3-5 ימים', priority: 'בינונית', order: 3 },
    ]
  },
  { title: 'גמר כניסה ופיתוח חצר', order: 22, duration: '1-2 שבועות', budget_percentage: '3.0%', priority: 'נמוכה', icon_name: 'Hammer',
    tasks: [
      { text: 'התקנת דלת כניסה ראשית', duration: '1 יום', priority: 'בינונית', order: 1 },
      { text: 'עבודות פיתוח חצר', duration: '1 שבוע', priority: 'נמוכה', order: 2 },
    ]
  },
  { title: 'מסירה וגמר', order: 23, duration: '1-2 שבועות', budget_percentage: '1.0%', priority: 'גבוהה', icon_name: 'CheckSquare',
    tasks: [
      { text: 'הכנת חשבונות למועצה', duration: '2-3 ימים', priority: 'גבוהה', order: 1 },
      { text: 'מסירה סופית', duration: '1-2 ימים', priority: 'גבוהה', order: 2 },
    ]
  },
];

const DEFAULT_SUPPLIERS = [
  { name: 'חלונות אלפא', category: 'windows', contact_phone: '03-1234567', email: 'info@alpha-windows.co.il', address: 'תל אביב', rating: 4.5, price_range: 'בינוני-גבוה', notes: 'מתמחים בחלונות אלומיניום מבודדים', status: 'not_contacted' },
  { name: 'קרמיקה בע"מ', category: 'tiles', contact_phone: '08-7654321', email: 'sales@ceramics.co.il', address: 'אשדוד', rating: 4.2, price_range: 'בינוני', notes: 'מבחר גדול של ריצוף וחיפויים', status: 'not_contacted' },
  { name: 'מטבחי דלתא', category: 'kitchen', contact_phone: '09-1112233', email: 'kitchen@delta.co.il', address: 'חיפה', rating: 4.7, price_range: 'גבוה', notes: 'מטבחים מותאמים אישית עם אחריות 10 שנים', status: 'not_contacted' },
  { name: 'סניטציה ישראל', category: 'sanitary', contact_phone: '03-4445566', email: 'info@sanitary.co.il', address: 'נתניה', rating: 4.0, price_range: 'בינוני', notes: 'ייבוא ישיר מאירופה', status: 'not_contacted' },
  { name: 'מזגנים טמפ', category: 'ac', contact_phone: '077-1234567', email: 'ac@temp.co.il', address: 'ראשון לציון', rating: 4.3, price_range: 'בינוני', notes: 'התקנה ותחזוקה לכל סוגי המזגנים', status: 'not_contacted' },
  { name: 'חשמל בית', category: 'electrical', contact_phone: '050-9876543', email: 'electrichome@gmail.com', address: 'ירושלים', rating: 4.8, price_range: 'גבוה', notes: 'מומחים למערכות חשמל חכמות', status: 'not_contacted' },
  { name: 'נגרייה מקצועית', category: 'carpentry', contact_phone: '04-1234567', email: 'wood@pro.co.il', address: 'חיפה', rating: 4.4, price_range: 'בינוני', notes: 'ריהוט ועבודות עץ מותאמות', status: 'not_contacted' },
  { name: 'אינסטלציה בהמה', category: 'plumbing', contact_phone: '02-9876543', email: 'plumbing@co.il', address: 'ירושלים', rating: 4.1, price_range: 'בינוני', notes: 'התמחות בצנרת ואינסטלציה', status: 'not_contacted' },
  { name: 'צבע מקצועי', category: 'painting', contact_phone: '03-5556677', email: 'paint@pro.co.il', address: 'רמת גן', rating: 4.3, price_range: 'נמוך', notes: 'צביעה מקצועית פנים וחוץ', status: 'not_contacted' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = body.project_id;
    if (!projectId) return Response.json({ error: 'project_id required' }, { status: 400 });

    // Check if stages already exist
    const existingStages = await base44.entities.Stage.filter({ project_id: projectId });
    if (existingStages.length > 0) {
      return Response.json({ status: 'already_initialized', stages: existingStages.length });
    }

    // Create all stages and their tasks
    let stagesCreated = 0;
    let tasksCreated = 0;

    for (const stageDef of DEFAULT_STAGES) {
      const { tasks: taskDefs, ...stageData } = stageDef;
      const stage = await base44.entities.Stage.create({ ...stageData, project_id: projectId, completed: false });
      stagesCreated++;

      for (const taskDef of taskDefs) {
        await base44.entities.Task.create({ ...taskDef, stage_id: stage.id, done: false });
        tasksCreated++;
      }
    }

    // Create default suppliers
    let suppliersCreated = 0;
    const existingSuppliers = await base44.entities.Supplier.filter({ project_id: projectId });
    if (existingSuppliers.length === 0) {
      for (const supplierDef of DEFAULT_SUPPLIERS) {
        await base44.entities.Supplier.create({ ...supplierDef, project_id: projectId });
        suppliersCreated++;
      }
    }

    return Response.json({ status: 'initialized', stagesCreated, tasksCreated, suppliersCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});