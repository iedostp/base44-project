import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('he');
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSelectedLanguage(i18n.language);
    setMounted(true);
  }, [i18n.language]);

  const handleConfirm = () => {
    localStorage.setItem('language', selectedLanguage);
    const isRTL = ['he', 'ar'].includes(selectedLanguage);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = selectedLanguage;
    window.location.reload();
  };

  const selectedLanguageLabel = languages.find(lang => lang.code === selectedLanguage)?.label;
  const currentLanguageLabel = languages.find(lang => lang.code === i18n.language)?.label;

  if (!mounted) return null;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Language Selector */}
      <div>
        <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2 text-right">שפה</label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} name="language-select">
          <SelectTrigger id="language-select" className="w-full" aria-label="בחר שפה">
            <SelectValue placeholder="בחר שפה" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} className="text-right">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={selectedLanguage === i18n.language || isSaving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSaving ? 'עדכון...' : 'אישור'}
      </Button>

      {/* Preview */}
      {selectedLanguage !== i18n.language && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-right">
          <p className="text-gray-700 dark:text-slate-300">
            יתשנה ל{languages.find(l => l.code === selectedLanguage)?.label}
          </p>
        </div>
      )}
    </div>
  );
}