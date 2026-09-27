"use client";

import { useState, useTransition } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function LoginForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError(t("login.invalidEmail"));
      return;
    }
    if (!password.trim()) {
      setError(t("login.passwordRequired"));
      return;
    }

    startTransition(async () => {
      console.log("[auth] submitting", email);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        });
        const data = await res.json();
        console.log("[auth] response", res.status, data);
        if (!res.ok) {
          setError(data.error || "Login failed");
          return;
        }
        // Always follow server-provided magic link (token in URL).
        // window.location.href forces a full navigation, so the token
        // is preserved on the URL and the portal page can verify it
        // via JWT.
        if (data.magicLink) {
          window.location.href = data.magicLink;
        } else {
          setError("Server did not return a session link");
        }
      } catch (err: any) {
        console.error("[auth] error", err);
        setError(err?.message || "Network error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-sm font-medium">{t("login.emailLabel")}</span>
        <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-accent">
          <Mail size={14} className="text-muted-foreground" />
          <input
            type="email"
            placeholder={t("login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            autoComplete="email"
          />
        </div>
      </label>

      <label className="block">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("login.passwordLabel")}</span>
          {email.includes("@") && (
            <button
              type="button"
              onClick={() => setPassword(email.split("@")[0].trim())}
              className="text-xs text-muted-foreground hover:text-accent underline"
            >
              Use default ({email.split("@")[0].trim()})
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-accent">
          <Lock size={14} className="text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("login.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </label>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" /> {t("login.signingIn")}
          </>
        ) : (
          <>
            {t("login.signIn")} <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}