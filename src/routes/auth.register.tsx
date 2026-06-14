import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthShell, Field } from "./auth.index";
import { supabase, signInWithGoogle } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create your vault · Asset Vault" },
      { name: "description", content: "Create your Asset Vault vault and start protecting your media in seconds." },
    ],
  }),
  component: Register,
});

function Register() {
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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setMessage(data.session ? "Account created successfully." : "Check your email to confirm your account.");
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
      footer={<>Already have an account? <Link to="/auth" className="font-semibold text-primary hover:underline">Sign in</Link></>}
      error={error}
      message={message}
      isSubmitting={isSubmitting}
      isGoogleLoading={isGoogleLoading}
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
    >
      <Field icon={ShieldCheck} label="Display name" type="text" placeholder="Souhrid" />
      <Field icon={Mail} label="Email" type="email" placeholder="you@studio.com" value={email} onChange={setEmail} autoComplete="email" />
      <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} autoComplete="new-password" />
    </AuthShell>
  );
}
