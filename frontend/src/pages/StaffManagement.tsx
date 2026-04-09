import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { CaseloadMetricCard } from "@/components/caseload/CaseloadMetricCard";
import {
  DASHBOARD_CONTENT_MAX_WIDTH,
  DashboardGlassPanel,
  dashboardFilterBarClass,
  dashboardTableBodyClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
  dashboardTableRowClass,
  dashboardTableShellClass,
} from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { useAuth } from "@/contexts/AuthContext";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { AlertCircle, CheckCircle, Heart, Mail, Search, Shield, UserCog, Users, Loader2, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  mfaEnabled: boolean;
}

interface UpdateRolesResponse {
  message?: string;
  roles?: string[];
}

interface DeleteUserResponse {
  message?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export const StaffManagement = () => {
  usePageHeader("Staff & Users", "Manage user roles and permissions");
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterRole, setFilterRole] = useState<"All" | "Admin" | "Donor">("All");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiFetchJson<User[]>(`${API_PREFIX}/auth/admin/users`);
        setUsers(response || []);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "An error occurred while loading users."
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchEmail.toLowerCase())
    );

    if (filterRole === "Admin") {
      filtered = filtered.filter((user) => user.roles.includes("Admin"));
    } else if (filterRole === "Donor") {
      filtered = filtered.filter((user) => user.roles.includes("Donor"));
    }

    setFilteredUsers(filtered);
  }, [searchEmail, filterRole, users]);

  const handleToggleRole = async (userId: string, role: "Admin" | "Donor") => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newRoles = user.roles.includes(role)
      ? user.roles.filter((r) => r !== role)
      : [...user.roles, role];

    setUpdatingUserId(userId);

    try {
      const response = await apiFetchJson<UpdateRolesResponse>(
        `${API_PREFIX}/auth/admin/update-user-roles`,
        {
          method: "POST",
          body: JSON.stringify({ userId, roles: newRoles }),
        }
      );

      // Update local state after successful API call.
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, roles: newRoles.sort() } : u
        )
      );
      setStatus("success");
      setMessage(response.message || `Roles updated for ${user.email}.`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "An error occurred while updating roles."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      setStatus("error");
      setMessage("You cannot delete your own account.");
      return;
    }

    setDeletingUserId(targetUser.id);

    try {
      const response = await apiFetchJson<DeleteUserResponse>(
        `${API_PREFIX}/auth/admin/delete-user`,
        {
          method: "POST",
          body: JSON.stringify({ userId: targetUser.id }),
        }
      );

      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== targetUser.id));
      setStatus("success");
      setMessage(response.message || `Deleted user ${targetUser.email}.`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "An error occurred while deleting user."
      );
    } finally {
      setDeletingUserId(null);
      setPendingDeleteUser(null);
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("Admin")).length,
    donors: users.filter((u) => u.roles.includes("Donor")).length,
  };

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        tone="quiet"
        eyebrow="Settings & administration"
        eyebrowIcon={<UserCog className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Staff & Users"
        description="Manage roles, access, and two-factor status for organization accounts."
      >
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:mb-16">
          <CaseloadMetricCard label="Total users" value={stats.total} icon={Users} motionDelay={0} />
          <CaseloadMetricCard label="Admins" value={stats.admins} icon={Shield} motionDelay={0.05} />
          <CaseloadMetricCard label="Donors" value={stats.donors} icon={Heart} motionDelay={0.1} />
        </section>

        {message ? (
          <div
            className={`mb-8 flex items-center gap-3 rounded-lg border px-4 py-3 font-body text-sm ${
              status === "success"
                ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {status === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            )}
            <p>{message}</p>
          </div>
        ) : null}

        <div className={`mb-10 ${dashboardFilterBarClass}`}>
          <div className="space-y-5">
            <div>
              <label htmlFor="search" className="mb-2 block font-body text-xs font-medium text-muted-foreground">
                Search users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" strokeWidth={1.5} />
                <input
                  id="search"
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full rounded-xl border border-white/60 bg-white/70 py-2.5 pl-10 pr-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[hsl(340_40%_60%)]/25 dark:border-white/10 dark:bg-white/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-body text-xs font-medium text-muted-foreground">Filter by role</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => setFilterRole("All")}
                  variant={filterRole === "All" ? "default" : "outline"}
                  size="sm"
                  className="h-10 rounded-xl px-4 font-body font-medium"
                >
                  All users ({stats.total})
                </Button>
                <Button
                  type="button"
                  onClick={() => setFilterRole("Admin")}
                  variant={filterRole === "Admin" ? "default" : "outline"}
                  size="sm"
                  className={`h-10 rounded-xl px-4 font-body font-medium ${filterRole === "Admin" ? "bg-terracotta hover:bg-terracotta/90" : ""}`}
                >
                  <Shield className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Admins ({stats.admins})
                </Button>
                <Button
                  type="button"
                  onClick={() => setFilterRole("Donor")}
                  variant={filterRole === "Donor" ? "default" : "outline"}
                  size="sm"
                  className={`h-10 rounded-xl px-4 font-body font-medium ${filterRole === "Donor" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                >
                  <Users className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Donors ({stats.donors})
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className={dashboardTableShellClass}>
          {loadingUsers ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="font-body text-sm text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className={dashboardTableHeadRowClass}>
                  <tr>
                    {["Email", "Name", "Roles", "2FA", "Actions"].map((h) => (
                      <th key={h} className={dashboardTableHeadCellClass}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={dashboardTableBodyClass}>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={dashboardTableRowClass}>
                      <td className={dashboardTableCellClass}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={1.5} />
                          <span className="text-foreground/95">{user.email}</span>
                        </div>
                      </td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>{user.displayName}</td>
                      <td className={dashboardTableCellClass}>
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex rounded-full px-2 py-0.5 font-body text-xs font-semibold ${
                                role === "Admin"
                                  ? "bg-terracotta/10 text-terracotta"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                          {user.roles.length === 0 ? (
                            <span className="font-body text-xs text-muted-foreground">No roles</span>
                          ) : null}
                        </div>
                      </td>
                      <td className={dashboardTableCellClass}>
                        {user.mfaEnabled ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-body text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Enabled
                          </span>
                        ) : (
                          <span className="font-body text-xs text-muted-foreground">Disabled</span>
                        )}
                      </td>
                      <td className={dashboardTableCellClass}>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => handleToggleRole(user.id, "Admin")}
                            disabled={updatingUserId === user.id || deletingUserId === user.id}
                            variant={user.roles.includes("Admin") ? "default" : "outline"}
                            size="sm"
                            className={`h-9 rounded-xl ${user.roles.includes("Admin") ? "bg-terracotta hover:bg-terracotta/90" : ""}`}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4" strokeWidth={1.5} />
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleToggleRole(user.id, "Donor")}
                            disabled={updatingUserId === user.id || deletingUserId === user.id}
                            variant={user.roles.includes("Donor") ? "default" : "outline"}
                            size="sm"
                            className={`h-9 rounded-xl ${user.roles.includes("Donor") ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Users className="h-4 w-4" strokeWidth={1.5} />
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setPendingDeleteUser(user)}
                            disabled={
                              updatingUserId === user.id || deletingUserId === user.id || user.id === currentUser?.id
                            }
                            variant="destructive"
                            size="sm"
                            className="h-9 rounded-xl"
                            aria-label={`Remove ${user.email}`}
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DashboardGlassPanel padding="sm" className="mt-10">
          <h3 className="font-body text-sm font-semibold text-foreground">How to use</h3>
          <ul className="mt-3 space-y-1.5 font-body text-sm text-muted-foreground">
            <li>Use the search box to find users by email or name.</li>
            <li>Use role chips to filter the directory.</li>
            <li>Shield toggles Admin; people icon toggles Donor.</li>
            <li>Trash removes a profile (not available for your own account).</li>
            <li>Accounts may hold multiple roles at once.</li>
          </ul>
        </DashboardGlassPanel>

        <AlertDialog open={pendingDeleteUser !== null} onOpenChange={(open) => !open && setPendingDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove user profile?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteUser
                  ? `This will permanently delete ${pendingDeleteUser.email}. This action cannot be undone.`
                  : "This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingUserId !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!pendingDeleteUser || deletingUserId !== null}
                onClick={async () => {
                  if (!pendingDeleteUser) return;
                  await handleDeleteUser(pendingDeleteUser);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingUserId !== null ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </StaffPageShell>
    </AdminLayout>
  );
};

export default StaffManagement;

