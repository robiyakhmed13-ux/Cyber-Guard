import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Scale, FileCheck, ClipboardList, Shield, Award, BookOpen } from "lucide-react";

const Compliance = () => (
  <div>
    <PageHeader
      title="Compliance"
      subtitle="Automated compliance monitoring and reporting for regulatory requirements."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          Regulatory compliance is a critical aspect of cybersecurity. CyberGuard automates
          compliance monitoring, evidence collection, and reporting for major regulatory
          frameworks including GDPR, HIPAA, PCI DSS, SOC 2, and ISO 27001.
        </p>
        <p>
          Our compliance module continuously maps your security controls to regulatory
          requirements, identifies gaps, and generates audit-ready reports with the
          evidence documentation auditors need.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Scale} title="Regulatory Mapping" description="Automated mapping of security controls to multiple compliance frameworks with gap analysis and remediation guidance." />
        <InfoCard icon={FileCheck} title="Audit Preparation" description="Automated evidence collection and report generation for internal and external audits across all compliance frameworks." />
        <InfoCard icon={ClipboardList} title="Policy Management" description="Centralized policy repository with version control, acknowledgment tracking, and automated distribution." />
        <InfoCard icon={Shield} title="Risk Assessment" description="Quantitative and qualitative risk assessments aligned with NIST, ISO 27005, and FAIR methodologies." />
        <InfoCard icon={Award} title="Certification Support" description="Guided workflows for achieving and maintaining security certifications like ISO 27001 and SOC 2 Type II." />
        <InfoCard icon={BookOpen} title="Training & Awareness" description="Security awareness training tracking and phishing simulation results for compliance with training requirements." />
      </div>

      <section className="bg-card border border-border rounded p-6">
        <h2 className="font-mono text-sm text-primary mb-4">{`> Supported_Frameworks`}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { name: "GDPR", desc: "EU Data Protection" },
            { name: "HIPAA", desc: "Healthcare" },
            { name: "PCI DSS", desc: "Payment Cards" },
            { name: "SOC 2", desc: "Service Orgs" },
            { name: "ISO 27001", desc: "Info Security" },
            { name: "NIST CSF", desc: "Cybersecurity" },
            { name: "CIS Controls", desc: "Best Practices" },
            { name: "CCPA", desc: "CA Privacy" },
          ].map((f) => (
            <div key={f.name} className="border border-border rounded p-3">
              <div className="text-primary font-bold">{f.name}</div>
              <div className="text-muted-foreground mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default Compliance;
