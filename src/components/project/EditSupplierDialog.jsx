import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EditSupplierDialog({ isOpen, onClose, supplier, onSupplierUpdated }) {
  const [isSaving, setIsSaving] = useState(false);
  const [supplierData, setSupplierData] = useState({
    name: "",
    category: "other",
    contact_phone: "",
    email: "",
    address: "",
    rating: 0,
    price_range: "בינוני",
    notes: "",
    status: "not_contacted"
  });

  useEffect(() => {
    if (supplier) {
      setSupplierData({
        name: supplier.name || "",
        category: supplier.category || "other",
        contact_phone: supplier.contact_phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        rating: supplier.rating || 0,
        price_range: supplier.price_range || "בינוני",
        notes: supplier.notes || "",
        status: supplier.status || "not_contacted"
      });
    }
  }, [supplier]);

  const categories = [
    { value: "windows", label: "חלונות ודלתות" },
    { value: "tiles", label: "ריצוף וחיפויים" },
    { value: "kitchen", label: "מטבחים" },
    { value: "sanitary", label: "סניטציה" },
    { value: "ac", label: "מזגנים" },
    { value: "electrical", label: "ציוד חשמלי" },
    { value: "carpentry", label: "נגרות" },
    { value: "plumbing", label: "אינסטלציה" },
    { value: "painting", label: "צביעה" },
    { value: "other", label: "אחר" }
  ];

  const priceRanges = [
    { value: "נמוך", label: "נמוך" },
    { value: "בינוני", label: "בינוני" },
    { value: "בינוני-גבוה", label: "בינוני-גבוה" },
    { value: "גבוה", label: "גבוה" }
  ];

  const statusOptions = [
    { value: "not_contacted", label: "לא יצרנו קשר" },
    { value: "under_consideration", label: "בבדיקה" },
    { value: "selected", label: "נבחר" },
    { value: "rejected", label: "נדחה" }
  ];

  const handleSave = async () => {
    if (!supplierData.name || !supplierData.category) {
      alert("נא למלא לפחות שם וקטגוריה");
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Supplier.update(supplier.id, {
        ...supplierData,
        rating: supplierData.rating || 0
      });
      
      if (onSupplierUpdated) onSupplierUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("שגיאה בעדכון הספק");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">עדכן ספק</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם הספק <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="שם הספק"
              value={supplierData.name}
              onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierData.category}
              onChange={(e) => setSupplierData({ ...supplierData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
              <Input
                placeholder="טלפון ליצירת קשר"
                value={supplierData.contact_phone}
                onChange={(e) => setSupplierData({ ...supplierData, contact_phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={supplierData.email}
                onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
            <Input
              placeholder="כתובת הספק"
              value={supplierData.address}
              onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                דירוג (0-5)
              </label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.5"
                placeholder="0"
                value={supplierData.rating}
                onChange={(e) => setSupplierData({ ...supplierData, rating: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">טווח מחירים</label>
              <select
                value={supplierData.price_range}
                onChange={(e) => setSupplierData({ ...supplierData, price_range: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
              <select
                value={supplierData.status}
                onChange={(e) => setSupplierData({ ...supplierData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
            <Textarea
              placeholder="הערות נוספות על הספק..."
              value={supplierData.notes}
              onChange={(e) => setSupplierData({ ...supplierData, notes: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                שומר...
              </>
            ) : (
              "שמור שינויים"
            )}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}