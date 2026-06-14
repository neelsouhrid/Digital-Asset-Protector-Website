import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  Shield, ShieldCheck, Lock, Activity, Globe2, ArrowRight, Check,
  Upload, Fingerprint, Search, Eye, Layers, Bell, KeyRound, FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asset Vault — Protect every digital asset you own" },
      { name: "description", content: "Asset Vault combines blockchain-powered ownership verification, intelligent monitoring, and digital fingerprinting to keep every asset you create provably yours." },
      { property: "og:title", content: "Asset Vault — Blockchain-powered digital ownership" },
      { property: "og:description", content: "Fingerprint your media, anchor it on-chain, and monitor the open web in real time." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="landing-premium min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <Trust />
      <FeatureGrid />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------------- Nav ---------------- */
function Nav() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 18;
    setIsScrolled((current) => (current === next ? current : next));
  });

  return (
    <header data-scrolled={isScrolled} className="landing-nav sticky top-0 z-40 border-b border-[color-mix(in_oklab,var(--color-primary)_10%,var(--color-border))] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#7C3AED] text-white shadow-[0_8px_20px_-8px_rgba(109,40,217,0.6)]">
            <Shield className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Asset Vault</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {["Features", "How it works", "Security", "Pricing"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-block">
            Sign in
          </Link>
          <Link to="/auth/register">
            <Button variant="default" size="sm" className="h-9 rounded-lg px-4">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 38]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 18]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0.92]);
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const previewScale = useTransform(scrollYProgress, [0, 1], [1, 0.988]);

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      {/* soft gradient backdrop + animated glow + floating shapes */}
      <motion.div style={{ y: glowY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-glow absolute -top-40 left-1/2 h-[560px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.28),transparent_70%)]" />
        <div className="hero-float-a absolute left-[8%] top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent_70%)] blur-2xl" />
        <div className="hero-float-b absolute right-[6%] top-40 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(109,40,217,0.16),transparent_70%)] blur-2xl" />
        <div className="hero-float-a absolute bottom-10 left-[20%] h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.14),transparent_70%)] blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
        <motion.div style={{ y: copyY, opacity: copyOpacity }} className="mx-auto max-w-3xl text-center">
          <div className="hero-fade-1 mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-primary shadow-[0_4px_18px_-8px_rgba(109,40,217,0.35)] backdrop-blur">
            <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-primary" />
            Blockchain-verified digital ownership
          </div>

          <h1 className="hero-fade-2 font-display text-4xl font-extrabold leading-[1.04] tracking-[-0.025em] sm:text-5xl lg:text-[4rem]">
            Protect every digital asset
            <br />
            <span className="gradient-text-rich">you'll ever create.</span>
          </h1>

          <p className="hero-fade-3 mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Asset Vault fingerprints your media, anchors proof of ownership on-chain, and monitors the open web in real time — so the original always wins.
          </p>

          <div className="hero-fade-4 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth/register">
              <Button variant="hero" size="lg" className="hero-cta-primary h-12 rounded-xl px-6 text-base">
                Start protecting free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="hero-cta-outline h-12 rounded-xl px-6 text-base">
                See how it works
              </Button>
            </a>
          </div>

          <p className="hero-fade-4 mt-5 text-xs text-muted-foreground">No credit card · Cancel anytime · End-to-end encrypted</p>
        </motion.div>

        {/* Product preview card */}
        <motion.div style={{ y: previewY, scale: previewScale }} className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-6 -top-6 -bottom-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-secondary/15 to-transparent blur-2xl" />
          <div className="hero-glass overflow-hidden rounded-2xl shadow-[0_40px_100px_-30px_rgba(109,40,217,0.4)]">
            <div className="flex items-center gap-1.5 border-b border-border/60 bg-[#FAFAFF]/70 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-xs text-muted-foreground">app.assetvault.io / overview</span>
            </div>
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const stats = [
    { label: "Protected assets", value: "1,284", delta: "+12.4%" },
    { label: "On-chain signatures", value: "1,284", delta: "100%" },
    { label: "Threats blocked", value: "37", delta: "-8.1%" },
    { label: "Monitored sources", value: "92", delta: "+3" },
  ];
  return (
    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-success">{s.delta}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Protection activity</h4>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <svg viewBox="0 0 600 160" className="h-32 w-full">
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,120 C60,90 120,110 180,80 C240,50 300,70 360,55 C420,40 480,70 540,40 L600,30 L600,160 L0,160 Z" fill="url(#g1)" />
            <path d="M0,120 C60,90 120,110 180,80 C240,50 300,70 360,55 C420,40 480,70 540,40 L600,30" fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <h4 className="text-sm font-semibold">Recent signatures</h4>
          <ul className="mt-3 space-y-3">
            {[
              { name: "campaign-hero.png", hash: "0x9af…2c1" },
              { name: "launch-trailer.mp4", hash: "0x4ec…8b3" },
              { name: "brand-pack.zip", hash: "0x71d…f02" },
            ].map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#F5F1FE] text-primary">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{f.hash}</p>
                </div>
                <Check className="h-4 w-4 text-success" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Logo strip ---------------- */
function LogoStrip() {
  return (
    <section className="border-y border-border bg-[#FAFAFF] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by creators, studios, and security-first teams
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-3 md:grid-cols-6">
          {["NORTHWIND", "ACME", "STELLAR", "LUMEN", "FORGE", "ATLAS"].map((n) => (
            <div key={n} className="text-center font-display text-sm font-bold tracking-[0.2em] text-muted-foreground">{n}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */
function Features() {
  const items = [
    { icon: Fingerprint, title: "Digital fingerprinting", text: "Perceptual hashes generate a unique signature for every file you protect." },
    { icon: Shield, title: "Blockchain ownership", text: "Anchor proof of authorship on-chain — immutable, timestamped, and verifiable." },
    { icon: Activity, title: "Real-time monitoring", text: "Continuously scan the open web for unauthorized copies of your work." },
    { icon: Bell, title: "Instant alerts", text: "Get notified the moment a match appears, with full source context." },
    { icon: Lock, title: "Private by design", text: "Files are encrypted client-side. Only signatures live on the network." },
    { icon: Globe2, title: "Global coverage", text: "Sources span social platforms, marketplaces, and image repositories." },
  ];
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Features"
          title="Everything you need to prove what's yours"
          subtitle="A complete toolkit for digital ownership — built for creators who ship faster than the internet can copy."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="group rounded-2xl border border-border bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F5F1FE] text-primary transition group-hover:bg-primary group-hover:text-white">
                <it.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  const steps = [
    { icon: Upload, title: "Upload your asset", text: "Drop in images, videos, audio, or documents. Files never leave your device unencrypted." },
    { icon: Fingerprint, title: "Generate a signature", text: "A perceptual hash creates a unique digital fingerprint — even crops and edits stay matchable." },
    { icon: Layers, title: "Anchor on-chain", text: "The signature is sealed on the blockchain with a verifiable timestamp of ownership." },
    { icon: Search, title: "Monitor continuously", text: "Asset Vault scans the open web around the clock and surfaces any match instantly." },
  ];
  return (
    <section id="how-it-works" className="bg-[#FAFAFF] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="From upload to verified ownership in seconds"
          subtitle="A straightforward, four-step workflow powered by cryptography and blockchain."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#7C3AED] text-white shadow-[0_8px_20px_-8px_rgba(109,40,217,0.5)]">
                  <s.icon className="h-5 w-5" strokeWidth={2.3} />
                </div>
                <span className="font-display text-3xl font-extrabold text-[#EDE9FE]">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust ---------------- */
function Trust() {
  const items = [
    { icon: ShieldCheck, title: "Blockchain security", text: "Tamper-evident records anchored on a public ledger." },
    { icon: KeyRound, title: "Ownership verification", text: "Cryptographic proofs you can share with anyone." },
    { icon: Eye, title: "Continuous monitoring", text: "Scans across social, marketplaces, and the open web." },
    { icon: Shield, title: "Asset protection", text: "Take action the moment unauthorized use appears." },
    { icon: Lock, title: "Privacy first", text: "Client-side encryption. Your files stay yours." },
  ];
  return (
    <section id="security" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Trust"
          title="Security and privacy at every layer"
          subtitle="We built Asset Vault for teams that can't afford to compromise on either."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-white p-6 shadow-soft transition hover:border-primary/30 hover:shadow-elevated">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5F1FE] text-primary">
                <it.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 font-display text-base font-bold">{it.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Feature grid (bento-ish, simple) ---------------- */
function FeatureGrid() {
  return (
    <section className="bg-[#FAFAFF] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Built for the modern web"
          title="Powerful enough for studios. Simple enough for solo creators."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-soft lg:col-span-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F5F1FE] text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold">A live view of your protection</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Track every signature, every scan, and every alert in one clean dashboard built for clarity at a glance.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-[#FAFAFF] p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: "1.2k", l: "Assets" },
                  { v: "37", l: "Alerts" },
                  { v: "100%", l: "Anchored" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-2xl font-bold text-primary">{s.v}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-soft">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F5F1FE] text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold">Zero-knowledge by default</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Files are hashed and encrypted on your device. Asset Vault never sees the original — only the signature.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {["End-to-end encryption", "Client-side hashing", "On-chain proofs only"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-foreground">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#6D28D9] to-[#7C3AED] px-8 py-16 text-center text-white shadow-[0_30px_80px_-30px_rgba(109,40,217,0.6)] sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Stop chasing copies.<br />Start proving you made it.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-base text-white/85">
          Join thousands of creators protecting their work with Asset Vault.
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/auth/register">
            <Button size="lg" className="h-12 rounded-xl bg-white px-6 text-base text-primary shadow hover:bg-white/90">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-white/30 bg-transparent px-6 text-base text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#6D28D9] to-[#7C3AED] text-white">
              <Shield className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-base font-bold tracking-tight">Asset Vault</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Asset Vault. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Shared ---------------- */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
