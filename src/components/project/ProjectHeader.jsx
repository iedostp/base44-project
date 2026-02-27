import React, { useState, useEffect, useCallback } from "react";
import { Building2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { getCurrencySymbol } from "../utils/currencyFormatter";
import "../i18n";

export default function ProjectHeader({ project, onUpdate, overallProgress, budgetProgress }) {
  const { t, i18n } = useTranslation();
  const currencySymbol = getCurrencySymbol(i18n.language);
  const isRTL = ['he', 'ar'].includes(i18n.language);
  const [localProject, setLocalProject] = useState(project || {});

  const latestProjectRef = React.useRef(localProject);
  latestProjectRef.current = localProject;

  // Create a debounced update function that persists across renders
  const debouncedUpdate = useCallback(
    debounce(() => {
      onUpdate(latestProjectRef.current);
    }, 800),
    [onUpdate]
  );

  const handleChange = (field, value) => {
    const updatedProject = { ...localProject, [field]: value };
    setLocalProject(updatedProject);
    latestProjectRef.current = updatedProject;
    debouncedUpdate();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-slate-700 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="hidden md:flex items-center gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 p-3 rounded-xl shadow-lg">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690514d00122f9b7b00f4a5d/ae181d7e5_image.png" alt={t('appName')} className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {t('appName')}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('projectName')}</label>
          <Input type="text" placeholder={t('projectName')} value={localProject?.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all text-center" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('plotNumber')}</label>
          <Input type="text" placeholder={t('plotNumber')} value={localProject?.plot_number || ''} onChange={(e) => handleChange('plot_number', e.target.value)} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all text-center" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('startDate')}</label>
          <Input type="date" value={localProject?.start_date || ''} onChange={(e) => handleChange('start_date', e.target.value)} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all" style={{ direction: 'ltr', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('location')}</label>
          <Input type="text" placeholder={t('location')} value={localProject?.location || ''} onChange={(e) => handleChange('location', e.target.value)} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all text-center" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('totalBudget')}</label>
          <Input type="text" placeholder={t('totalBudget')} value={localProject?.total_budget ? localProject.total_budget.toLocaleString('he-IL') : ''} onChange={(e) => { const numValue = parseFloat(e.target.value.replace(/,/g, '')); handleChange('total_budget', isNaN(numValue) ? null : numValue); }} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all text-center" />
        </div>
      </div>

      <div className="mb-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-6">{t('professionalTeam')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: 'contractor', nameField: 'contractor_name', phoneField: 'contractor_phone' },
            { key: 'architect', nameField: 'architect_name', phoneField: 'architect_phone' },
            { key: 'constructor', nameField: 'constructor_name', phoneField: 'constructor_phone' },
            { key: 'interiorDesigner', nameField: 'interior_designer_name', phoneField: 'interior_designer_phone' },
          ].map(({ key, nameField, phoneField }) => (
            <div key={key} className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <h4 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-4">{t(key)}</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">{t('name')}</label>
                  <Input type="text" placeholder={t('enterName')} value={localProject?.[nameField] || ''} onChange={(e) => handleChange(nameField, e.target.value)} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">{t('phone')}</label>
                  <Input type="tel" placeholder={t('enterPhone')} value={localProject?.[phoneField] || ''} onChange={(e) => handleChange(phoneField, e.target.value)} className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all" dir="ltr" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('totalBudgetLabel')}</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{localProject?.total_budget ? `${currencySymbol}${localProject.total_budget.toLocaleString()}` : `${currencySymbol}0`}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-700 h-4 rounded-full transition-all duration-700 ease-out shadow-md" style={{ width: `100%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('taskProgress')}</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 dark:from-emerald-600 dark:via-green-700 dark:to-teal-700 h-4 rounded-full transition-all duration-700 ease-out shadow-md" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-r-4 border-blue-500 dark:border-blue-600 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">{t('importantTip')}</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{t('buildingTip')}</p>
        </div>
      </div>
    </div>
  );
}