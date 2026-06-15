import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthShell, Field } from "./auth.index";
import { supabase, signInWithGoogle } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create your vault · Asset Vault" },
      {
        name: "description",
        content: "Create your Asset Vault vault and start protecting your media in seconds.",
      },
    ],
  }),
  component: Register,
});

function Register() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Sign in or use a different email.");
        return;
      }
      setMessage(
        data.session
          ? "Account created successfully."
          : `Registration succeeded for ${email.trim()}. A verification email was requested. Check your inbox and spam folder; the verification link will return you to sign in.`,
      );
    } catch (signUpError) {
      setError(
        errorMessage(signUpError) ||
          "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setIsGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setIsGoogleLoading(false);
      setError(googleError.message);
    }
  }

  return (
    <AuthShell
      title="Create your vault"
      subtitle="Start protecting your media in seconds."
      cta="Create account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
      error={error}
      message={message}
      isSubmitting={isSubmitting}
      isGoogleLoading={isGoogleLoading}
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
    >
      <Field
        icon={ShieldCheck}
        label="Display name"
        type="text"
        placeholder="Souhrid"
        value={displayName}
        onChange={setDisplayName}
        autoComplete="name"
      />
      <Field
        icon={Mail}
        label="Email"
        type="email"
        placeholder="you@studio.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <Field
        icon={Lock}
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
    </AuthShell>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}
