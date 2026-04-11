import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Siren, Clock, FileSearch, Workflow, MessageSquare, RotateCcw } from "lucide-react";

const IncidentResponse = () => (
  <div>
    <PageHeader
      title="Incident Response"
      subtitle="Structured incident handling from detection to recovery with automated containment."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          When a threat is detected, speed matters. Our incident response framework provides
          automated containment actions, structured investigation workflows, and detailed
          post-incident reporting. The system can isolate compromised endpoints, block
          malicious IPs, and revoke compromised credentials automatically.
        </p>
        <p>
          Our SOAR (Security Orchestration, Automation, and Response) capabilities enable
          security teams to define playbooks for common incidents, reducing mean time to
          response (MTTR) from hours to minutes.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Siren} title="Automated Containment" description="Instantly isolate compromised systems, block malicious traffic, and quarantine infected files to prevent lateral movement." />
        <InfoCard icon={Clock} title="Rapid Response" description="Pre-built playbooks and automated workflows reduce mean time to response from hours to minutes for common incident types." />
        <InfoCard icon={FileSearch} title="Forensic Investigation" description="Detailed timeline reconstruction, artifact collection, and evidence preservation for thorough post-incident analysis." />
        <InfoCard icon={Workflow} title="SOAR Integration" description="Orchestrate responses across multiple security tools with automated playbooks and decision trees." />
        <InfoCard icon={MessageSquare} title="Communication" description="Automated stakeholder notification, status updates, and regulatory reporting during active incidents." />
        <InfoCard icon={RotateCcw} title="Recovery Planning" description="Systematic recovery procedures including system restoration, patch deployment, and security posture reassessment." />
      </div>

      <section className="bg-card border border-border rounded p-6">
        <h2 className="font-mono text-sm text-primary mb-4">{`> Incident_Response_Phases`}</h2>
        <div className="grid md:grid-cols-6 gap-3 text-center text-xs font-mono">
          {["Preparation", "Identification", "Containment", "Eradication", "Recovery", "Lessons Learned"].map((phase, i) => (
            <div key={phase} className="border border-border rounded p-3 hover:border-primary transition-colors">
              <div className="text-primary font-bold mb-1">0{i + 1}</div>
              <div className="text-muted-foreground">{phase}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default IncidentResponse;
