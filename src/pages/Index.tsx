import { Shield, Eye, Zap, Lock, AlertTriangle, Activity } from "lucide-react";
import InfoCard from "@/components/InfoCard";
import ParticleField from "@/components/ParticleField";
import TypingText from "@/components/TypingText";
import AnimatedStat from "@/components/AnimatedStat";
import ScrollReveal from "@/components/ScrollReveal";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div>
      {/* Hero */}
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
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 cyber-text-glow leading-tight animate-fade-in" style={{ animationDelay: "1.5s", opacity: 0 }}>
            Cybersecurity<br />
            <span className="text-primary">Monitoring</span> &{" "}
            <span className="text-primary">Threat Detection</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed mb-8 animate-fade-in" style={{ animationDelay: "2s", opacity: 0 }}>
            Real-time threat detection, comprehensive network monitoring, and
            intelligent incident response — protecting your digital infrastructure
            24/7.
          </p>
          <div className="flex gap-3 flex-wrap animate-fade-in" style={{ animationDelay: "2.5s", opacity: 0 }}>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-6 py-3 rounded hover:cyber-glow-strong transition-shadow hover-scale"
            >
              <Activity className="h-4 w-4" /> Live Dashboard
            </a>
            <a
              href="/about"
              className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-3 rounded hover:border-primary hover:text-primary transition-colors hover-scale"
            >
              <Shield className="h-4 w-4" /> Learn More
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-3 rounded hover:border-primary hover:text-primary transition-colors hover-scale"
            >
              Contact Us
            </a>
          </div>
        </div>
        {/* Scan beam effect */}
        <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-beam pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section className="container py-16">
        <h2 className="font-mono text-xl text-primary mb-8">{`> Core_Capabilities`}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Eye, title: "Real-Time Monitoring", description: "Continuous surveillance of network traffic, system logs, and user behavior to identify anomalies instantly.", delay: 0 },
            { icon: AlertTriangle, title: "Threat Detection", description: "Advanced AI-driven analysis to detect malware, intrusions, phishing attempts, and zero-day vulnerabilities.", delay: 100 },
            { icon: Zap, title: "Incident Response", description: "Automated response protocols that contain and neutralize threats before they cause damage.", delay: 200 },
            { icon: Lock, title: "Data Protection", description: "End-to-end encryption, access controls, and data loss prevention to safeguard sensitive information.", delay: 300 },
            { icon: Activity, title: "Network Analytics", description: "Deep packet inspection and behavioral analytics for comprehensive network visibility.", delay: 400 },
            { icon: Shield, title: "Compliance Ready", description: "Meet regulatory requirements including GDPR, HIPAA, SOC2, and ISO 27001 with built-in compliance tools.", delay: 500 },
          ].map((item) => (
            <ScrollReveal key={item.title} delay={item.delay}>
              <InfoCard icon={item.icon} title={item.title} description={item.description} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border py-16 bg-card">
        <div className="container grid md:grid-cols-4 gap-8">
          <AnimatedStat value={99} suffix="%" label="Uptime" />
          <AnimatedStat value={1} prefix="<" suffix="s" label="Detection Time" delay={200} />
          <AnimatedStat value={10000000} label="Threats Blocked" prefix="" delay={400} />
          <AnimatedStat value={24} suffix="/7" label="Monitoring" delay={600} />
        </div>
      </section>
    </div>
  );
};

export default Index;
