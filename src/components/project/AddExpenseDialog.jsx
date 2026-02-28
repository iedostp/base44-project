import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

export default function AddExpenseDialog({ projectId, stage, suppliers, isOpen, onClose, onAdded }) {
  const [saving, setSaving] = useState(false);
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'materials',
    payment_method: 'bank_transfer',
    supplier_id: '',
    invoice_number: '',
    notes: '',
    paid: true
  });

  const categories = [
    { value: 'materials', label: 'חומרי בניין' },
    { value: 'labor', label: 'כוח אדם' },
    { value: 'equipment', label: 'ציוד ומכונות' },
    { value: 'permits', label: 'אגרות והיתרים' },
    { value: 'professional_services', label: 'שירותים מקצועיים' },
    { value: 'other', label: 'אחר' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'מזומן' },
    { value: 'check', label: 'צ\'ק' },
    { value: 'bank_transfer', label: 'העברה בנקאית' },
    { value: 'credit_card', label: 'כרטיס אשראי' }
  ];

  const handleSave = async () => {
    if (!expenseData.description || !expenseData.amount) {
      alert('נא למלא את כל השדות החובה');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Expense.create({
        project_id: projectId,
        stage_id: stage?.id,
        ...expenseData,
        amount: parseFloat(expenseData.amount)
      });
      
      onAdded();
      handleClose();
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("שגיאה בהוספת ההוצאה");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setExpenseData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'materials',
      payment_method: 'bank_transfer',
      supplier_id: '',
      invoice_number: '',
      notes: '',
      paid: true
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800 text-end">
              הוסף הוצאה {stage && `- ${stage.title}`}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block text-end">
              תיאור ההוצאה *
            </Label>
            <Input
              id="description"
              value={expenseData.description}
              onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="למשל: רכישת חול ומלט"
              className="text-end"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2 block text-end">
                סכום (₪) *
              </Label>
              <Input
                id="amount"
                type="number"
                value={expenseData.amount}
                onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="text-end"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block text-end">
                תאריך
              </Label>
              <Input
                id="date"
                type="date"
                value={expenseData.date}
                onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
                className="text-end"
              />
            </div>
          </div>

          {/* Category and Payment Method */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expense-category" className="text-sm font-medium text-gray-700 mb-2 block">
                קטגוריה
              </Label>
              <Select
                value={expenseData.category}
                onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}
                name="expense-category"
              >
                <SelectTrigger id="expense-category" aria-label="קטגוריה">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-payment" className="text-sm font-medium text-gray-700 mb-2 block">
                אופן תשלום
              </Label>
              <Select
                value={expenseData.payment_method}
                onValueChange={(value) => setExpenseData(prev => ({ ...prev, payment_method: value }))}
                name="expense-payment"
              >
                <SelectTrigger id="expense-payment" aria-label="אופן תשלום">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Supplier */}
          {suppliers && suppliers.length > 0 && (
            <div>
              <Label htmlFor="expense-supplier" className="text-sm font-medium text-gray-700 mb-2 block">
                ספק (אופציונלי)
              </Label>
              <Select
                value={expenseData.supplier_id}
                onValueChange={(value) => setExpenseData(prev => ({ ...prev, supplier_id: value }))}
                name="expense-supplier"
              >
                <SelectTrigger id="expense-supplier" aria-label="ספק">
                  <SelectValue placeholder="בחר ספק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא ספק</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Invoice Number */}
          <div>
            <Label htmlFor="invoice" className="text-sm font-medium text-gray-700 mb-2 block text-end">
              מספר חשבונית (אופציונלי)
            </Label>
            <Input
              id="invoice"
              value={expenseData.invoice_number}
              onChange={(e) => setExpenseData(prev => ({ ...prev, invoice_number: e.target.value }))}
              placeholder="מספר חשבונית"
              className="text-end"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block text-end">
              הערות
            </Label>
            <Textarea
              id="notes"
              value={expenseData.notes}
              onChange={(e) => setExpenseData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="הערות נוספות..."
              rows={3}
              className="text-end"
            />
          </div>

          {/* Paid Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="paid"
              checked={expenseData.paid}
              onCheckedChange={(checked) => setExpenseData(prev => ({ ...prev, paid: checked }))}
            />
            <Label htmlFor="paid" className="text-sm font-medium text-gray-700 cursor-pointer">
              שולם
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || !expenseData.description || !expenseData.amount}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 me-2" />
                  הוסף הוצאה
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}