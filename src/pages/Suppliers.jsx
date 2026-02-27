import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Star, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SupplierModal from "@/components/suppliers/SupplierModal";
import SupplierDetailCard from "@/components/suppliers/SupplierDetailCard";

export default function SuppliersPage() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["suppliers", selectedProject],
    queryFn: () =>
      selectedProject
        ? base44.entities.Supplier.filter({ project_id: selectedProject })
        : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", selectedProject],
    queryFn: () =>
      selectedProject
        ? base44.entities.Expense.filter({ project_id: selectedProject })
        : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setEditingSupplier(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const CATEGORIES = [
    { value: "windows", label: "חלונות" },
    { value: "tiles", label: "אריחים" },
    { value: "kitchen", label: "מטבח" },
    { value: "sanitary", label: "סניטריה" },
    { value: "ac", label: "מיזוג אוויר" },
    { value: "electrical", label: "חשמל" },
    { value: "carpentry", label: "נגרות" },
    { value: "plumbing", label: "אינסטלציה" },
    { value: "painting", label: "צביעה" },
    { value: "other", label: "אחר" },
  ];

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  const calculateSupplierSpending = (supplierId) => {
    return expenses
      .filter((e) => e.supplier_id === supplierId)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact_phone?.includes(searchQuery);
    const matchesCategory =
      selectedCategory === "all" || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSupplierStats = (supplier) => {
    const spending = calculateSupplierSpending(supplier.id);
    const expenseCount = expenses.filter((e) => e.supplier_id === supplier.id).length;
    return { spending, expenseCount };
  };

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">ניהול ספקים</h1>
            <p className="text-gray-600 dark:text-slate-400">בחר פרויקט לניהול הספקים שלו</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-right border border-gray-100 dark:border-slate-700"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{project.name}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{project.location}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500">ספקים: {suppliers.length}</p>
              </button>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
              <p className="text-gray-600 dark:text-slate-400">אין פרויקטים זמינים</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === selectedProject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-row-reverse">
          <div className="text-right flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">ניהול ספקים</h1>
            <p className="text-gray-600 dark:text-slate-400">{project?.name}</p>
          </div>
          <Button
            onClick={() => setSelectedProject(null)}
            variant="outline"
            className="mr-4 text-right"
          >
            חזור לפרויקטים
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-slate-700">
          <div className="flex gap-4 flex-col md:flex-row md:flex-row-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="חיפוש לפי שם או טלפון"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="all">כל הקטגוריות</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                setEditingSupplier(null);
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              ספק חדש
            </Button>
          </div>
        </div>

        {/* Suppliers Grid */}
        {suppliersLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-slate-400">טוען ספקים...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-slate-700">
            <p className="text-gray-600 dark:text-slate-400">לא נמצאו ספקים</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => {
              const stats = getSupplierStats(supplier);
              return (
                <SupplierDetailCard
                  key={supplier.id}
                  supplier={supplier}
                  stats={stats}
                  categoryLabel={getCategoryLabel(supplier.category)}
                  onEdit={() => {
                    setEditingSupplier(supplier);
                    setShowModal(true);
                  }}
                  onDelete={() => deleteMutation.mutate(supplier.id)}
                />
              );
            })}
          </div>
        )}

        {/* Modal */}
        <SupplierModal
          isOpen={showModal}
          supplier={editingSupplier}
          projectId={selectedProject}
          categories={CATEGORIES}
          onClose={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
          onSave={(data) => {
            if (editingSupplier) {
              updateMutation.mutate({ id: editingSupplier.id, data });
            } else {
              createMutation.mutate({ ...data, project_id: selectedProject });
            }
          }}
        />
      </div>
    </div>
  );
}