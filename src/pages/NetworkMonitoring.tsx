import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Wifi, BarChart3, Globe, Router, Signal, Database } from "lucide-react";

const NetworkMonitoring = () => (
  <div>
    <PageHeader
      title="Network Monitoring"
      subtitle="Comprehensive network visibility with real-time traffic analysis and anomaly detection."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          Network monitoring is the backbone of any cybersecurity strategy. CyberGuard provides
          full visibility into your network infrastructure, analyzing traffic flows, detecting
          unauthorized devices, and identifying suspicious communication patterns.
        </p>
        <p>
          Our deep packet inspection (DPI) technology examines every packet traversing your
          network, while NetFlow analysis provides macro-level visibility into traffic patterns
          and bandwidth utilization.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Wifi} title="Traffic Analysis" description="Deep packet inspection and NetFlow analysis for complete visibility into network communications and data transfers." />
        <InfoCard icon={BarChart3} title="Bandwidth Monitoring" description="Real-time bandwidth utilization tracking with alerts for unusual spikes or patterns that may indicate data exfiltration." />
        <InfoCard icon={Globe} title="DNS Monitoring" description="Analysis of DNS queries to detect command-and-control communications, DNS tunneling, and domain generation algorithms." />
        <InfoCard icon={Router} title="Device Discovery" description="Automatic discovery and inventory of all network-connected devices with rogue device detection and classification." />
        <InfoCard icon={Signal} title="Latency Monitoring" description="Track network performance metrics including latency, jitter, and packet loss to maintain optimal infrastructure health." />
        <InfoCard icon={Database} title="Log Aggregation" description="Centralized collection and analysis of logs from firewalls, routers, switches, and other network infrastructure." />
      </div>

      <section className="bg-card border border-border rounded p-6">
        <h2 className="font-mono text-sm text-primary mb-4">{`> Network_Protocols_Monitored`}</h2>
        <div className="flex flex-wrap gap-2">
          {["TCP/IP", "UDP", "HTTP/S", "DNS", "SMTP", "FTP", "SSH", "SNMP", "ICMP", "TLS", "DHCP", "ARP"].map((p) => (
            <span key={p} className="bg-secondary text-secondary-foreground font-mono text-xs px-3 py-1 rounded border border-border">
              {p}
            </span>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default NetworkMonitoring;
