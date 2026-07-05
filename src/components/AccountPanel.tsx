import React, { useState } from "react";
import { User, Mail, Shield, LogOut, Key, CheckCircle } from "lucide-react";
import { logOutUser, changeUserPassword } from "../firebase";

interface AccountPanelProps {
  user: any;
}

export default function AccountPanel({ user }: AccountPanelProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isSaved, setIsSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate/save profile update locally
    localStorage.setItem(`displayName_${user?.uid || "default"}`, displayName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    window.dispatchEvent(new Event("user_profile_updated"));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      await changeUserPassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    }
  };

  const handleLogOut = async () => {
    if (confirm("Are you sure you want to sign out of the portal?")) {
      await logOutUser();
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-enter text-[var(--text-strong)] max-w-xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="w-16 h-16 rounded-full bg-[#06C167] text-white flex items-center justify-center font-black text-2xl shadow-sm uppercase shrink-0">
            {displayName ? displayName.charAt(0) : user?.email?.charAt(0) || "M"}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-[19px] text-black dark:text-white leading-tight uppercase truncate">
              {displayName || user?.email?.split("@")[0] || "Fleet Manager"}
            </h3>
            <span className="text-xs text-[#06C167] font-black uppercase tracking-wider block mt-0.5">
              Portal Manager
            </span>
          </div>
        </div>

        {/* Profile details list */}
        <div className="space-y-4 text-xs font-bold text-zinc-650 dark:text-zinc-300">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2.5">
            <span className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-550">
              <Mail size={14} />
              <span>Email Address</span>
            </span>
            <span className="font-mono text-black dark:text-white">{user?.email || "—"}</span>
          </div>

          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2.5">
            <span className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-550">
              <Shield size={14} />
              <span>Permission Level</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">Administrator</span>
          </div>

          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2.5">
            <span className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-550">
              <Key size={14} />
              <span>User ID (UID)</span>
            </span>
            <span className="font-mono text-[10px] text-zinc-450 dark:text-zinc-500 truncate max-w-[180px]">
              {user?.uid || "—"}
            </span>
          </div>
        </div>

        {/* Update Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              Change Manager Name:
            </label>
            <input
              type="text"
              required
              placeholder="Enter name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none text-black dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-85 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              Save Profile Changes
            </button>
            <button
              type="button"
              onClick={handleLogOut}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-955/20 dark:hover:bg-red-955/40 dark:text-red-300 rounded-xl transition flex items-center gap-1.5 font-extrabold border border-red-200/50 dark:border-transparent cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>

          {isSaved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] justify-center mt-2 animate-pulse">
              <CheckCircle size={12} />
              <span>Profile updated successfully!</span>
            </div>
          )}
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              New Password:
            </label>
            <input
              type="password"
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none text-black dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              Confirm New Password:
            </label>
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none text-black dark:text-white"
            />
          </div>

          {passwordError && (
            <div className="text-red-500 text-xs font-semibold">{passwordError}</div>
          )}

          {passwordSuccess && (
            <div className="text-emerald-600 text-xs flex items-center gap-1.5">
              <CheckCircle size={12} />
              <span>Password updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-black dark:text-white hover:opacity-85 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border border-zinc-200/50 dark:border-transparent"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
