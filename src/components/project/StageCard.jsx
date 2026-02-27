import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getCurrencySymbol } from "../utils/currencyFormatter";
import { base44 } from "@/api/base44Client";
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  Home,
  FileText,
  Users,
  ClipboardCheck,
  Hammer,
  ShoppingCart,
  Settings,
  Edit,
  Plus,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskItem from "./TaskItem";
import SubtopicCard from "./SubtopicCard";
import EditStageDialog from "./EditStageDialog";
import AddExpenseDialog from "./AddExpenseDialog";
import AddTaskDialog from "./AddTaskDialog";
import CommentsPanel from "./CommentsPanel";

const iconMap = {
  'Home': Home,
  'FileText': FileText,
  'Users': Users,
  'ClipboardCheck': ClipboardCheck,
  'Hammer': Hammer,
  'ShoppingCart': ShoppingCart,
  'Settings': Settings,
  'CheckCircle2': CheckCircle2
};

export default function StageCard({ stage, tasks, subtopics, expenses, suppliers, projectId, onTaskToggle, onUpdate, onDelete, user }) {
  const { t, i18n } = useTranslation();
  const currencySymbol = getCurrencySymbol(i18n.language);
  const [expanded, setExpanded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const Icon = iconMap[stage.icon_name] || Home;
  
  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stageExpenses = expenses?.filter(e => e.stage_id === stage.id) || [];
  const totalExpenses = stageExpenses.reduce((sum, e) => sum + e.amount, 0);

  const priorityColors = {
    'גבוהה': 'bg-red-100 text-red-800 border-red-200',
    'בינונית': 'bg-amber-100 text-amber-800 border-amber-200',
    'נמוכה': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'high': 'bg-red-100 text-red-800 border-red-200',
    'medium': 'bg-amber-100 text-amber-800 border-amber-200',
    'low': 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  const getCategoryText = (category) => t(`expenseCategory_${category}`, category);

  const handleDeleteTask = async (task) => {
    if (!confirm(`למחוק את המשימה "${task.text}"?`)) return;
    await base44.entities.Task.delete(task.id);
    onUpdate();
  };

  const handleDeleteExpense = async (expense) => {
    if (!confirm(`למחוק את ההוצאה "${expense.description}"?`)) return;
    await base44.entities.Expense.delete(expense.id);
    onUpdate();
  };

  const handleDeleteStage = async () => {
    // Delete all tasks and expenses of this stage first
    await Promise.all([
      ...tasks.map(t => base44.entities.Task.delete(t.id)),
      ...stageExpenses.map(e => base44.entities.Expense.delete(e.id)),
      base44.entities.Stage.delete(stage.id),
    ]);
    if (onDelete) onDelete(stage.id);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300" 
        dir="rtl"
      >
        <div 
          className={`p-4 cursor-pointer transition-all ${
            stage.completed ? 'bg-gradient-to-r from-emerald-50 dark:from-emerald-900/20 to-green-50 dark:to-green-900/20' : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            {/* Priority badge */}
            <div className={`text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${priorityColors[stage.priority] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              {t(`priority_${stage.priority}`, stage.priority)}
            </div>
            {/* Chevron */}
            <div className="flex items-center gap-1">
              {stage.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {expanded ? 
                <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500" /> : 
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              }
            </div>
          </div>

          <h3 className="font-bold text-base text-gray-800 dark:text-slate-100 mb-2 text-center">{stage.title}</h3>

          {/* Duration and Budget */}
          <div className="flex gap-2 justify-center mb-2">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{stage.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              <span className="font-bold leading-none">{currencySymbol}</span>
              <span>{stage.budget_percentage} {t('ofBudget')}</span>
            </div>
          </div>

          {/* Progress row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('progress')}</div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
              <span className="text-xs text-gray-400 dark:text-slate-500">{completedTasks} {t('outOf')} {totalTasks}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-gradient-to-b from-gray-50 dark:from-slate-700 to-white dark:to-slate-800 border-t border-gray-100 dark:border-slate-700"
          >
            {/* Action Buttons */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 ml-2" />
                {t('editStage')}
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); setShowAddTaskDialog(true); }}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 ml-2" />
                {t('addTask')}
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); setShowExpenseDialog(true); }}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 ml-2" />
                {t('addExpense')}
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                variant="outline"
                size="sm"
                className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mr-auto"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                מחק שלב
              </Button>
            </div>

            {/* Delete confirmation */}
            {confirmDelete && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">מחיקת השלב "{stage.title}"</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                      פעולה זו תמחק גם את כל המשימות ({tasks.length}) וההוצאות ({stageExpenses.length}) המשויכות לשלב זה. לא ניתן לשחזר.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}>
                    ביטול
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteStage(); }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    כן, מחק
                  </Button>
                </div>
              </div>
            )}

            {/* Expenses Section */}
            {stageExpenses.length > 0 && (
              <div className="mb-6 bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-800 dark:text-slate-100">{t('actualExpenses')}</h4>
                  <span className="text-lg font-bold text-green-600">
                    {currencySymbol}{totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {stageExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-600 rounded-lg text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-slate-100">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {getCategoryText(expense.category)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {new Date(expense.date).toLocaleDateString('he-IL')}
                          </span>
                          {!expense.paid && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                              {t('notPaid')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-slate-100">
                          {currencySymbol}{expense.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense); }}
                          className="p-1 text-gray-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtopics */}
            {subtopics.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-lg">{t('importantTopics')}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {subtopics.map((subtopic) => (
                    <SubtopicCard key={subtopic.id} subtopic={subtopic} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Tasks */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-slate-100 mb-4 text-lg">{t('tasksToComplete')}</h4>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={() => onTaskToggle(task)}
                    onDelete={handleDeleteTask}
                    projectId={projectId}
                    user={user}
                  />
                ))}
              </div>
            </div>

            {/* Stage Comments */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-600">
              <CommentsPanel
                refType="stage"
                refId={stage.id}
                projectId={projectId}
                user={user}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <EditStageDialog
        stage={stage}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSaved={onUpdate}
      />

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        projectId={projectId}
        stage={stage}
        suppliers={suppliers}
        isOpen={showExpenseDialog}
        onClose={() => setShowExpenseDialog(false)}
        onAdded={onUpdate}
      />

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={showAddTaskDialog}
        onClose={() => setShowAddTaskDialog(false)}
        stageId={stage.id}
        onTaskAdded={onUpdate}
      />
    </>
  );
}