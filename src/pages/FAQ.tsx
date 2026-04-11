import PageHeader from "@/components/PageHeader";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "What is cybersecurity monitoring?", a: "Cybersecurity monitoring is the continuous observation and analysis of an organization's IT infrastructure to detect security threats, vulnerabilities, and suspicious activities in real-time. It involves collecting and analyzing data from network traffic, system logs, user behavior, and security tools." },
  { q: "How does threat detection work?", a: "Threat detection uses a combination of signature-based detection (matching known threat patterns), anomaly detection (identifying deviations from normal behavior), and behavioral analysis (monitoring for suspicious activities). Machine learning models enhance detection accuracy by learning from historical data." },
  { q: "What is a SIEM system?", a: "SIEM (Security Information and Event Management) is a centralized platform that collects, normalizes, and correlates security event data from multiple sources across your IT environment. It provides real-time monitoring, alerting, and reporting capabilities for security operations." },
  { q: "How quickly can threats be detected?", a: "With CyberGuard, most threats are detected within seconds of initial indicators appearing. Our real-time analysis engine processes millions of events per second, and automated correlation rules can identify complex attack patterns almost instantly." },
  { q: "What compliance frameworks do you support?", a: "CyberGuard supports GDPR, HIPAA, PCI DSS, SOC 2, ISO 27001, NIST CSF, CIS Controls, and CCPA. Our compliance module automates evidence collection, gap analysis, and reporting for all supported frameworks." },
  { q: "Can CyberGuard protect cloud environments?", a: "Yes, CyberGuard provides comprehensive cloud security for AWS, Azure, Google Cloud, and hybrid environments. Our CSPM module continuously monitors cloud configurations, IAM policies, and workload security across all major cloud platforms." },
  { q: "What is incident response?", a: "Incident response is the structured process of detecting, containing, investigating, and recovering from security incidents. It includes preparation, identification, containment, eradication, recovery, and lessons learned phases." },
  { q: "How does endpoint security work?", a: "Endpoint security uses lightweight agents installed on devices to monitor process execution, file system changes, network connections, and user activities. EDR capabilities provide continuous monitoring, threat detection, and automated response at the endpoint level." },
  { q: "What is threat intelligence?", a: "Threat intelligence is the collection and analysis of information about current and emerging cyber threats. It includes data from threat feeds, dark web monitoring, industry sharing groups, and open-source intelligence to provide actionable security insights." },
  { q: "How do firewalls protect networks?", a: "Firewalls inspect and filter network traffic based on predefined security rules. Next-generation firewalls add application-level inspection, intrusion prevention, SSL decryption, and threat intelligence integration for comprehensive network protection." },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Common questions about cybersecurity monitoring and threat detection."
      />
      <div className="container pb-16 max-w-3xl space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-card transition-colors"
            >
              <span className="font-mono text-sm text-foreground">{faq.q}</span>
              <ChevronDown className={`h-4 w-4 text-primary transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
