import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, AlertTriangle, User, LogOut, Sun } from "lucide-react";
import UserManagementPanel from "./settings/UserManagementPanel";
import { Button } from "@/components/ui/button";
import NotificationSettingsPanel from "./notifications/NotificationSettingsPanel";
import CalendarSyncPanel from "./calendar/CalendarSyncPanel";
import AppearanceSettings from "./settings/AppearanceSettings";
import LanguageSwitcher from "./settings/LanguageSwitcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

export default function SettingsTab({ user, project }) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      alert("חשבונך נמחק בהצלחה. כל הנתונים שלך הוסרו מהמערכת.");
      base44.auth.logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("אירעה שגיאה במחיקת החשבון. אנא נסה שוב.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Account Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl flex-shrink-0">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="text-start flex-1">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t('accountDetails')}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('managePersonalInfo')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-blue-200 dark:border-slate-600 text-start">
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fullName')}</p>
              <p className="font-semibold text-gray-800 dark:text-slate-100">{user?.full_name || t('notAvailable')}</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-blue-200 dark:border-slate-600 text-start">
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('email')}</p>
              <p className="font-semibold text-gray-800 dark:text-slate-100">{user?.email}</p>
            </div>

            {user?.role && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-blue-200 dark:border-slate-600 text-start">
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('role')}</p>
                <p className="font-semibold text-gray-800 dark:text-slate-100">{user.role}</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 select-none"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4 me-2" />
            {t('logout')}
          </Button>
          </div>

          {/* Appearance Settings */}
          <AppearanceSettings />

          {/* Language Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-xl flex-shrink-0">
                <Sun className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="text-start flex-1">
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t('language')}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('chooseInterfaceLanguage')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Calendar Sync */}
         <CalendarSyncPanel user={user} project={project} />

         {/* Notification Settings */}
         <NotificationSettingsPanel user={user} />

         {/* User Management */}
         <UserManagementPanel user={user} />

         {/* Danger Zone */}
         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
            <div className="text-start flex-1">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-300">{t('dangerZone')}</h2>
              <p className="text-sm text-red-600 dark:text-red-400">{t('irreversibleActions')}</p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4 mb-4 border border-red-200 dark:border-red-900 text-start">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{t('deleteAccountWarning')}</p>
            <ul className="mt-3 space-y-1 text-sm text-red-700 dark:text-red-400 ms-5 list-disc text-start">
              <li>{t('deleteItem_projects')}</li>
              <li>{t('deleteItem_stages')}</li>
              <li>{t('deleteItem_suppliers')}</li>
              <li>{t('deleteItem_expenses')}</li>
            </ul>
            <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-semibold">{t('irreversible')}</p>
          </div>

          <Button
            variant="destructive"
            className="w-full select-none"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 me-2" />
            {t('deleteMyAccount')}
          </Button>
        </div>
        </div>

        {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
       <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-start">
           <AlertTriangle className="w-5 h-5" />
           {t('confirmDeleteAccount')}
           </DialogTitle>
           <DialogDescription className="text-gray-600 dark:text-slate-300 text-start">
           {t('confirmDeleteAccountDesc')}
           </DialogDescription>
         </DialogHeader>
         <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 my-4 text-start">
           <p className="text-sm text-red-800 dark:text-red-300 font-semibold">⚠️ {t('lastWarning')}</p>
           <p className="text-xs text-red-700 dark:text-red-400 mt-2">{t('lastWarningDesc')}</p>
         </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="select-none"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="select-none"
            >
              {isDeleting ? t('deleting') : t('yesDeleteMyAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}