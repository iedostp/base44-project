import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Tag } from "lucide-react";

export default function SupplierExpenseHistory({ expenses, supplier }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
        <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 text-right">
          היסטוריית הוצאות
        </h3>
        <p className="text-center text-gray-600 dark:text-slate-400">אין הוצאות עבור ספק זה</p>
      </div>
    );
  }

  const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = totalSpending / expenses.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-start justify-between flex-row-reverse">
          <div className="text-right">
            <h3 className="font-bold text-lg mb-1">היסטוריית הוצאות</h3>
            <p className="text-sm opacity-90">{supplier.name}</p>
          </div>
          <TrendingUp className="w-6 h-6 opacity-80" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100 dark:border-slate-700">
        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">סה"כ הוצאות</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {totalSpending.toLocaleString()} ₪
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">מספר הוצאות</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{expenses.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">ממוצע הוצאה</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {Math.round(avgExpense).toLocaleString()} ₪
          </p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {expenses.map((expense, idx) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-start justify-between flex-row-reverse gap-4">
              <div className="text-right flex-1">
                <p className="font-medium text-gray-900 dark:text-slate-100">{expense.description}</p>
                <div className="flex gap-3 mt-2 flex-row-reverse justify-end">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(expense.date).toLocaleDateString("he-IL")}
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full">
                    {getCategoryLabel(expense.category)}
                  </span>
                  {!expense.paid && (
                    <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-2 py-0.5 rounded-full">
                      טרם שולם
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
                  {expense.amount.toLocaleString()} ₪
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getCategoryLabel(category) {
  const categories = {
    materials: "חומרי בניין",
    labor: "כוח אדם",
    equipment: "ציוד",
    permits: "היתרים",
    professional_services: "שירותים",
    other: "אחר",
  };
  return categories[category] || category;
}