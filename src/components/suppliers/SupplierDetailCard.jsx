import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Phone, Mail, MapPin, Trash2, Edit, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupplierDetailCard({ supplier, stats, categoryLabel, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      not_contacted: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
      under_consideration: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
      selected: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
      rejected: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
    };
    return colors[status] || colors.not_contacted;
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_contacted: "לא התקשרו",
      under_consideration: "בשיקול",
      selected: "בחור",
      rejected: "דחוי",
    };
    return labels[status] || status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
        <div className="flex items-start justify-between mb-2">
          <div className="text-start flex-1">
            <h3 className="font-bold text-lg">{supplier.name}</h3>
            <p className="text-sm opacity-90">{categoryLabel}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(supplier.status)}`}>
            {getStatusLabel(supplier.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Rating */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-slate-400">דירוג</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < supplier.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contact Info */}
        {supplier.contact_phone && (
          <div className="flex items-center gap-3 text-sm justify-end">
            <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <a href={`tel:${supplier.contact_phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              {supplier.contact_phone}
            </a>
          </div>
        )}

        {supplier.email && (
          <div className="flex items-center gap-3 text-sm justify-end">
            <Mail className="w-4 h-4 text-green-500 flex-shrink-0" />
            <a href={`mailto:${supplier.email}`} className="text-blue-600 dark:text-blue-400 hover:underline truncate">
              {supplier.email}
            </a>
          </div>
        )}

        {supplier.address && (
          <div className="flex items-center gap-3 text-sm justify-end">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-slate-300">{supplier.address}</span>
          </div>
        )}

        {/* Price Range */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-slate-400">טווח מחיר</span>
          <span className="font-medium text-gray-800 dark:text-slate-200">{supplier.price_range}</span>
        </div>

        {/* Spending Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-700 dark:text-slate-300">סה"כ הוצאות</span>
          </div>
          <div className="text-start">
            <p className="font-bold text-blue-600 dark:text-blue-400">
              {stats.spending.toLocaleString()} ₪
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-400">{stats.expenseCount} הוצאות</p>
          </div>
        </div>

        {/* Notes */}
        {supplier.notes && (
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-slate-300">{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 dark:border-slate-700 p-4 flex gap-2">
        <Button
          onClick={onEdit}
          variant="outline"
          size="sm"
          className="flex-1 text-blue-600 border-blue-300"
        >
          <Edit className="w-4 h-4 me-2" />
          עריכה
        </Button>
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 border-red-300"
        >
          <Trash2 className="w-4 h-4 me-2" />
          מחיקה
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="border-t border-gray-100 dark:border-slate-700 p-4 bg-red-50 dark:bg-red-900/10">
          <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">האם אתה בטוח שברצונך למחוק?</p>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              מחק
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}