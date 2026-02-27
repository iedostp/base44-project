import React, { useState } from "react";
import { Users, Shield, Eye, Edit3, Crown, Mail, UserPlus, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ROLES = [
  {
    value: "admin",
    label: "מנהל",
    description: "גישה מלאה לכל הפרויקט",
    icon: Crown,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
    badge: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    permissions: ["צפייה בכל המידע", "עריכת כל הנתונים", "ניהול משתמשים", "מחיקת נתונים"],
  },
  {
    value: "editor",
    label: "עורך",
    description: "יכול לערוך אך לא למחוק",
    icon: Edit3,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    permissions: ["צפייה בכל המידע", "עריכת שלבים ומשימות", "הוספת הוצאות וספקים", "העלאת מסמכים"],
  },
  {
    value: "viewer",
    label: "צופה",
    description: "קריאה בלבד, ללא עריכה",
    icon: Eye,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600",
    badge: "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300",
    permissions: ["צפייה בפרויקט", "צפייה בשלבים ומשימות", "צפייה בתקציב", "צפייה במסמכים"],
  },
];

const getRoleInfo = (role) => ROLES.find(r => r.value === role) || ROLES[2];

export default function UserManagementPanel({ user }) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["users_list"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users_list"] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users_list"] }),
  });

  const handleDeleteUser = (u) => {
    if (confirm(`האם אתה בטוח שברצונך להוריד את המשתמש "${u.full_name || u.email}"?`)) {
      deleteUserMutation.mutate(u.id);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole === "admin" ? "admin" : "user");
    setInviting(false);
    setInviteSuccess(true);
    setInviteEmail("");
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  // All users can manage their own project (they are admins of their environment)
  // Only allow listing/inviting - accessible to all authenticated users

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
       <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-xl flex-shrink-0">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div className="text-start flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">ניהול משתמשים</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">הזמן משתמשים והקצה תפקידים</p>
          </div>
        </div>

      {/* Role legend */}
      <div className="mb-5">
        <button
          className="text-xs text-indigo-600 dark:text-indigo-400 underline mb-2 block text-start"
          onClick={() => setShowRoleInfo(!showRoleInfo)}
        >
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          {showRoleInfo ? "הסתר הסבר תפקידים" : "הצג הסבר תפקידים"}
        </button>
        {showRoleInfo && (
          <div className="grid gap-3">
            {ROLES.map(role => {
              const Icon = role.icon;
              return (
                <div key={role.value} className={`rounded-xl p-3 border ${role.bg}`}>
                   <div className="flex items-center gap-2 justify-between mb-0 flex-row">
                     <div className="flex items-center gap-2 flex-row-reverse">
                       <Icon className={`w-4 h-4 ${role.color}`} />
                       <span className="font-semibold text-sm text-gray-800 dark:text-slate-100">{role.label}</span>
                       <span className="text-xs text-gray-500 dark:text-slate-400">— {role.description}</span>
                     </div>
                   </div>
                   <div className="flex flex-wrap gap-x-2 gap-y-1 justify-end mt-2 flex-row-reverse">
                     {role.permissions.map((p, i) => (
                       <span key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1 flex-row whitespace-nowrap">
                         {p}<Check className="w-3 h-3 text-green-500" />
                       </span>
                     ))}
                   </div>
                 </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite new user */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700 mb-5">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 text-start mb-3 flex items-center gap-2 justify-end flex-row-reverse">
          הזמן משתמש חדש
          <UserPlus className="w-4 h-4 text-indigo-600" />
        </p>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="כתובת אימייל"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="text-start"
            dir="ltr"
          />
          <div className="flex gap-2 flex-row-reverse">
            {ROLES.map(role => (
              <button
                key={role.value}
                onClick={() => setInviteRole(role.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  inviteRole === role.value
                    ? role.bg + " " + role.color + " border-current font-bold"
                    : "bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
          <Button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className={`w-full ${inviteSuccess ? "bg-green-500 hover:bg-green-600" : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"} text-white`}
          >
            {inviteSuccess ? (
              <><Check className="w-4 h-4 ml-2" />ההזמנה נשלחה!</>
            ) : inviting ? "שולח..." : (
              <><Mail className="w-4 h-4 ml-2" />שלח הזמנה</>
            )}
          </Button>
        </div>
      </div>

      {/* Users list */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 text-start mb-3">משתמשים קיימים</p>
        {users.map(u => {
          const roleInfo = getRoleInfo(u.role === "admin" ? "admin" : u.role || "viewer");
          const Icon = roleInfo.icon;
          const isCurrentUser = u.email === user?.email;
          return (
            <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-600">
              <div className="flex-1 text-start min-w-0">
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate">
                  {u.full_name || u.email}
                  {isCurrentUser && <span className="text-xs text-gray-400 mr-1">(אתה)</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${roleInfo.badge}`}>
                  {roleInfo.label}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ROLES.map(role => (
                    <button
                      key={role.value}
                      onClick={() => !isCurrentUser && updateRoleMutation.mutate({ userId: u.id, role: role.value === "admin" ? "admin" : role.value === "editor" ? "editor" : "user" })}
                      disabled={isCurrentUser}
                      title={role.label}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs border transition-all ${
                        (u.role === role.value || (role.value === "viewer" && (!u.role || u.role === "user")))
                          ? role.bg + " border-current"
                          : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 opacity-40"
                      } ${isCurrentUser ? "cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
                    >
                      <role.icon className={`w-3.5 h-3.5 ${role.color}`} />
                    </button>
                  ))}
                  {!isCurrentUser && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      title="הורד משתמש"
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-700 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">אין משתמשים נוספים</p>
        )}
      </div>
    </div>
  );
}