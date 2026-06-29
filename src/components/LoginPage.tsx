import React, { useState } from "react";
import { logInWithGoogle } from "../firebase";
import { ShieldAlert } from "lucide-react";
import { GoogleIcon } from "@/components/google-icon";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await logInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError("Please enter a valid phone number or email.");
      return;
    }
    setError("Passwordless email access is temporarily offline for verification. Please sign in with Google.");
  };

  const handleAppleClick = () => {
    setError("Apple authentication is not configured for this project. Please sign in with Google.");
  };

  return (
    <div className="min-h-screen w-screen bg-white dark:bg-zinc-950 flex flex-col font-sans text-black dark:text-white transition-colors duration-200">
      
      {/* 1. Header Bar */}
      <header className="bg-black text-white py-4 px-6 sm:px-12 flex items-center shrink-0">
        <span className="font-extrabold text-xl tracking-tight select-none">Uber</span>
        <span className="font-light text-zinc-400 text-sm ml-2.5 mt-0.5 border-l border-zinc-700 pl-2.5 select-none">
          Fleet Sync
        </span>
      </header>

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 flex justify-center pt-12 pb-8 sm:pt-20 px-6">
        <div className="w-full max-w-[450px] flex flex-col gap-6">
          
          {/* Header Title */}
          <h2 className="text-3xl font-bold text-black dark:text-white leading-tight tracking-tight">
            What's your phone number or email?
          </h2>

          {/* Error Banner */}
          {error && (
            <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold animate-shake flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter phone number or email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 bg-[#f6f6f6] dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white text-base outline-none transition font-medium"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-sm rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              Continue
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1 select-none">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <span className="relative px-3 bg-white dark:bg-zinc-950 text-sm text-zinc-500 font-medium">or</span>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-black dark:text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <GoogleIcon className="size-4" />
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleAppleClick}
              className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-black dark:text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-3 cursor-pointer shadow-sm"
            >
              <svg viewBox="0 0 170 170" className="size-4 fill-current">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.37-6.15-2.85-2.3-6.66-6.8-11.41-13.5-5.63-7.85-10.09-16.14-13.38-24.89-3.29-8.75-4.94-17.26-4.94-25.53 0-13.19 3.34-24.2 10.02-33 6.68-8.81 15.07-13.21 25.17-13.21 4.58 0 9.77 1.25 15.58 3.75 5.81 2.5 9.7 3.75 11.66 3.75 1.76 0 5.69-1.25 11.8-3.75 6.11-2.5 10.97-3.69 14.59-3.56 10.74.5 19.14 4.53 25.18 12.09-8.82 5.38-13.14 12.72-12.98 22.02.17 7.9 3.01 14.42 8.53 19.56 5.52 5.14 12.18 7.82 19.98 8.04 1.34 3.71 2.62 7.37 3.82 10.97zM119.22 30.5c0-6.68 2.4-12.76 7.21-18.23 4.81-5.46 10.78-8.8 17.91-10.02.17 6.42-2.18 12.44-7.05 18.06-4.87 5.63-10.95 9.07-18.24 10.33-.29-2-.29-4.87-2.29-10.14z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Consent / Policy Footer */}
          <p className="text-center sm:text-left text-zinc-500 dark:text-zinc-400 text-[12px] leading-relaxed select-none">
            You consent to receive a verification code by text or WhatsApp. Message and data rates may apply.
          </p>

        </div>
      </main>

    </div>
  );
}
