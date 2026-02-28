import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddSupplierDialog({ isOpen, onClose, projectId, onSupplierAdded }) {
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

  const handleSave = async () => {
    if (!supplierData.name || !supplierData.category) {
      alert("נא למלא לפחות שם וקטגוריה");
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Supplier.create({
        ...supplierData,
        project_id: projectId,
        rating: supplierData.rating || 0
      });
      
      if (onSupplierAdded) onSupplierAdded();
      
      // Reset form
      setSupplierData({
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
      
      onClose();
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("שגיאה בשמירת הספק");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">הוסף ספק חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-end">
              שם הספק <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="שם הספק"
              value={supplierData.name}
              onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
              className="text-end"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-end">
              קטגוריה <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierData.category}
              onChange={(e) => setSupplierData({ ...supplierData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-end"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-end">טלפון</label>
              <Input
                placeholder="טלפון ליצירת קשר"
                value={supplierData.contact_phone}
                onChange={(e) => setSupplierData({ ...supplierData, contact_phone: e.target.value })}
                className="text-end"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-end">אימייל</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={supplierData.email}
                onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                className="text-end"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-end">כתובת</label>
            <Input
              placeholder="כתובת הספק"
              value={supplierData.address}
              onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
              className="text-end"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-end">
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
                className="text-end"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-end">טווח מחירים</label>
              <select
                value={supplierData.price_range}
                onChange={(e) => setSupplierData({ ...supplierData, price_range: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-end"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-end">הערות</label>
            <Textarea
              placeholder="הערות נוספות על הספק..."
              value={supplierData.notes}
              onChange={(e) => setSupplierData({ ...supplierData, notes: e.target.value })}
              rows={4}
              className="text-end"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            ביטול
          </Button>
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
              "שמור ספק"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}