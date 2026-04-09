import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
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
import { AlertCircle, CheckCircle, Mail, Search, Shield, Users, Loader2, Trash2 } from "lucide-react";

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
    <AdminLayout contentClassName="max-w-6xl">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Admins</p>
            <p className="mt-1 text-2xl font-bold text-terracotta">{stats.admins}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Donors</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.donors}</p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`flex items-center gap-3 rounded-md p-3 ${
              status === "success"
                ? "border border-green-200 bg-green-50"
                : "border border-red-200 bg-red-50"
            }`}
          >
            {status === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={status === "success" ? "text-green-800" : "text-red-800"}>
              {message}
            </p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-10 text-sm placeholder-gray-500 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>
            </div>

            {/* Role Filter Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterRole("All")}
                  variant={filterRole === "All" ? "default" : "outline"}
                  size="sm"
                >
                  All Users ({stats.total})
                </Button>
                <Button
                  onClick={() => setFilterRole("Admin")}
                  variant={filterRole === "Admin" ? "default" : "outline"}
                  size="sm"
                  className={filterRole === "Admin" ? "bg-terracotta hover:bg-terracotta/90" : ""}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admins ({stats.admins})
                </Button>
                <Button
                  onClick={() => setFilterRole("Donor")}
                  variant={filterRole === "Donor" ? "default" : "outline"}
                  size="sm"
                  className={filterRole === "Donor" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Donors ({stats.donors})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {loadingUsers ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8">
              <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-gray-600">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      2FA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.displayName}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                role === "Admin"
                                  ? "bg-terracotta/10 text-terracotta"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                          {user.roles.length === 0 && (
                            <span className="text-xs text-gray-500">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.mfaEnabled ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
                            Enabled
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Disabled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleToggleRole(user.id, "Admin")}
                            disabled={updatingUserId === user.id || deletingUserId === user.id}
                            variant={user.roles.includes("Admin") ? "default" : "outline"}
                            size="sm"
                            className={
                              user.roles.includes("Admin")
                                ? "bg-terracotta hover:bg-terracotta/90"
                                : ""
                            }
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleToggleRole(user.id, "Donor")}
                            disabled={updatingUserId === user.id || deletingUserId === user.id}
                            variant={user.roles.includes("Donor") ? "default" : "outline"}
                            size="sm"
                            className={
                              user.roles.includes("Donor")
                                ? "bg-blue-600 hover:bg-blue-700"
                                : ""
                            }
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => setPendingDeleteUser(user)}
                            disabled={updatingUserId === user.id || deletingUserId === user.id || user.id === currentUser?.id}
                            variant="destructive"
                            size="sm"
                            aria-label={`Remove ${user.email}`}
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
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

        {/* Info Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900">How to use:</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>• Use the search box to find users by email or name</li>
            <li>• Click on "Admins" or "Donors" tabs to filter by role</li>
            <li>• Click the shield icon to toggle Admin role on/off</li>
            <li>• Click the users icon to toggle Donor role on/off</li>
            <li>• Click the trash icon to remove a user profile</li>
            <li>• Users can have multiple roles simultaneously</li>
          </ul>
        </div>

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
                onClick={(e) => {
                  e.preventDefault();
                  if (!pendingDeleteUser) return;
                  void handleDeleteUser(pendingDeleteUser);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingUserId !== null ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default StaffManagement;

