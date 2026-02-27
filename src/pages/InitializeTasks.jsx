import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function InitializeTasks() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch user and project
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const project = projects[0];

  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project?.id],
    queryFn: () => base44.entities.Stage.filter({ project_id: project.id }, 'order'),
    enabled: !!project?.id,
  });

  // Template tasks based on the image
  const tasksTemplate = [
    { stageIndex: 0, text: "התארגנות ככלל ביטוח וגידור", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 0, text: "השגת אישור התחלת עבודה", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 1, text: "גמר קרקח וחפירה כללפואת", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 2, text: "גמר יסודות כולל בידוד וחיפוי השטח", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 3, text: "גמר יציקת קורות יסד", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 4, text: "גמר יציקת מהקם וקורות קומה", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 5, text: "גמר יציקת משטח GSB והנד\"ד קומת קרקע", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 5, text: "גמר יציקת חיפוי קומת קרקע", duration: "1-2 שבועות", priority: "בינונית" },
    { stageIndex: 5, text: "גמר יציקת משטח קומת קרקע GSB", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 6, text: "גמר שלד קומפלט ומשקלים ככלל יציקות פיתוח", duration: "3-4 שבועות", priority: "גבוהה" },
    { stageIndex: 7, text: "גמר התבנות כולל הוולו גגביטו חיצוניב", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 7, text: "גמר הכנת צרת מים לפני ניח", duration: "1 שבוע", priority: "בינונית" },
    { stageIndex: 7, text: "אספקת כלים סניתרים לשית", duration: "1 שבוע", priority: "בינונית" },
    { stageIndex: 7, text: "התקנת בונקסת סניתרים", duration: "1 שבוע", priority: "נמוכה" },
    { stageIndex: 8, text: "גמר התקנת ודדים", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 9, text: "גמר התבנות גג אביב לטביע וחיבור", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 9, text: "השלמת חיווט וחומר לבן ככלל הכנת מיוז אור וגז", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 9, text: "גמר לוחות, חיווט חשמל ובדיקה", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 10, text: "גמר סיד שחור של חמוי מים", duration: "1 שבוע", priority: "בינונית" },
    { stageIndex: 11, text: "גמר שליכט צבעוני וסיפי ברצים בחית", duration: "2-3 שבועות", priority: "בינונית" },
    { stageIndex: 12, text: "גמר פורצילן בכלל הבית", duration: "2-3 שבועות", priority: "בינונית" },
    { stageIndex: 12, text: "שיפלט בכלל הבית", duration: "1-2 שבועות", priority: "בינונית" },
    { stageIndex: 12, text: "גמר צבע בכלל הבית", duration: "2-3 שבועות", priority: "בינונית" },
    { stageIndex: 12, text: "איטום סביב קבע", duration: "1 שבוע", priority: "בינונית" },
    { stageIndex: 13, text: "איטום חדרים רטובים ככלל בדריכת אבפח ואיטום חלונות", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 13, text: "איטום מרפסות נגויות וברדיקת אבפח", duration: "1-2 שבועות", priority: "גבוהה" },
    { stageIndex: 14, text: "גמר מלא טסטומט והספקת חומרי ויבזלי לאתר", duration: "1-2 שבועות", priority: "בינונית" },
    { stageIndex: 14, text: "גמר רצפות מרצן ככלל לרבות חובט", duration: "2-3 שבועות", priority: "בינונית" },
    { stageIndex: 15, text: "גמר מסקיפים עורגים אלומיניים", duration: "1-2 שבועות", priority: "בינונית" },
    { stageIndex: 15, text: "גמר אהסטלציב ככלל", duration: "2-3 שבועות", priority: "גבוהה" },
    { stageIndex: 15, text: "גמר ספי שיש בחלונות ובגג", duration: "1 שבוע", priority: "נמוכה" },
    { stageIndex: 16, text: "גמר עבודות נגר", duration: "2-3 שבועות", priority: "בינונית" },
    { stageIndex: 16, text: "גמר התקנת פרגולות ודלתות פית שית", duration: "1-2 שבועות", priority: "בינונית" },
    { stageIndex: 16, text: "התקנת דלתות פנים", duration: "1-2 שבועות", priority: "בינונית" },
    { stageIndex: 16, text: "התקנת נגלה בטיט והייזהה", duration: "1 שבוע", priority: "נמוכה" },
    { stageIndex: 17, text: "מסירת האשונים הראשונית על כל האישורים הנדרשים", duration: "1 שבוע", priority: "גבוהה" },
    { stageIndex: 17, text: "מסירה סופית לאחר תיקון כל ההערות ותלקיירים", duration: "1-2 שבועות", priority: "גבוהה" },
  ];

  const handleInitialize = async () => {
    if (!project?.id || stages.length === 0) {
      alert("לא נמצא פרויקט או שלבים. אנא צור פרויקט תחילה.");
      return;
    }

    if (!confirm("האם אתה בטוח שברצונך להוסיף את כל המשימות? פעולה זו תוסיף משימות לכל השלבים.")) {
      return;
    }

    setIsInitializing(true);
    setResult(null);

    try {
      let addedCount = 0;
      const errors = [];

      for (const taskTemplate of tasksTemplate) {
        const stage = stages[taskTemplate.stageIndex];
        
        if (!stage) {
          errors.push(`שלב ${taskTemplate.stageIndex + 1} לא נמצא: ${taskTemplate.text}`);
          continue;
        }

        try {
          // Get existing tasks to set order
          const existingTasks = await base44.entities.Task.filter({ stage_id: stage.id });
          
          await base44.entities.Task.create({
            stage_id: stage.id,
            text: taskTemplate.text,
            duration: taskTemplate.duration,
            priority: taskTemplate.priority,
            done: false,
            order: existingTasks.length + 1
          });
          
          addedCount++;
        } catch (error) {
          errors.push(`שגיאה בהוספת משימה "${taskTemplate.text}": ${error.message}`);
        }
      }

      setResult({
        success: true,
        addedCount,
        totalCount: tasksTemplate.length,
        errors
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">נדרשת התחברות</h2>
          <p className="text-gray-600 text-center">אנא התחבר כדי להשתמש בעמוד זה</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">לא נמצא פרויקט</h2>
          <p className="text-gray-600 text-center mb-6">צור פרויקט תחילה בעמוד הראשי</p>
          <Link to={createPageUrl("Home")}>
            <Button className="w-full">חזור לעמוד הראשי</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">אתחול משימות לפרויקט</h1>
          <p className="text-gray-600 mb-6">
            דף זה יאפשר לך להוסיף באופן אוטומטי את כל המשימות התקניות לשלבים השונים בפרויקט שלך.
          </p>

          <div className="bg-blue-50 border-r-4 border-blue-500 p-4 mb-6 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">מידע חשוב</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• הפעולה תוסיף {tasksTemplate.length} משימות לשלבים השונים</li>
              <li>• המשימות מתבססות על תקן בנייה עצמית מקובל</li>
              <li>• ניתן למחוק או לערוך משימות לאחר ההוספה</li>
              <li>• הפרויקט שלך: {project.name}</li>
              <li>• מספר שלבים זמינים: {stages.length}</li>
            </ul>
          </div>

          {!result && (
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg py-6"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מוסיף משימות...
                </>
              ) : (
                <>
                  התחל אתחול משימות
                  <ArrowRight className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          )}

          {result && (
            <div className={`mt-6 p-6 rounded-xl border-2 ${
              result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}>
              {result.success ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-green-900">האתחול הושלם בהצלחה!</h3>
                      <p className="text-green-700">
                        נוספו {result.addedCount} מתוך {result.totalCount} משימות
                      </p>
                    </div>
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-semibold text-amber-900 mb-2">שגיאות שהתרחשו:</h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        {result.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link to={createPageUrl("Home")}>
                    <Button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600">
                      חזור לעמוד הראשי
                      <ArrowRight className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="text-xl font-bold text-red-900">אירעה שגיאה</h3>
                      <p className="text-red-700">{result.error}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setResult(null);
                      setIsInitializing(false);
                    }}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    נסה שוב
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" className="w-full">
                ← חזור לעמוד הראשי
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}