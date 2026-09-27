"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Save, KeyRound, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/context";

export function ClientPortalSettingsForm({
  projectId,
  initialEmail,
  token,
}: {
  projectId: string;
  initialEmail: string;
  token: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [pending, startTransition] = useTransition();

  const defaultPasswordName = email.includes("@")
    ? email.split("@")[0].trim()
    : "client";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setMessage({ type: "error", text: t("portal.settings.invalidEmail") });
      return;
    }

    if (password) {
      if (password.length < 3) {
        setMessage({
          type: "error",
          text: t("portal.settings.passwordTooShort"),
        });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({
          type: "error",
          text: t("portal.settings.passwordMismatch"),
        });
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload: {
          projectId: string;
          email: string;
          password?: string;
          token: string;
        } = {
          projectId,
          email: trimmedEmail,
          token,
        };

        if (password) {
          payload.password = password.trim();
        }

        const res = await fetch("/api/portal/settings", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.error || "Failed to update settings",
          });
          return;
        }

        setMessage({
          type: "success",
          text: t("portal.settings.success"),
        });

        setPassword("");
        setConfirmPassword("");

        if (data.magicLink) {
          window.history.replaceState(null, "", data.magicLink);
        }

        router.refresh();
      } catch (err: any) {
        setMessage({
          type: "error",
          text: err?.message || "An unexpected error occurred",
        });
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <KeyRound size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("portal.settings.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("portal.settings.subtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        {/* Email field */}
        <label className="block">
          <span className="text-sm font-medium">
            {t("portal.settings.emailLabel")}
          </span>
          <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-accent">
            <Mail size={14} className="text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
              autoComplete="email"
            />
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">
            {t("portal.settings.emailHelp")}
          </span>
        </label>

        {/* Info callout about default password */}
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info size={15} className="mt-0.5 flex-shrink-0 text-accent" />
            <div>
              <span>
                {t("portal.settings.defaultPasswordNote").replace(
                  "{name}",
                  defaultPasswordName
                )}
              </span>{" "}
              <span>
                You can specify a custom password below or leave it empty to keep your existing password.
              </span>
            </div>
          </div>
        </div>

        {/* Password fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">
              {t("portal.settings.passwordLabel")}
            </span>
            <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-accent">
              <Lock size={14} className="text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("portal.settings.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                autoComplete="new-password"
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

          <label className="block">
            <span className="text-sm font-medium">
              {t("portal.settings.confirmPasswordLabel")}
            </span>
            <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-accent">
              <Lock size={14} className="text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("portal.settings.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-xs ${
              message.type === "success"
                ? "border border-green-500/40 bg-green-500/10 text-green-500"
                : "border border-red-500/40 bg-red-500/10 text-red-500"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {pending ? (
              <>
                <Loader2 size={14} className="animate-spin" />{" "}
                {t("portal.settings.saving")}
              </>
            ) : (
              <>
                <Save size={14} /> {t("portal.settings.save")}
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
