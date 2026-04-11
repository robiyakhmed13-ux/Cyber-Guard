import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
import { Cloud, Key, Container, Eye, Settings, Shield } from "lucide-react";

const CloudSecurity = () => (
  <div>
    <PageHeader
      title="Cloud Security"
      subtitle="Securing cloud workloads, configurations, and data across multi-cloud environments."
    />
    <div className="container pb-16 space-y-12">
      <section className="max-w-3xl space-y-4 text-sm text-secondary-foreground leading-relaxed">
        <p>
          As organizations migrate to the cloud, security must follow. CyberGuard's Cloud
          Security Posture Management (CSPM) continuously monitors your cloud environments
          for misconfigurations, compliance violations, and security risks.
        </p>
        <p>
          We support AWS, Azure, Google Cloud, and hybrid environments, providing unified
          visibility and policy enforcement across all cloud platforms.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <InfoCard icon={Cloud} title="CSPM" description="Continuous monitoring of cloud configurations against security best practices and compliance frameworks." />
        <InfoCard icon={Key} title="IAM Security" description="Analysis of identity and access management policies to detect over-privileged accounts and unused permissions." />
        <InfoCard icon={Container} title="Container Security" description="Image scanning, runtime protection, and Kubernetes security for containerized workloads and microservices." />
        <InfoCard icon={Eye} title="Cloud Workload Protection" description="Runtime security for virtual machines, serverless functions, and cloud-native applications." />
        <InfoCard icon={Settings} title="Configuration Audit" description="Automated assessment of cloud resource configurations against CIS benchmarks and organizational policies." />
        <InfoCard icon={Shield} title="Data Security" description="Cloud data loss prevention, encryption monitoring, and access logging for cloud storage services." />
      </div>

      <section className="bg-card border border-border rounded p-6">
        <h2 className="font-mono text-sm text-primary mb-4">{`> Supported_Platforms`}</h2>
        <div className="flex flex-wrap gap-3">
          {["AWS", "Microsoft Azure", "Google Cloud", "Oracle Cloud", "IBM Cloud", "Kubernetes", "Docker", "Terraform"].map((p) => (
            <span key={p} className="bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded border border-border">
              {p}
            </span>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default CloudSecurity;
