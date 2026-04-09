import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { AlertCircle, CheckCircle, Mail, Users } from "lucide-react";

type AssignmentStatus = "idle" | "loading" | "success" | "error";

export const StaffManagement = () => {
  usePageHeader("Staff & Users", "Manage user roles and permissions");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AssignmentStatus>("idle");
  const [message, setMessage] = useState("");

  const handleAssignDonorRole = async () => {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter an email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await apiFetchJson(
        `${API_PREFIX}/api/auth/admin/assign-donor-role`,
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      if (response.ok) {
        setStatus("success");
        setMessage(response.data?.message || "Donor role assigned successfully!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(response.data?.message || "Failed to assign donor role.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "An error occurred while assigning the role."
      );
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setMessage("");
  };

  return (
    <AdminLayout contentClassName="max-w-2xl">
      <div className="space-y-6">
        {/* Assign Donor Role Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-terracotta" />
            <h2 className="text-lg font-semibold text-gray-900">Assign Donor Role</h2>
          </div>

          <p className="mb-6 text-sm text-gray-600">
            Add the donor role to existing users so they can access the donor portal and donation
            tracking features. Enter their email address to grant access.
          </p>

          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") handleReset();
                    }}
                    placeholder="user@example.com"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-10 text-sm placeholder-gray-500 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                    disabled={status === "loading"}
                  />
                </div>
                <Button
                  onClick={handleAssignDonorRole}
                  disabled={status === "loading" || !email.trim()}
                  className="bg-terracotta hover:bg-terracotta/90"
                >
                  {status === "loading" ? "Assigning..." : "Assign Role"}
                </Button>
              </div>
            </div>

            {/* Status Messages */}
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

            {/* Help Text */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900">When to use this:</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li>• Users who signed up via Google OAuth before the role assignment was added</li>
                <li>• Users who should have donor access but don't have it yet</li>
                <li>• Email address must match the user's registered email exactly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StaffManagement;
