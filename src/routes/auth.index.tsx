import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shield, Mail, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { supabase, signInWithGoogle } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Sign in · Asset Vault" },
      { name: "description", content: "Sign in to access your protected Asset Vault library." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    await navigate({ to: "/app", replace: true });
  }

  async function handleGoogle() {
    setError("");
    setIsGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setIsGoogleLoading(false);
      setError(googleError.message);
    }
    // On success the browser is redirected to Google — no further state to set.
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your protected library."
      footer={<>New to Asset Vault? <Link to="/auth/register" className="font-semibold text-primary hover:underline">Create an account</Link></>}
      cta="Sign in"
      error={error}
      isSubmitting={isSubmitting}
      isGoogleLoading={isGoogleLoading}
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
    >
      <Field icon={Mail} label="Email" type="email" placeholder="you@studio.com" value={email} onChange={setEmail} autoComplete="email" />
      <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} autoComplete="current-password" />
    </AuthShell>
  );
}

export function AuthShell({
  title, subtitle, children, cta, footer, extra, error, message, isSubmitting = false, isGoogleLoading = false, onSubmit, onGoogle,
}: { title: string; subtitle: string; children: React.ReactNode; cta: string; footer: React.ReactNode; extra?: React.ReactNode; error?: string; message?: string; isSubmitting?: boolean; isGoogleLoading?: boolean; onSubmit?: (event: FormEvent<HTMLFormElement>) => void; onGoogle?: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 gradient-hero" />
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.55)]">
            <Shield className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Asset Vault</span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-elevated">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <Button
            type="button"
            variant="outline"
            onClick={onGoogle}
            disabled={isGoogleLoading}
            className="mt-6 h-11 w-full justify-center gap-2 text-sm"
          >
            <GoogleIcon /> {isGoogleLoading ? "Redirecting…" : "Continue with Google"}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit}>
            {extra}
            <div className="space-y-4">{children}</div>
            {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
            {message ? <p role="status" className="mt-4 text-sm text-success">{message}</p> : null}
            <Button type="submit" variant="hero" disabled={isSubmitting} className="mt-6 h-11 w-full text-sm">
              {isSubmitting ? "Please wait…" : cta}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function Field({ icon: Icon, label, type, placeholder, value, onChange, autoComplete }: { icon: React.ElementType; label: string; type: string; placeholder: string; value?: string; onChange?: (value: string) => void; autoComplete?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          autoComplete={autoComplete}
          required
          className="h-11 w-full rounded-xl border border-input bg-white pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z" />
    </svg>
  );
}
