import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Monitor, ShieldCheck, Bug, Cpu, HardDrive, Smartphone } from "lucide-react";

const EndpointSecurity = () => (
  <div>
    <PageHeader
      title="Endpoint Security"
      subtitle="Comprehensive protection for desktops, laptops, servers, and mobile devices."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          Endpoints are the most common entry point for cyber attacks. CyberGuard's Endpoint
          Detection and Response (EDR) solution provides continuous monitoring, threat
          detection, and automated response capabilities for all endpoint devices.
        </p>
        <p>
          Our lightweight agent monitors process execution, file system changes, registry
          modifications, network connections, and user activities to detect malicious
          behavior in real-time.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Monitor} title="EDR" description="Endpoint Detection and Response with continuous monitoring, behavioral analysis, and automated threat containment." />
        <InfoCard icon={ShieldCheck} title="Antivirus/Anti-malware" description="Next-generation antivirus using machine learning for signature-less detection of known and unknown malware." />
        <InfoCard icon={Bug} title="Threat Hunting" description="Proactive endpoint threat hunting with historical data analysis and indicators of compromise (IOC) sweeping." />
        <InfoCard icon={Cpu} title="Process Monitoring" description="Real-time monitoring of process creation, DLL loading, and inter-process communication to detect injection attacks." />
        <InfoCard icon={HardDrive} title="Disk Encryption" description="Full-disk encryption management with centralized key recovery and compliance verification across all endpoints." />
        <InfoCard icon={Smartphone} title="Mobile Security" description="MDM integration for mobile device security including app vetting, containerization, and remote wipe capabilities." />
      </div>
    </div>
  </div>
);

export default EndpointSecurity;
