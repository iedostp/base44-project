import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DirectMessagesPanel({ projectId, user }) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState("");

  // Fetch all project users (simplified - fetches all comments to get unique users)
  const { data: projectUsers = [] } = useQuery({
    queryKey: ["project_users", projectId],
    queryFn: async () => {
      const messages = await base44.entities.Message.filter({
        project_id: projectId,
      });
      const uniqueUsers = new Map();
      messages.forEach((msg) => {
        if (msg.sender_email !== user.email && !uniqueUsers.has(msg.sender_email)) {
          uniqueUsers.set(msg.sender_email, {
            email: msg.sender_email,
            name: msg.sender_name,
          });
        }
      });
      return Array.from(uniqueUsers.values());
    },
    enabled: !!projectId,
  });

  // Fetch direct messages with selected user
  const { data: directMessages = [] } = useQuery({
    queryKey: ["direct_messages", projectId, selectedUser?.email],
    queryFn: () =>
      base44.entities.Message.filter({
        project_id: projectId,
        message_type: "direct",
      }),
    enabled: !!projectId && !!selectedUser,
  });

  // Create direct message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) =>
      base44.entities.Message.create({
        ...messageData,
        project_id: projectId,
        sender_email: user.email,
        sender_name: user.full_name,
        message_type: "direct",
        recipient_email: selectedUser.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["direct_messages", projectId, selectedUser?.email],
      });
      setContent("");
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser) return;
    sendMessageMutation.mutate({ content });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-800 dark:text-slate-100">הודעות ישירות</h3>
      </div>

      {/* Users List */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">משתתפים</p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {projectUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">אין משתתפים אחרים</p>
          ) : (
            projectUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => setSelectedUser(u)}
                className={`w-full text-right p-2 rounded-lg transition-colors ${
                  selectedUser?.email === u.email
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100"
                }`}
              >
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUser && (
        <div className="space-y-4">
          <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              שיחה עם {selectedUser.name}
            </p>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {directMessages.length === 0 ? (
                <p className="text-xs text-gray-500">אין הודעות עדיין</p>
              ) : (
                directMessages
                  .filter(
                    (m) =>
                      (m.sender_email === user.email &&
                        m.recipient_email === selectedUser.email) ||
                      (m.sender_email === selectedUser.email &&
                        m.recipient_email === user.email)
                  )
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs ${
                        msg.sender_email === user.email ? "text-right" : ""
                      }`}
                    >
                      <p className="font-medium text-gray-700 dark:text-slate-300">
                        {msg.sender_email === user.email ? "אתה" : selectedUser.name}
                      </p>
                      <p className="text-gray-600 dark:text-slate-400">{msg.content}</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Send Message */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב הודעה..."
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || !content.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}