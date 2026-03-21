import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, Users, FileText, Calendar, Settings, Layers, Home as HomeIcon, PieChart, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../components/i18n";

import ProjectHeader from "../components/project/ProjectHeader";
import DashboardSummary from "../components/project/DashboardSummary";
import GlobalSearch from "../components/project/GlobalSearch";
import StagesTab from "../components/project/StagesTab";
import SuppliersTab from "../components/project/SuppliersTab";
import BudgetTab from "../components/project/BudgetTab";
import GanttChart from "../components/project/GanttChart";
import DocumentsTab from "../components/project/DocumentsTab";
import SettingsTab from "../components/SettingsTab";
import PhotoUpload from "../components/project/PhotoUpload";
import NotificationBell from "../components/notifications/NotificationBell";
import { sendProjectUpdate, sendMilestoneReminder } from "../lib/notifyService";
import AppTutorial, { useTutorial } from "../components/tutorial/AppTutorial";

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const { show: showTutorial, dismiss: dismissTutorial } = useTutorial();

  // Derive all state directly from URL — a single counter forces re-render on popstate
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  useEffect(() => {
    // Push an initial sentinel entry so Android back can exit the app
    // rather than navigating backward within the PWA
    const params = new URLSearchParams(window.location.search);
    if (!params.get('tab')) {
      params.set('tab', 'home');
      window.history.replaceState({ tab: 'home' }, '', `?${params.toString()}`);
    }

    const handlePopState = (e) => {
      forceUpdate();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getParam = (key, fallback = '') => {
    if (typeof window === 'undefined') return fallback;
    return new URLSearchParams(window.location.search).get(key) || fallback;
  };

  const activeTab = getParam('tab', 'home');
  const activeModal = getParam('modal', null);

  // Tab order for slide direction calculation
  const TAB_ORDER = ['home', 'stages', 'budget', 'suppliers', 'documents', 'timeline', 'photos', 'settings'];
  const [prevTab, setPrevTab] = React.useState(activeTab);
  const [slideDir, setSlideDir] = React.useState(0); // -1 left, 1 right

  const setActiveTab = (tab) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const prevIndex = TAB_ORDER.indexOf(activeTab);
    const nextIndex = TAB_ORDER.indexOf(tab);
    setSlideDir(nextIndex > prevIndex ? (isRTL ? 1 : -1) : (isRTL ? -1 : 1));
    setPrevTab(activeTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    params.delete('modal');
    // Use replaceState for tab changes so Android back button exits the app
    // rather than cycling through every tab visited
    window.history.replaceState({ tab }, '', `?${params.toString()}`);
    forceUpdate();
  };

  const setModalState = (modalName) => {
    const params = new URLSearchParams(window.location.search);
    if (modalName) {
      // pushState so Android back button closes the modal
      params.set('modal', modalName);
      window.history.pushState({ modal: modalName }, '', `?${params.toString()}`);
    } else {
      params.delete('modal');
      // replaceState when closing so we don't leave a dead entry
      window.history.replaceState({ tab: activeTab }, '', `?${params.toString()}`);
    }
    forceUpdate();
  };
  const queryClient = useQueryClient();

  // Supabase auth user — always available after login on Vercel/PWA
  const { user: supabaseUser } = useAuth();

  // Base44 user profile — has extra fields (whatsapp settings) but only
  // available when accessed via Base44 platform with an injected token.
  // Falls back to null on direct Vercel access.
  const { data: base44Profile, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Merge: prefer Base44 profile (has whatsapp fields), fall back to Supabase
  // so email-based project filtering always works regardless of access origin.
  // Build merged user: Base44 profile has whatsapp/role fields; Supabase
  // user_metadata carries Google OAuth data (full_name, avatar_url).
  const user = base44Profile ?? (supabaseUser ? {
    email: supabaseUser.email,
    id: supabaseUser.id,
    full_name: supabaseUser.user_metadata?.full_name
               ?? supabaseUser.user_metadata?.name
               ?? supabaseUser.email,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
  } : null);

  // Fetch project
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => user?.email
      ? base44.entities.Project.filter({ created_by: user.email })
      : base44.entities.Project.list(),
    enabled: !!user?.email,
  });

  const project = projects[0];

  // Track initial project status for change detection
  useEffect(() => {
    if (project?.status && prevStatusRef.current === null) {
      prevStatusRef.current = project.status;
    }
  }, [project?.status]);

  // Fetch stages
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['stages', project?.id],
    queryFn: () => base44.entities.Stage.filter({ project_id: project.id }, 'order'),
    enabled: !!project?.id,
  });

  // Fetch tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      if (user?.email) {
        return base44.entities.Task.filter({ created_by: user.email }, 'order');
      }
      return base44.entities.Task.filter({ project_id: project.id }, 'order');
    },
    enabled: !!project?.id,
  });

  // Fetch subtopics
  const { data: allSubtopics = [] } = useQuery({
    queryKey: ['subtopics', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      if (user?.email) {
        return base44.entities.Subtopic.filter({ created_by: user.email }, 'order');
      }
      return base44.entities.Subtopic.filter({ project_id: project.id }, 'order');
    },
    enabled: !!project?.id,
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', project?.id],
    queryFn: () => base44.entities.Supplier.filter({ project_id: project.id }),
    enabled: !!project?.id,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', project?.id],
    queryFn: () => base44.entities.Document.filter({ project_id: project.id }, '-created_date'),
    enabled: !!project?.id,
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', project?.id],
    queryFn: () => base44.entities.Expense.filter({ project_id: project.id }, '-date'),
    enabled: !!project?.id,
  });

  const prevStatusRef = useRef(null);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (updatedProject) => {
      if (project?.id) {
        return base44.entities.Project.update(project.id, updatedProject);
      } else {
        return base44.entities.Project.create(updatedProject);
      }
    },
    onSuccess: (_, updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Fire WhatsApp notification when status changes
      const newStatus = updatedProject?.status;
      if (
        newStatus &&
        newStatus !== prevStatusRef.current &&
        user?.whatsapp_notifications &&
        user?.whatsapp_phone
      ) {
        sendProjectUpdate(
          user.whatsapp_phone,
          project?.name || updatedProject?.name || "",
          `סטטוס עודכן: ${newStatus}`
        ).catch(console.error);
      }
      prevStatusRef.current = newStatus ?? prevStatusRef.current;
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }) => base44.entities.Task.update(taskId, updates),
    onSuccess: (_, { taskId, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stages'] });

      if (!user?.whatsapp_notifications || !user?.whatsapp_phone) return;

      // Notify when task is marked done
      if (updates.done === true) {
        const task = allTasks.find(t => t.id === taskId);
        if (task) {
          sendProjectUpdate(
            user.whatsapp_phone,
            project?.name || "",
            `✅ משימה '${task.text}' בפרויקט '${project?.name || ""}' עודכנה ל-הושלם`
          ).catch(console.error);
        }
      }

      // Notify when task is marked delayed (un-done a task that is overdue)
      if (updates.done === false) {
        const task = allTasks.find(t => t.id === taskId);
        if (task?.due_date && new Date(task.due_date) < new Date()) {
          sendProjectUpdate(
            user.whatsapp_phone,
            project?.name || "",
            `⚠️ משימה '${task.text}' בפרויקט '${project?.name || ""}' עודכנה ל-באיחור`
          ).catch(console.error);
        }
      }
    },
  });

  // Update stage mutation (used by GanttChart drag)
  const updateStageMutation = useMutation({
    mutationFn: ({ stageId, updates }) => base44.entities.Stage.update(stageId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId) => base44.entities.Document.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Calculate progress
  const calculateProgress = () => {
    if (allTasks.length === 0) return 0;
    const completedTasks = allTasks.filter(t => t.done).length;
    return Math.round((completedTasks / allTasks.length) * 100);
  };

  const calculateBudgetProgress = () => {
    if (!project?.total_budget || stages.length === 0) return 0;
    const completedStages = stages.filter(s => s.completed);
    const spentPercent = completedStages.reduce((acc, stage) => {
      return acc + (parseFloat(stage.budget_percentage) || 0);
    }, 0);
    return Math.round(spentPercent);
  };

  // Handle task toggle
  const handleTaskToggle = (task) => {
    const newDoneStatus = !task.done;
    
    // Optimistic update - update UI immediately with correct query key
    queryClient.setQueryData(['tasks', project?.id], (oldTasks) => {
      if (!oldTasks) return oldTasks;
      return oldTasks.map(t => t.id === task.id ? { ...t, done: newDoneStatus } : t);
    });

    // Check if all tasks in stage are done
    const stageTasks = allTasks.filter(t => t.stage_id === task.stage_id);
    const allDone = stageTasks.every(t => 
      t.id === task.id ? newDoneStatus : t.done
    );
    
    const stage = stages.find(s => s.id === task.stage_id);
    if (stage && stage.completed !== allDone) {
      // Optimistic update for stage
      queryClient.setQueryData(['stages', project?.id], (oldStages) => {
        if (!oldStages) return oldStages;
        return oldStages.map(s => s.id === stage.id ? { ...s, completed: allDone } : s);
      });
      base44.entities.Stage.update(task.stage_id, { completed: allDone });

      // Notify milestone reached
      if (allDone && user?.whatsapp_notifications && user?.whatsapp_phone) {
        sendProjectUpdate(
          user.whatsapp_phone,
          project?.name || "",
          `🏆 אבן דרך '${stage.title}' הושגה בפרויקט '${project?.name || ""}'!`
        ).catch(console.error);
      }
    }

    // Update in background
    updateTaskMutation.mutate({ 
      taskId: task.id, 
      updates: { done: newDoneStatus }
    });
  };

  // Notify tasks due tomorrow — once per session when tasks load
  const deadlineNotifiedRef = useRef(false);
  useEffect(() => {
    if (
      deadlineNotifiedRef.current ||
      !allTasks.length ||
      !user?.whatsapp_notifications ||
      !user?.whatsapp_phone ||
      !project?.name
    ) return;
    deadlineNotifiedRef.current = true;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const dueTomorrow = allTasks.filter(
      t => !t.done && t.due_date && t.due_date.slice(0, 10) === tomorrowStr
    );

    dueTomorrow.forEach(task => {
      sendProjectUpdate(
        user.whatsapp_phone,
        project.name,
        `⏰ תזכורת: משימה '${task.text}' בפרויקט '${project.name}' מסתיימת מחר`
      ).catch(console.error);
    });
  }, [allTasks, user, project]);

  const handleProjectUpdate = (updatedProject) => {
    updateProjectMutation.mutate(updatedProject);
  };

  // Auto-initialize new users
  const initMutation = useMutation({
    mutationFn: (projectId) => base44.functions.invoke('initNewUser', { project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  React.useEffect(() => {
    if (project?.id && !stagesLoading && stages.length === 0 && !initMutation.isPending && !initMutation.isSuccess) {
      initMutation.mutate(project.id);
    }
  }, [project?.id, stages.length, stagesLoading]);

  const handleDataUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['stages'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  const handleDocumentAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const handleDocumentDeleted = (document) => {
    if (confirm(`${t('confirmDeleteDoc')} "${document.name}"?`)) {
      deleteDocumentMutation.mutate(document.id);
    }
  };

  // userLoading (base44.auth.me) is no longer gating — supabaseUser is available
  // immediately from React state, so project queries start right away.
  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-300">{t('loadingData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {showTutorial && (
          <AppTutorial
            onDismiss={dismissTutorial}
            onTabChange={setActiveTab}
          />
        )}
      </AnimatePresence>
      <div className="p-0 md:p-8">
      <div className="max-w-7xl mx-auto px-0 md:px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">


            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: slideDir * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -60 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {activeTab === 'home' && (
                  project?.id ? (
                    <div className="space-y-6">
                      <DashboardSummary
                        project={project}
                        stages={stages}
                        tasks={allTasks}
                        expenses={expenses}
                      />
                      <div className="flex justify-center">
                        <GlobalSearch
                          stages={stages}
                          tasks={allTasks}
                          expenses={expenses}
                          suppliers={suppliers}
                          documents={documents}
                          onNavigate={setActiveTab}
                        />
                      </div>
                      <ProjectHeader
                        project={project}
                        onUpdate={handleProjectUpdate}
                        overallProgress={calculateProgress()}
                        budgetProgress={calculateBudgetProgress()}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 mt-8">
                      <ProjectHeader
                        project={project}
                        onUpdate={handleProjectUpdate}
                        overallProgress={calculateProgress()}
                        budgetProgress={calculateBudgetProgress()}
                      />
                      <p className="text-lg text-gray-600 dark:text-slate-300 mb-2 mt-8">👋 {t('noProject')}</p>
                      <p className="text-gray-500 dark:text-slate-400">{t('fillProjectDetails')}</p>
                    </div>
                  )
                )}
                {activeTab === 'stages' && (
                  project?.id ? (
                    <StagesTab
                      stages={stages}
                      tasks={allTasks}
                      subtopics={allSubtopics}
                      expenses={expenses}
                      suppliers={suppliers}
                      projectId={project.id}
                      onTaskToggle={handleTaskToggle}
                      onUpdate={handleDataUpdate}
                      user={user}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500"><p className="text-4xl mb-4">🏗️</p><p>{t('noProject')}</p></div>
                  )
                )}
                {activeTab === 'budget' && (
                  project?.id ? (
                    <BudgetTab
                      project={project}
                      stages={stages}
                      suppliers={suppliers}
                      expenses={expenses}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500"><p className="text-4xl mb-4">💰</p><p>{t('noProject')}</p></div>
                  )
                )}
                {activeTab === 'suppliers' && (
                  project?.id ? (
                    <SuppliersTab
                      suppliers={suppliers}
                      projectId={project.id}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500"><p className="text-4xl mb-4">👷</p><p>{t('noProject')}</p></div>
                  )
                )}
                {activeTab === 'documents' && (
                  project?.id ? (
                    <DocumentsTab
                      documents={documents}
                      stages={stages}
                      suppliers={suppliers}
                      projectId={project.id}
                      project={project}
                      onDocumentAdded={handleDocumentAdded}
                      onDocumentDeleted={handleDocumentDeleted}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500"><p className="text-4xl mb-4">📄</p><p>{t('noProject')}</p></div>
                  )
                )}
                {activeTab === 'timeline' && (
                  project?.id ? (
                    <GanttChart
                      project={project}
                      stages={stages}
                      tasks={allTasks}
                      suppliers={suppliers}
                      onStageUpdate={(stageId, updates) => updateStageMutation.mutate({ stageId, updates })}
                      onProjectUpdate={handleProjectUpdate}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500"><p className="text-4xl mb-4">📅</p><p>{t('noProject')}</p></div>
                  )
                )}
                {activeTab === 'photos' && (
                  project?.id ? (
                    <PhotoUpload projectId={project.id} uploadedBy={user?.email} />
                  ) : (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500"><p className="text-4xl mb-4">📸</p><p>{t('noProject')}</p></div>
                  )
                )}
                {activeTab === 'settings' && (
                  <SettingsTab user={user} project={project} />
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>

        {project?.id && (
          <div className="mt-8 text-center hidden md:block">
            <p className="text-gray-600 dark:text-slate-300 text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm inline-block px-6 py-3 rounded-full shadow-sm">
              💡 {t('reminder')}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-8 h-16 w-full" role="tablist" aria-label={t('appName')}>
          {[
            { key: 'home', Icon: HomeIcon, label: t('tab_home') },
            { key: 'stages', Icon: Layers, label: t('tab_stages') },
            { key: 'budget', Icon: PieChart, label: t('tab_budget') },
            { key: 'suppliers', Icon: Users, label: t('tab_suppliers') },
            { key: 'documents', Icon: FileText, label: t('tab_documents') },
            { key: 'timeline', Icon: Calendar, label: t('tab_timeline') },
            { key: 'photos', Icon: Camera, label: t('tab_photos') },
            { key: 'settings', Icon: Settings, label: t('tab_settings') },
          ].map(({ key, Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              aria-label={label}
              aria-selected={activeTab === key}
              role="tab"
              className={`flex flex-col items-center justify-center gap-1 select-none transition-colors ${activeTab === key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}`}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-[10px] font-medium" aria-hidden="true">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}