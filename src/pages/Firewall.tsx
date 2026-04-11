import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Flame, Filter, ShieldCheck, Globe, Settings, Lock } from "lucide-react";

const Firewall = () => (
  <div>
    <PageHeader
      title="Firewall Management"
      subtitle="Centralized firewall policy management and next-generation firewall capabilities."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          Firewalls are the first line of defense in network security. CyberGuard provides
          centralized management of firewall rules across multiple vendors and platforms,
          ensuring consistent security policies across your entire infrastructure.
        </p>
        <p>
          Our next-generation firewall (NGFW) capabilities go beyond traditional packet
          filtering to include application-level inspection, intrusion prevention, SSL
          decryption, and threat intelligence integration.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Flame} title="Next-Gen Firewall" description="Application-aware filtering, SSL inspection, and integrated threat prevention that goes beyond traditional port-based rules." />
        <InfoCard icon={Filter} title="Policy Management" description="Centralized rule management across multiple firewall platforms with change tracking, approval workflows, and audit trails." />
        <InfoCard icon={ShieldCheck} title="Intrusion Prevention" description="Integrated IPS capabilities that detect and block exploit attempts, protocol anomalies, and known attack signatures." />
        <InfoCard icon={Globe} title="Web Filtering" description="URL categorization and web content filtering to block access to malicious, phishing, and policy-violating websites." />
        <InfoCard icon={Settings} title="Rule Optimization" description="Automated analysis of firewall rules to identify redundancies, conflicts, and overly permissive policies." />
        <InfoCard icon={Lock} title="Micro-Segmentation" description="Fine-grained network segmentation policies that limit lateral movement and contain breaches to isolated zones." />
      </div>
    </div>
  </div>
);

export default Firewall;
