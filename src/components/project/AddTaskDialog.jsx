import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddTaskDialog({ isOpen, onClose, stageId, onTaskAdded }) {
  const [isSaving, setIsSaving] = useState(false);
  const [taskData, setTaskData] = useState({
    text: "",
    duration: "",
    priority: "בינונית",
    done: false,
    due_date: "",
    due_time: "",
    status: "טרם התחיל"
  });

  const handleSave = async () => {
    if (!taskData.text) {
      alert("נא למלא את תיאור המשימה");
      return;
    }

    setIsSaving(true);
    try {
      // Get current tasks count to set order
      const existingTasks = await base44.entities.Task.filter({ stage_id: stageId });
      
      await base44.entities.Task.create({
        ...taskData,
        stage_id: stageId,
        order: existingTasks.length + 1
      });
      
      if (onTaskAdded) onTaskAdded();
      
      // Reset form
      setTaskData({
        text: "",
        duration: "",
        priority: "בינונית",
        done: false,
        due_date: "",
        due_time: "",
        status: "טרם התחיל"
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("שגיאה בשמירת המשימה");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">הוסף משימה חדשה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
              תיאור המשימה <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="תיאור המשימה"
              value={taskData.text}
              onChange={(e) => setTaskData({ ...taskData, text: e.target.value })}
              className="text-start"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
              משך זמן משוער
            </label>
            <Input
              placeholder="למשל: 2-3 שבועות"
              value={taskData.duration}
              onChange={(e) => setTaskData({ ...taskData, duration: e.target.value })}
              className="text-start"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">תאריך יעד</label>
              <input
                type="date"
                value={taskData.due_date}
                onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-start"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">שעת יעד</label>
              <input
                type="time"
                value={taskData.due_time}
                onChange={(e) => setTaskData({ ...taskData, due_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-start"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-2 text-start">עדיפות</label>
              <select
                id="task-priority"
                aria-label="עדיפות משימה"
                value={taskData.priority}
                onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-start"
              >
                <option value="נמוכה">נמוכה</option>
                <option value="בינונית">בינונית</option>
                <option value="גבוהה">גבוהה</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 mb-2 text-start">סטטוס</label>
              <select
                id="task-status"
                aria-label="סטטוס משימה"
                value={taskData.status}
                onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-start"
              >
                <option value="טרם התחיל">טרם התחיל</option>
                <option value="בתהליך">בתהליך</option>
                <option value="ממתין לאישור">ממתין לאישור</option>
                <option value="הושלם">הושלם</option>
              </select>
            </div>
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
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              "שמור משימה"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}