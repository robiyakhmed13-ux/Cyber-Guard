import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { LayoutDashboard, Database, Bell, Search, BarChart3, Link } from "lucide-react";

const SIEM = () => (
  <div>
    <PageHeader
      title="SIEM Integration"
      subtitle="Security Information and Event Management — centralized log management and event correlation."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          SIEM (Security Information and Event Management) is the central nervous system of
          modern cybersecurity operations. It collects, normalizes, and correlates data from
          across your entire IT environment to provide a unified view of your security posture.
        </p>
        <p>
          CyberGuard's SIEM module ingests logs from firewalls, IDS/IPS, endpoints, servers,
          cloud services, and applications. Advanced correlation rules and machine learning
          algorithms identify complex attack patterns that span multiple data sources.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Database} title="Log Management" description="Centralized collection, normalization, and storage of log data from hundreds of sources with long-term retention." />
        <InfoCard icon={Link} title="Event Correlation" description="Cross-source correlation rules that connect related events to reveal multi-stage attacks and lateral movement." />
        <InfoCard icon={Search} title="Advanced Search" description="High-speed search across billions of log entries with flexible query language for threat hunting and investigation." />
        <InfoCard icon={Bell} title="Alert Management" description="Intelligent alerting with severity classification, deduplication, and escalation workflows to reduce alert fatigue." />
        <InfoCard icon={LayoutDashboard} title="Dashboards" description="Customizable real-time dashboards showing security metrics, threat trends, and operational KPIs." />
        <InfoCard icon={BarChart3} title="Reporting" description="Automated compliance reports, executive summaries, and detailed technical reports for auditing requirements." />
      </div>

      <section className="bg-card border border-border rounded p-6">
        <h2 className="font-mono text-sm text-primary mb-4">{`> Supported_Log_Sources`}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-muted-foreground">
          {[
            "Windows Event Logs", "Linux Syslog", "AWS CloudTrail", "Azure Activity",
            "Firewall Logs", "IDS/IPS Alerts", "Proxy Logs", "Email Gateway",
            "Active Directory", "VPN Logs", "Database Audit", "Container Logs",
          ].map((s) => (
            <div key={s} className="border border-border rounded px-3 py-2">{s}</div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default SIEM;
