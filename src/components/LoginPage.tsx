import React, { useState } from "react";
import { logInWithGoogle } from "../firebase";
import { cn } from "@/lib/utils";
import { GithubIcon } from "@/components/github-icon";
import { GoogleIcon } from "@/components/google-icon";
import logoImg from "../assets/logo.png";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { AuthDivider } from "@/components/auth-divider";
import { AtSignIcon, ShieldAlert } from "lucide-react";

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
    setError("Email access is disabled for this tenant. Please use Google Login.");
  };

  const handleGithubClick = () => {
    setError("GitHub authentication is not configured for this team. Please use Google Login.");
  };

  return (
    <div className="relative w-full overflow-hidden md:h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-between p-6 md:p-8">
        
        {/* Logo Section */}
        <div className="flex justify-center pt-4">
          <img 
            src={logoImg} 
            alt="Uber Fleet Sync" 
            className="h-10 w-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm" 
          />
        </div>

        {/* Form Section */}
        <div className="fade-in slide-in-from-bottom-4 w-full animate-in space-y-4 duration-600">
          <div className="flex flex-col space-y-1 text-center sm:text-left">
            <h1 className="font-extrabold text-2xl tracking-tight text-black dark:text-white">
              Uber Fleet Sync
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Access your secure, isolated driver tracking environment.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-semibold animate-shake text-left flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-2">
            <InputGroup>
              <InputGroupInput
                placeholder="your.email@example.com"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon className="size-4 text-zinc-400" />
              </InputGroupAddon>
            </InputGroup>

            <Button className="w-full font-bold" size="sm" type="submit">
              Continue With Email
            </Button>
          </form>

          <AuthDivider>OR CONTINUE WITH</AuthDivider>

          <div className="space-y-2">
            <Button 
              className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer" 
              type="button" 
              variant="outline"
              disabled={loading}
              onClick={handleGoogleLogin}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <GoogleIcon data-icon="inline-start" />
              )}
              <span>{loading ? "Signing in..." : "Google"}</span>
            </Button>
            
            <Button 
              className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer" 
              type="button" 
              variant="outline"
              onClick={handleGithubClick}
            >
              <GithubIcon data-icon="inline-start" />
              <span>GitHub</span>
            </Button>
          </div>
        </div>

        {/* Footer section */}
        <p className="text-center text-zinc-500 dark:text-zinc-400 text-xs mt-6 leading-relaxed">
          This site is protected by reCAPTCHA and the Google{" "}
          <a
            className="underline underline-offset-4 hover:text-primary"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            className="underline underline-offset-4 hover:text-primary"
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </div>
    </div>
  );
}
