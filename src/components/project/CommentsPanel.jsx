import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "עכשיו";
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק'`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שע'`;
  return date.toLocaleDateString("he-IL");
}

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  }
  return email?.slice(0, 2) || "?";
}

const COLORS = ["bg-indigo-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500", "bg-purple-500"];
function avatarColor(email) {
  let h = 0;
  for (let i = 0; i < (email?.length || 0); i++) h = (h * 31 + email.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}

export default function CommentsPanel({ refType, refId, projectId, user }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const queryKey = ["comments", refType, refId];

  const { data: comments = [] } = useQuery({
    queryKey,
    queryFn: () => base44.entities.Comment.filter({ ref_type: refType, ref_id: refId }),
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Count comments without fetching all - use a separate query
  const { data: countData = [] } = useQuery({
    queryKey: ["comments_count", refType, refId],
    queryFn: () => base44.entities.Comment.filter({ ref_type: refType, ref_id: refId }),
    staleTime: 30000,
  });

  const count = countData.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text.trim()) return;
    addMutation.mutate({
      ref_type: refType,
      ref_id: refId,
      project_id: projectId,
      text: text.trim(),
      author_email: user?.email || "",
      author_name: user?.full_name || "",
    });
    setText("");
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      {/* Toggle button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>{count > 0 ? `${count} הערות` : "הוסף הערה"}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-indigo-100 dark:border-slate-600 bg-indigo-50/50 dark:bg-slate-700/50 p-3 space-y-2">
          {/* Comments list */}
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-2">אין הערות עדיין. היה הראשון לכתוב!</p>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 items-start group">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(c.author_email)}`}>
                  {getInitials(c.author_name, c.author_email).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                      {c.author_name || c.author_email?.split("@")[0]}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(c.created_date)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-200 leading-snug break-words">{c.text}</p>
                </div>
                {c.author_email === user?.email && (
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center pt-1 border-t border-indigo-100 dark:border-slate-600">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(user?.email)}`}>
              {getInitials(user?.full_name, user?.email).toUpperCase()}
            </div>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit(e); }}
              placeholder="כתוב הערה..."
              className="flex-1 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-slate-200 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!text.trim() || addMutation.isPending}
              className="p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}