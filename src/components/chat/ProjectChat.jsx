import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProjectChat({ projectId, user }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => base44.entities.Message.filter(
      { project_id: projectId, message_type: "channel" },
      "-created_date"
    ),
    enabled: !!projectId,
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: (messageData) =>
      base44.entities.Message.create({
        ...messageData,
        project_id: projectId,
        sender_email: user.email,
        sender_name: user.full_name,
        message_type: "channel",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
      setContent("");
    },
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMessageMutation.mutate({ content });
  };

  const handleSummarizeChat = async () => {
    setIsSummarizing(true);
    try {
      const chatContent = messages
        .map(
          (m) =>
            `${m.sender_name} (${new Date(m.created_date).toLocaleTimeString("he-IL")}): ${m.content}`
        )
        .join("\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `סכם בקצרה בעברית את השיחה הבאה בצורה שימושית ופקטואלית:\n\n${chatContent}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
          },
        },
      });

      // Save summary
      await base44.entities.ChatSummary.create({
        project_id: projectId,
        type: "channel",
        summary: response.summary,
        message_count: messages.length,
        is_generated: true,
      });

      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 h-[500px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800 dark:text-slate-100">צ'אט הפרויקט</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSummarizeChat}
          disabled={messages.length === 0 || isSummarizing}
          className="gap-1"
        >
          {isSummarizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          סכם
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-slate-400 py-8">
            <p>אין הודעות עדיין</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.sender_email === user.email ? "ltr:justify-end rtl:justify-start" : ""
              }`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  msg.sender_email === user.email
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100"
                }`}
              >
                <p className="text-sm font-medium">
                  {msg.sender_email === user.email ? "אתה" : msg.sender_name}
                </p>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_date).toLocaleTimeString("he-IL")}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 dark:border-slate-700 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="כתוב הודעה..."
            disabled={createMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={createMessageMutation.isPending || !content.trim()}
            size="icon"
          >
            {createMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}