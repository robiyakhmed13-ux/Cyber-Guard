import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Radar, Globe, FileText, Share2, Newspaper, Database } from "lucide-react";

const ThreatIntelligence = () => (
  <div>
    <PageHeader
      title="Threat Intelligence"
      subtitle="Actionable intelligence from global threat feeds and dark web monitoring."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          Threat intelligence transforms raw data into actionable information about current
          and emerging cyber threats. CyberGuard aggregates intelligence from multiple sources
          including commercial feeds, open-source intelligence (OSINT), dark web monitoring,
          and industry sharing groups.
        </p>
        <p>
          Our threat intelligence platform (TIP) correlates external intelligence with your
          internal security data to provide contextualized, prioritized threat information
          specific to your organization's risk profile.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Radar} title="Threat Feeds" description="Aggregation and correlation of multiple commercial and open-source threat intelligence feeds for comprehensive coverage." />
        <InfoCard icon={Globe} title="Dark Web Monitoring" description="Continuous monitoring of dark web forums, marketplaces, and paste sites for mentions of your organization or stolen data." />
        <InfoCard icon={FileText} title="IOC Management" description="Centralized management of indicators of compromise including IP addresses, domains, hashes, and YARA rules." />
        <InfoCard icon={Share2} title="Intelligence Sharing" description="Participation in ISACs and automated sharing via STIX/TAXII protocols for community-driven defense." />
        <InfoCard icon={Newspaper} title="Threat Briefings" description="Regular threat landscape reports and briefings customized to your industry, geography, and technology stack." />
        <InfoCard icon={Database} title="Enrichment" description="Automatic enrichment of alerts and incidents with threat intelligence context for faster triage and investigation." />
      </div>
    </div>
  </div>
);

export default ThreatIntelligence;
