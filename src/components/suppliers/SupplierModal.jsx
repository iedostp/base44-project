import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";

export default function SupplierModal({ isOpen, supplier, projectId, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    contact_phone: "",
    email: "",
    address: "",
    rating: 3,
    price_range: "בינוני",
    notes: "",
    status: "not_contacted",
  });

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
    } else {
      setFormData({
        name: "",
        category: "other",
        contact_phone: "",
        email: "",
        address: "",
        rating: 3,
        price_range: "בינוני",
        notes: "",
        status: "not_contacted",
      });
    }
  }, [supplier, isOpen]);

  const handleSave = () => {
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  const PRICE_RANGES = ["נמוך", "בינוני", "בינוני-גבוה", "גבוה"];
  const STATUSES = [
    { value: "not_contacted", label: "לא התקשרו" },
    { value: "under_consideration", label: "בשיקול" },
    { value: "selected", label: "בחור" },
    { value: "rejected", label: "דחוי" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "עריכת ספק" : "ספק חדש"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">שם הספק *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="שם הספק"
              className="text-start"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">קטגוריה</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">טלפון</label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="0501234567"
                className="text-start"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@supplier.com"
                className="text-start"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">כתובת</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="רחוב 123, עיר"
              className="text-start"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">דירוג (1-5)</label>
            <div className="flex gap-2 flex-row-reverse justify-end">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFormData({ ...formData, rating })}
                  className={`text-2xl transition-transform ${
                    rating <= formData.rating ? "text-yellow-400 scale-110" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">טווח מחיר</label>
              <select
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {PRICE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">סטטוס</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">הערות</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות על הספק..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 resize-none h-24 text-start"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 flex-row-reverse">
          <Button onClick={onClose} variant="outline">
            ביטול
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            {supplier ? "עדכן" : "הוסף"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}