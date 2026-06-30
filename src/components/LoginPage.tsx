import React, { useState } from "react";
import { logInWithGoogle, loginWithEmailPassword } from "../firebase";
import { ShieldAlert, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { GoogleIcon } from "@/components/google-icon";

type Step = "email" | "password";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("email");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await logInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailStep = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) {
      setError("Please enter a valid email address.");
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address (e.g. you@example.com).");
      return;
    }
    setError(null);
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setError("Please enter a password.");
      return;
    }
    if (passwordInput.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginWithEmailPassword(emailInput.trim(), passwordInput);
      if (result.isNewUser) {
        setSuccess("New account created! Welcome aboard 🎉");
      }
      // Auth state listener in App.tsx will handle the redirect
    } catch (err: any) {
      setLoading(false);
      // Friendly error messages
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Try a different password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password too weak. Use at least 6 characters.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Check your internet connection.");
      } else {
        setError(err.message || "Sign-in failed. Please try again.");
      }
    }
  };

  const handleAppleClick = () => {
    setError("Apple authentication is not configured. Please sign in with Google or Email.");
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

          {/* Back button for password step */}
          {step === "password" && (
            <button
              onClick={() => {
                setStep("email");
                setPasswordInput("");
                setError(null);
                setSuccess(null);
              }}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black dark:hover:text-white transition -mb-2 self-start"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          )}

          {/* Header Title */}
          <h2 className="text-3xl font-bold text-black dark:text-white leading-tight tracking-tight">
            {step === "email"
              ? "What's your email?"
              : "Enter your password"}
          </h2>

          {step === "password" && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-4">
              Signing in as <span className="font-semibold text-black dark:text-white">{emailInput}</span>
            </p>
          )}

          {/* Success Banner */}
          {success && (
            <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === "email" && (
            <form onSubmit={handleEmailStep} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setError(null); }}
                autoFocus
                autoComplete="email"
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
          )}

          {/* Step 2: Password Form */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (min. 6 characters)"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setError(null); }}
                  autoFocus
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 bg-[#f6f6f6] dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white text-base outline-none transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1">
                If this email has no account, a new one will be created automatically.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-sm rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 dark:border-black/40 border-t-white dark:border-t-black rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In / Create Account"
                )}
              </button>
            </form>
          )}

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
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>

        </div>
      </main>

    </div>
  );
}
