import PageHeader from "@/components/PageHeader";
import { Shield, Target, Users } from "lucide-react";
import InfoCard from "@/components/InfoCard";

const About = () => (
  <div>
    <PageHeader
      title="About CyberGuard"
      subtitle="Understanding our mission to protect digital assets and infrastructure from cyber threats."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          CyberGuard is a comprehensive cybersecurity monitoring and threat detection platform
          designed to protect organizations from the ever-evolving landscape of cyber threats.
          Our system integrates multiple security technologies into a unified dashboard.
        </p>
        <p>
          Founded on the principle that every organization deserves enterprise-grade security,
          CyberGuard combines artificial intelligence, machine learning, and behavioral analytics
          to provide real-time threat detection and automated incident response.
        </p>
        <p>
          Our platform monitors network traffic, analyzes system logs, and correlates events
          across your entire infrastructure to detect sophisticated attacks that traditional
          security tools miss.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard
          icon={Shield}
          title="Our Mission"
          description="To make advanced cybersecurity accessible to organizations of all sizes, protecting critical infrastructure and sensitive data from cyber threats."
        />
        <InfoCard
          icon={Target}
          title="Our Approach"
          description="We combine proactive threat hunting with reactive incident response, using AI to stay ahead of attackers and minimize response times."
        />
        <InfoCard
          icon={Users}
          title="Our Team"
          description="A team of certified security professionals, ethical hackers, and data scientists dedicated to building the next generation of cyber defense."
        />
      </div>

      <section>
        <h2 className="font-mono text-lg text-primary mb-4">{`Timeline`}</h2>
        <div className="space-y-4 border-l-2 border-border pl-6">
          {[
            { year: "2020", event: "CyberGuard founded with a focus on SMB security" },
            { year: "2021", event: "Launched AI-powered threat detection engine" },
            { year: "2022", event: "Expanded to cloud security monitoring" },
            { year: "2023", event: "Integrated SIEM and SOAR capabilities" },
            { year: "2024", event: "Achieved ISO 27001 certification" },
            { year: "2025", event: "Protecting 10,000+ organizations globally" },
          ].map((item) => (
            <div key={item.year} className="relative">
              <div className="absolute -left-8 w-3 h-3 rounded-full bg-primary" />
              <span className="font-mono text-xs text-primary">{item.year}</span>
              <p className="text-sm text-muted-foreground">{item.event}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default About;
