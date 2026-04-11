import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Scan, Brain, Bug, ShieldAlert, FileWarning, Fingerprint } from "lucide-react";

const ThreatDetection = () => (
  <div>
    <PageHeader
      title="Threat Detection"
      subtitle="Advanced threat detection systems that identify and classify cyber threats in real-time."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          Our threat detection engine uses a combination of signature-based detection,
          anomaly detection, and behavioral analysis to identify threats across your
          infrastructure. Machine learning models are continuously trained on the latest
          threat intelligence data.
        </p>
        <p>
          The system analyzes network packets, file hashes, process behaviors, and user
          activities to detect malware, ransomware, advanced persistent threats (APTs),
          and insider threats with industry-leading accuracy.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Scan} title="Signature-Based Detection" description="Matching known threat patterns against a continuously updated database of malware signatures and indicators of compromise (IOCs)." />
        <InfoCard icon={Brain} title="AI-Powered Analysis" description="Machine learning models that detect zero-day threats and novel attack patterns by analyzing behavioral anomalies." />
        <InfoCard icon={Bug} title="Malware Detection" description="Static and dynamic analysis of files and executables to identify trojans, worms, rootkits, and polymorphic malware." />
        <InfoCard icon={ShieldAlert} title="APT Detection" description="Identifying advanced persistent threats through long-term behavioral analysis and correlation of low-level indicators." />
        <InfoCard icon={FileWarning} title="Phishing Detection" description="Email and URL analysis using NLP and domain reputation scoring to prevent social engineering attacks." />
        <InfoCard icon={Fingerprint} title="Insider Threat Detection" description="User behavior analytics (UBA) to detect unauthorized access, data exfiltration, and privilege escalation." />
      </div>

      <section className="bg-card border border-border rounded p-6">
        <h2 className="font-mono text-sm text-primary mb-4">{`> Detection_Pipeline`}</h2>
        <div className="grid md:grid-cols-5 gap-4 text-center text-xs font-mono">
          {["Data Collection", "Normalization", "Analysis", "Correlation", "Alert"].map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center text-primary">
                {i + 1}
              </div>
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default ThreatDetection;
