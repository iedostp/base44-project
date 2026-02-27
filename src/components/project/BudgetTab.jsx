import React, { useState } from "react";
import { Pencil, Check, X, Plus } from "lucide-react";
import AIBudgetAssistant from "./AIBudgetAssistant";
import BudgetReport from "./BudgetReport";
import AddExpenseManualDialog from "./AddExpenseManualDialog";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getCurrencySymbol } from "../utils/currencyFormatter";
import "../i18n";

export default function BudgetTab({ project, stages, suppliers, expenses = [] }) {
  const { i18n } = useTranslation();
  const currencySymbol = getCurrencySymbol(i18n.language);
  const totalBudget = project?.total_budget || 0;
  const queryClient = useQueryClient();

  // Stage editing state
  const [editingStageId, setEditingStageId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Use actual expenses if they exist, otherwise estimate from completed stages
  const actualExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const estimatedFromStages = stages
    .filter(s => s.completed)
    .reduce((acc, s) => acc + (totalBudget * (parseFloat(s.budget_percentage) || 0) / 100), 0);
  const spentBudget = actualExpenses > 0 ? actualExpenses : estimatedFromStages;

  const remainingBudget = totalBudget - spentBudget;

  const startEdit = (stage) => {
    const amount = Math.round(totalBudget * (parseFloat(stage.budget_percentage) || 0) / 100);
    setEditAmount(String(amount));
    setEditingStageId(stage.id);
  };

  const cancelEdit = () => {
    setEditingStageId(null);
    setEditAmount("");
  };

  const saveEdit = async (stage) => {
    const newAmount = parseFloat(editAmount.replace(/,/g, ''));
    if (isNaN(newAmount) || newAmount < 0) return;

    const originalAmount = Math.round(totalBudget * (parseFloat(stage.budget_percentage) || 0) / 100);
    const diff = newAmount - originalAmount;

    // If there's a difference, ask for confirmation and update total budget
    if (diff !== 0) {
      const direction = diff > 0 ? "עלייה" : "ירידה";
      const confirmed = confirm(
        `הסכום שונה ב-${Math.abs(diff).toLocaleString()} ₪ (${direction}).\n` +
        `התקציב הכולל של הפרויקט יתעדכן מ-${totalBudget.toLocaleString()} ₪ ל-${(totalBudget + diff).toLocaleString()} ₪.\n\n` +
        `האם לאשר את השינוי?`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    const newTotalBudget = totalBudget + diff;
    const newPercentage = newTotalBudget > 0 ? ((newAmount / newTotalBudget) * 100).toFixed(1) + "%" : stage.budget_percentage;

    // Update all other stages' percentages proportionally, and update this stage
    const updates = stages.map(s => {
      if (s.id === stage.id) {
        return base44.entities.Stage.update(s.id, { budget_percentage: newPercentage });
      } else if (diff !== 0) {
        // Recalculate percentage for other stages based on new total
        const thisAmount = Math.round(newTotalBudget * (parseFloat(s.budget_percentage) || 0) / 100);
        // Keep their amounts the same but adjust % to reflect new total
        const newPct = newTotalBudget > 0 ? ((thisAmount / newTotalBudget) * 100).toFixed(1) + "%" : s.budget_percentage;
        return base44.entities.Stage.update(s.id, { budget_percentage: newPct });
      }
    }).filter(Boolean);

    await Promise.all(updates);

    if (diff !== 0) {
      await base44.entities.Project.update(project.id, { total_budget: newTotalBudget });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }

    queryClient.invalidateQueries({ queryKey: ['stages'] });
    setSaving(false);
    setEditingStageId(null);
    setEditAmount("");
  };
  const spentPercentage = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {showAddExpense && (
        <AddExpenseManualDialog
          projectId={project?.id}
          stages={stages}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['expenses'] })}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {/* AI Budget Assistant */}
      <AIBudgetAssistant 
        project={project}
        stages={stages}
        suppliers={suppliers}
        expenses={expenses}
      />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-xl" dir="rtl">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-2 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-bold">{currencySymbol}</span>
            </div>
            <span className="text-xs opacity-90">תקציב כולל</span>
          </div>
          <p className="text-2xl font-bold text-right">{currencySymbol}{totalBudget.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 text-white shadow-xl" dir="rtl">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-2 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-bold">{currencySymbol}</span>
            </div>
            <span className="text-xs opacity-90">הוצאה משוערת</span>
          </div>
          <p className="text-2xl font-bold text-right">{currencySymbol}{Math.round(spentBudget).toLocaleString()}</p>
          <p className="text-xs opacity-90 mt-1 text-right">{spentPercentage}% מהתקציב</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-xl" dir="rtl">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-2 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-bold">{currencySymbol}</span>
            </div>
            <span className="text-xs opacity-90">יתרה משוערת</span>
          </div>
          <p className="text-2xl font-bold text-right">{currencySymbol}{Math.round(remainingBudget).toLocaleString()}</p>
          <p className="text-xs opacity-90 mt-1 text-right">{100 - spentPercentage}% נותר</p>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">{currencySymbol}</span>
            פירוט תקציב לפי שלבים
          </h3>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף הוצאה
          </button>
        </div>
        <div className="space-y-4">
          {stages.map(stage => {
            const stageAmount = Math.round(totalBudget * (parseFloat(stage.budget_percentage) || 0) / 100);
            const isEditing = editingStageId === stage.id;
            return (
              <div key={stage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${stage.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-700 font-medium text-right break-words leading-snug">{stage.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        className="w-28 border border-blue-400 rounded-lg px-2 py-1 text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(stage)} disabled={saving} className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold">{currencySymbol}{stageAmount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{stage.budget_percentage}</div>
                      </div>
                      <button onClick={() => startEdit(stage)} className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100" dir="rtl">
        <h3 className="font-bold text-xl text-gray-800 mb-6 text-center">התפלגות תקציב</h3>
        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 h-8 flex items-center justify-center text-white font-bold text-sm transition-all duration-700"
            style={{ width: `${spentPercentage}%` }}
          >
            {spentPercentage > 10 && `${spentPercentage}%`}
          </div>
        </div>
        <div className="flex justify-between mt-3 text-sm text-gray-600">
          <span>הוצאה משוערת</span>
          <span>יתרה</span>
        </div>
      </div>

      {/* Budget Report */}
      <BudgetReport project={project} stages={stages} expenses={expenses} />
    </div>
  );
}