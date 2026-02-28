import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

export default function EditStageDialog({ stage, isOpen, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [stageData, setStageData] = useState({
    title: stage?.title || '',
    duration: stage?.duration || '',
    budget_percentage: stage?.budget_percentage || '',
    priority: stage?.priority || 'בינונית'
  });

  const handleSave = async () => {
    if (!stage?.id) return;
    
    setSaving(true);
    try {
      await base44.entities.Stage.update(stage.id, stageData);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error updating stage:", error);
      alert("שגיאה בשמירת השינויים");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800 text-end">
              ערוך שלב: {stage?.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block text-end">
              שם השלב
            </Label>
            <Input
              id="title"
              value={stageData.title}
              onChange={(e) => setStageData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="למשל: ביסוס ויציקת רצפה"
              className="text-end"
            />
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700 mb-2 block text-end">
              משך זמן משוער
            </Label>
            <Input
              id="duration"
              value={stageData.duration}
              onChange={(e) => setStageData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="למשל: 2-3 שבועות"
              className="text-end"
            />
          </div>

          {/* Budget Percentage */}
          <div>
            <Label htmlFor="budget" className="text-sm font-medium text-gray-700 mb-2 block text-end">
              אחוז מהתקציב הכולל
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="budget"
                type="text"
                value={stageData.budget_percentage}
                onChange={(e) => setStageData(prev => ({ ...prev, budget_percentage: e.target.value }))}
                placeholder="למשל: 15%"
                className="flex-1 text-end"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                מהתקציב הכולל
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-end">
              הזן אחוז עם סימן % או מספר בלבד
            </p>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              עדיפות
            </Label>
            <Select
              value={stageData.priority}
              onValueChange={(value) => setStageData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="נמוכה">נמוכה</SelectItem>
                <SelectItem value="בינונית">בינונית</SelectItem>
                <SelectItem value="גבוהה">גבוהה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !stageData.title}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 me-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}