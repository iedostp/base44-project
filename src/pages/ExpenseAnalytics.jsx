import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/components/utils/currencyFormatter";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Package, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExpenseAnalyticsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'ar'].includes(i18n.language);
  const [selectedProject, setSelectedProject] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", selectedProject],
    queryFn: () =>
      selectedProject
        ? base44.entities.Expense.filter({ project_id: selectedProject })
        : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", selectedProject],
    queryFn: () =>
      selectedProject
        ? base44.entities.Supplier.filter({ project_id: selectedProject })
        : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages", selectedProject],
    queryFn: () =>
      selectedProject
        ? base44.entities.Stage.filter({ project_id: selectedProject })
        : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-right">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">{t('expenseAnalyticsTitle')}</h1>
            <p className="text-gray-600 dark:text-slate-400">{t('expenseSelectProject')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-start border border-gray-100 dark:border-slate-700"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{project.name}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">{project.location}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === selectedProject);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses.filter((e) => e.paid).reduce((sum, e) => sum + e.amount, 0);
  const unpaidExpenses = totalExpenses - paidExpenses;

  // By Category
  const byCategory = {};
  expenses.forEach((e) => {
    const cat = t(`expenseCategory_${e.category}`, { defaultValue: e.category });
    byCategory[cat] = (byCategory[cat] || 0) + e.amount;
  });
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // By Supplier
  const bySupplier = {};
  expenses.forEach((e) => {
    if (e.supplier_id) {
      const supplier = suppliers.find((s) => s.id === e.supplier_id);
      if (supplier) {
        bySupplier[supplier.name] = (bySupplier[supplier.name] || 0) + e.amount;
      }
    }
  });
  const supplierData = Object.entries(bySupplier)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));

  // By Stage
  const byStage = {};
  expenses.forEach((e) => {
    if (e.stage_id) {
      const stage = stages.find((s) => s.id === e.stage_id);
      if (stage) {
        byStage[stage.title] = (byStage[stage.title] || 0) + e.amount;
      }
    }
  });
  const stageData = Object.entries(byStage).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Timeline
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const timelineData = {};
  sortedExpenses.forEach((e) => {
    const date = e.date;
    timelineData[date] = (timelineData[date] || 0) + e.amount;
  });
  const timeline = Object.entries(timelineData).map(([date, value]) => ({
    date: new Date(date).toLocaleDateString("he-IL"),
    value: Math.round(value),
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const budgetUsage = project.total_budget
    ? Math.round((totalExpenses / project.total_budget) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-right">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">{t('expenseAnalyticsTitle')}</h1>
            <p className="text-gray-600 dark:text-slate-400">{project?.name}</p>
          </div>
          <Button
            onClick={() => setSelectedProject(null)}
            variant="outline"
          >
            {t('expenseBackToProjects')}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 text-start">{t('totalExpenses')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 text-start">
              {formatCurrency(totalExpenses, i18n.language)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 text-start">{t('paidExpenses')}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 text-start">
              {formatCurrency(paidExpenses, i18n.language)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 text-start">{t('unpaid')}</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 text-start">
              {formatCurrency(unpaidExpenses, i18n.language)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 text-start">{t('budgetInUse')}</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 text-start">
              {budgetUsage}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* By Category */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 text-right">{t('expenseByCategoryTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value, i18n.language)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By Supplier */}
          {supplierData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 text-right">{t('expenseBySupplierTitle')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={supplierData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 mb-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 text-right">{t('expenseTimelineTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By Stage */}
        {stageData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 text-right">{t('expenseByStageTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name={t('expenseBarLabel')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

