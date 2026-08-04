import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, UserX, UserCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import { useAuth } from "../hooks/useAuth";
import AdminPageHeader from "./components/AdminPageHeader";
import {
  fetchAllUsers,
  setUserDisabled,
  updateUserRole,
} from "../lib/userManagement";
import type { ManagedUser } from "../lib/userManagement";
import toast from "react-hot-toast";
import { showConfirm } from "../lib/confirm";

export default function UserManagement() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const isDarkTheme = theme === "dark";

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllUsers();
        if (mounted) setUsers(data);
      } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleRoleToggle(targetUser: ManagedUser) {
    const nextRole = targetUser.role === "admin" ? "customer" : "admin";
    const result = await showConfirm({
      title: nextRole === "admin" ? "Grant Admin Role" : "Remove Admin Role",
      text:
        nextRole === "admin"
          ? `Are you sure you want to make ${targetUser.email} an admin?`
          : `Are you sure you want to remove ${targetUser.email} from the admin role?`,
      icon: "question",
      confirmButtonText: nextRole === "admin" ? "Make Admin" : "Remove Admin",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setBusyId(targetUser.id);

    try {
      await updateUserRole(targetUser.id, nextRole);
      setUsers((current) =>
        current.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      );
      toast.success("Admin role updated successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDisableToggle(targetUser: ManagedUser) {
    const nextDisabled = !targetUser.is_disabled;
    const result = await showConfirm({
      title: nextDisabled ? "Disable Account" : "Enable Account",
      text: nextDisabled
        ? `Are you sure you want to disable ${targetUser.email}?`
        : `Are you sure you want to enable ${targetUser.email}?`,
      icon: "warning",
      confirmButtonText: nextDisabled ? "Disable" : "Enable",
      cancelButtonText: "Cancel",
      variant: "danger",
    });
    if (!result.isConfirmed) return;

    setBusyId(targetUser.id);

    try {
      await setUserDisabled(targetUser.id, nextDisabled);
      setUsers((current) =>
        current.map((u) => (u.id === targetUser.id ? { ...u, is_disabled: nextDisabled } : u))
      );
      toast.success(nextDisabled ? "Account disabled successfully." : "Account enabled successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        subtitle="Manage customer and admin accounts. Promote trusted users to admin, or disable accounts that shouldn't have access."
      />

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
          isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            No users found.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;

              return (
                <li
                  key={u.id}
                  className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                    isDarkTheme ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold break-all">{u.email}</p>

                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-violet-500/15 text-violet-400"
                            : isDarkTheme
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Customer"}
                      </span>

                      {u.is_disabled && (
                        <span className="rounded-lg bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-400">
                          Disabled
                        </span>
                      )}

                      {isSelf && (
                        <span className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                          (You)
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => void handleRoleToggle(u)}
                      disabled={isSelf || busyId === u.id}
                      title={isSelf ? "You can't change your own role" : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {u.role === "admin" ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDisableToggle(u)}
                      disabled={isSelf || busyId === u.id}
                      title={isSelf ? "You can't disable your own account" : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        u.is_disabled
                          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                          : "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                      }`}
                    >
                      {u.is_disabled ? <UserCheck size={14} /> : <UserX size={14} />}
                      {u.is_disabled ? "Enable" : "Disable"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
