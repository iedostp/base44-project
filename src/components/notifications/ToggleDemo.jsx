import React, { useState } from "react";
import { Mail, Smartphone } from "lucide-react";

// 1. Square button (current)
const SquareToggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
  >
    {checked ? (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )}
  </button>
);

// 2. Round checkbox
const RoundToggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}
  >
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </button>
);

// 3. Pill/Badge
const PillToggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${checked ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-400 border-gray-300'}`}
  >
    {checked ? 'פעיל' : 'כבוי'}
  </button>
);

// 4. Slider toggle (original)
const SliderToggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

// 5. Icon color toggle
const IconColorToggle = ({ checked, onChange, icon: Icon }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`p-2 rounded-lg transition-all ${checked ? 'text-blue-500 bg-blue-50' : 'text-gray-300 bg-gray-50'}`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const Row = ({ label, toggle }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {toggle("email")}
        <Mail className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex items-center gap-2">
        {toggle("inapp")}
        <Smartphone className="w-3.5 h-3.5 text-gray-400" />
      </div>
    </div>
  </div>
);

export default function ToggleDemo() {
  const [vals, setVals] = useState({
    s_email: true, s_inapp: false,
    r_email: true, r_inapp: false,
    p_email: true, p_inapp: false,
    sl_email: true, sl_inapp: false,
    ic_email: true, ic_inapp: false,
  });
  const toggle = (key) => setVals(v => ({ ...v, [key]: !v[key] }));

  const styles = [
    {
      title: "1. ריבועי (נוכחי)",
      render: (suffix) => <SquareToggle checked={vals[`s_${suffix}`]} onChange={() => toggle(`s_${suffix}`)} />
    },
    {
      title: "2. עיגול Checkbox",
      render: (suffix) => <RoundToggle checked={vals[`r_${suffix}`]} onChange={() => toggle(`r_${suffix}`)} />
    },
    {
      title: "3. Pill פעיל/כבוי",
      render: (suffix) => <PillToggle checked={vals[`p_${suffix}`]} onChange={() => toggle(`p_${suffix}`)} />
    },
    {
      title: "4. Slider (מקורי)",
      render: (suffix) => <SliderToggle checked={vals[`sl_${suffix}`]} onChange={() => toggle(`sl_${suffix}`)} />
    },
    {
      title: "5. אייקון צבעוני",
      render: (suffix) => <IconColorToggle checked={vals[`ic_${suffix}`]} onChange={() => toggle(`ic_${suffix}`)} icon={suffix === "email" ? Mail : Smartphone} />
    },
  ];

  return (
    <div className="p-6 max-w-md mx-auto space-y-4" dir="rtl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">סגנונות כפתורים</h2>
      {styles.map(({ title, render }) => (
        <div key={title} className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">{title}</p>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2 text-left">
            <span></span>
            <div className="flex gap-8">
              <span>דוא״ל</span>
              <span>באפליקציה</span>
            </div>
          </div>
          <Row label='משימות שעברו זמנן' toggle={render} />
        </div>
      ))}
    </div>
  );
}