import PageHeader from "@/components/PageHeader";

const caseStudies = [
  {
    title: "Financial Services Firm — Ransomware Prevention",
    industry: "Finance",
    challenge: "A major financial firm experienced increasing ransomware attempts targeting their trading infrastructure, with attacks becoming more sophisticated and frequent.",
    solution: "Deployed CyberGuard's EDR and threat detection modules across 5,000 endpoints with automated containment playbooks.",
    results: ["Blocked 47 ransomware attempts in the first quarter", "Reduced MTTR from 4 hours to 8 minutes", "Achieved 99.97% detection accuracy"],
  },
  {
    title: "Healthcare Network — HIPAA Compliance",
    industry: "Healthcare",
    challenge: "A hospital network struggled to maintain HIPAA compliance across 12 facilities with disparate security tools and manual reporting processes.",
    solution: "Unified security monitoring with CyberGuard SIEM and compliance modules, centralizing logs from 200+ sources.",
    results: ["Passed HIPAA audit with zero findings", "Reduced compliance reporting time by 80%", "Identified 23 previously unknown vulnerabilities"],
  },
  {
    title: "E-Commerce Platform — DDoS Mitigation",
    industry: "Retail",
    challenge: "An e-commerce platform suffered repeated DDoS attacks during peak shopping seasons, resulting in significant revenue losses.",
    solution: "Implemented CyberGuard network monitoring with automated DDoS detection and traffic scrubbing integration.",
    results: ["Successfully mitigated 15 DDoS attacks", "Maintained 99.99% availability during Black Friday", "Saved an estimated $2M in potential losses"],
  },
  {
    title: "Government Agency — APT Defense",
    industry: "Government",
    challenge: "A government agency detected indicators of a nation-state APT campaign targeting classified research data.",
    solution: "Deployed advanced threat hunting, dark web monitoring, and micro-segmentation to contain and eradicate the threat.",
    results: ["Identified and removed 3 backdoors", "Mapped the complete attack chain across 8 months", "Implemented zero-trust architecture"],
  },
];

const CaseStudies = () => (
  <div>
    <PageHeader
      title="Case Studies"
      subtitle="Real-world examples of CyberGuard protecting organizations from cyber threats."
    />
    <div className="container pb-16 space-y-8">
      {caseStudies.map((cs, i) => (
        <div key={i} className="bg-card border border-border rounded p-6 hover:cyber-glow transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary text-primary-foreground font-mono text-xs px-3 py-1 rounded">
              {cs.industry}
            </span>
            <h2 className="font-mono text-sm text-foreground font-bold">{cs.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-mono text-xs text-primary mb-2">{`Challenge`}</h3>
              <p className="text-muted-foreground">{cs.challenge}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs text-primary mb-2">{`Solution`}</h3>
              <p className="text-muted-foreground">{cs.solution}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs text-primary mb-2">{`Results`}</h3>
              <ul className="space-y-1">
                {cs.results.map((r, j) => (
                  <li key={j} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">▸</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CaseStudies;
