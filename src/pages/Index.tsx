import { Navigate, Link } from "react-router-dom";
import { Shield, Lock, Database, Workflow, Activity, AlertTriangle, Eye, Zap } from "lucide-react";
import InfoCard from "@/components/InfoCard";
import ParticleField from "@/components/ParticleField";
import TypingText from "@/components/TypingText";
import AnimatedStat from "@/components/AnimatedStat";
import ScrollReveal from "@/components/ScrollReveal";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const { isAuthenticated, isHydrated } = usePhase3Auth();

  // Once the session is restored, redirect logged-in users straight to the workspace
  if (isHydrated && isAuthenticated) {
    return <Navigate to="/data-management" replace />;
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <ParticleField />

        <div className="relative container py-24 md:py-36 z-10">
          <p className="font-mono text-xs text-primary mb-4 tracking-widest uppercase">
            <TypingText text="// Initializing CyberGuard System..." speed={40} />
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold text-foreground mb-4 cyber-text-glow leading-tight animate-fade-in"
            style={{ animationDelay: "1.5s", opacity: 0 }}
          >
            Cybersecurity
            <br />
            <span className="text-primary">Monitoring</span> &amp;{" "}
            <span className="text-primary">Threat Detection</span>
          </h1>
          <p
            className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-8 animate-fade-in"
            style={{ animationDelay: "2s", opacity: 0 }}
          >
            CyberGuard is a full-stack cybersecurity platform. Log in to manage real incidents,
            track threat intelligence, run background jobs, and explore role-based access control
            — all powered by a live Phase III backend.
          </p>

          {/* Primary CTA */}
          <div
            className="flex gap-3 flex-wrap animate-fade-in"
            style={{ animationDelay: "2.5s", opacity: 0 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-7 py-3 rounded hover:cyber-glow-strong transition-shadow hover-scale"
            >
              <Lock className="h-4 w-4" /> Login to Get Started
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-3 rounded hover:border-primary hover:text-primary transition-colors hover-scale"
            >
              <Activity className="h-4 w-4" /> View Demo Dashboard
            </Link>
            <Link
              to="/integration"
              className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-3 rounded hover:border-primary hover:text-primary transition-colors hover-scale"
            >
              <Workflow className="h-4 w-4" /> Phase II Integration
            </Link>
          </div>
        </div>

        <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-beam pointer-events-none" />
      </section>

      {/* ── How it works (3 steps) ── */}
      <section className="container py-16">
        <h2 className="font-mono text-xl text-primary mb-8">{`> How to use this App`}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <ScrollReveal>
            <InfoCard
              icon={Lock}
              title="1. Login"
              description="Go to the Login page and pick a role — admin, analyst, or viewer. Each has different permissions inside the workspace."
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <InfoCard
              icon={Database}
              title="2. Use the Workspace"
              description="Create incidents, add threat intelligence, trigger async background jobs, test caching, and transform data formats."
            />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <InfoCard
              icon={Shield}
              title="3. Explore the Docs"
              description='Use the "Docs" dropdown in the nav to browse informational pages about cybersecurity concepts and system architecture.'
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="container pb-16">
        <h2 className="font-mono text-xl text-primary mb-8">{`Platform Capabilities`}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Eye,
              title: "Real-Time Monitoring",
              description:
                "Continuous surveillance of network traffic, system logs, and user behavior to identify anomalies instantly.",
              delay: 0,
            },
            {
              icon: AlertTriangle,
              title: "Threat Detection",
              description:
                "Advanced analysis to detect malware, intrusions, phishing attempts, and suspicious indicators of compromise.",
              delay: 100,
            },
            {
              icon: Zap,
              title: "Incident Response",
              description:
                "Operational workflows to create, triage, update status, and close security incidents from inside the workspace.",
              delay: 200,
            },
            {
              icon: Lock,
              title: "Data Protection",
              description:
                "JWT-based access control, input validation, rate limiting, and secure handling of all sensitive operations.",
              delay: 300,
            },
            {
              icon: Activity,
              title: "Async Processing",
              description:
                "Producer/consumer job queue for background threat analysis, report generation, and data cleanup tasks.",
              delay: 400,
            },
            {
              icon: Shield,
              title: "Role-Based Access",
              description:
                "Admin, Analyst, and Viewer roles with different UI capabilities — log in as each to see the difference.",
              delay: 500,
            },
          ].map((item) => (
            <ScrollReveal key={item.title} delay={item.delay}>
              <InfoCard icon={item.icon} title={item.title} description={item.description} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border py-16 bg-card">
        <div className="container grid md:grid-cols-4 gap-8">
          <AnimatedStat value={99} suffix="%" label="Uptime" />
          <AnimatedStat value={1} prefix="<" suffix="s" label="Detection Time" delay={200} />
          <AnimatedStat value={10000000} label="Threats Blocked" delay={400} />
          <AnimatedStat value={24} suffix="/7" label="Monitoring" delay={600} />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="container py-16 text-center">
        <h2 className="font-mono text-2xl font-bold text-foreground mb-3">
          Ready to explore?
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
          Log in with one of the three demo accounts to start using the real workspace.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-8 py-3 rounded hover:bg-primary/90 transition-colors"
        >
          <Lock className="h-4 w-4" /> Go to Login
        </Link>
      </section>
    </div>
  );
};

export default Index;
