import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Upload } from "lucide-react";
import StageCard from "./StageCard";
import ImportStagesDialog from "./ImportStagesDialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function StagesTab({ stages, tasks, subtopics, expenses, suppliers, projectId, onTaskToggle, onUpdate, user }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const queryClient = useQueryClient();
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop === 0) {
      setPullDistance(0);
    }
  };

  const handleTouchMove = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop === 0 && !isPulling) {
      const touch = e.touches[0];
      const startY = touch.clientY;
      setPullDistance(Math.max(0, Math.min(startY / 3, PULL_THRESHOLD)));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsPulling(true);
      await queryClient.invalidateQueries();
      setTimeout(() => {
        setIsPulling(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
  };

  const handleImported = () => {
    queryClient.invalidateQueries({ queryKey: ['stages'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleStageDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['stages'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  return (
    <div 
      className="space-y-5 w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImport(true)}
          className="border-green-500 text-green-700 hover:bg-green-50 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/20"
        >
          <Upload className="w-4 h-4 me-2" />
          ייבוא שלבים מ-Excel
        </Button>
      </div>

      <ImportStagesDialog
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        projectId={projectId}
        currentStagesCount={stages.length}
        onImported={handleImported}
      />

      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: pullDistance / PULL_THRESHOLD }}
          className="flex justify-center py-4"
        >
          <motion.div
            animate={{ rotate: isPulling ? 360 : (pullDistance / PULL_THRESHOLD) * 180 }}
            transition={{ duration: isPulling ? 0.6 : 0 }}
          >
            <RefreshCw 
              className={`w-6 h-6 ${isPulling ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}
            />
          </motion.div>
        </motion.div>
      )}
      
      {stages.map((stage) => {
        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
        const stageSubtopics = subtopics.filter(s => s.stage_id === stage.id);
        
        return (
          <StageCard
            key={stage.id}
            stage={stage}
            tasks={stageTasks}
            subtopics={stageSubtopics}
            expenses={expenses}
            suppliers={suppliers}
            projectId={projectId}
            onTaskToggle={onTaskToggle}
            onUpdate={onUpdate}
            onDelete={handleStageDeleted}
            user={user}
          />
        );
      })}
    </div>
  );
}