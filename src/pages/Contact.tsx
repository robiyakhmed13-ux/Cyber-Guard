import PageHeader from "@/components/PageHeader";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <PageHeader
        title="Contact Us"
        subtitle="Get in touch with our cybersecurity experts for consultations and support."
      />
      <div className="container pb-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-mono text-sm text-primary mb-4">{`> Contact_Info`}</h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "Email", value: "security@cyberguard.io" },
                  { icon: Phone, label: "Phone", value: "+998 (93) CYBER-01" },
                  { icon: MapPin, label: "Location", value: "Uzbekistan, Tashkent" },
                  { icon: Clock, label: "Hours", value: "24/7 SOC Operations" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">{item.label}</div>
                      <div className="text-sm text-foreground">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-mono text-sm text-primary mb-4">{`Emergency Response`}</h2>
              <div className="bg-card border border-destructive/30 rounded p-4 text-sm text-muted-foreground">
                For active security incidents requiring immediate assistance, contact our 24/7 Security Operations Center at{" "}
                <span className="text-destructive font-mono">emergency@cyberguard.io</span> or call our emergency hotline.
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-mono text-sm text-primary mb-4">{`Send Message`}</h2>
            {submitted ? (
              <div className="bg-card border border-primary/30 rounded p-8 text-center">
                <div className="text-primary font-mono text-lg mb-2">Message Sent ✓</div>
                <p className="text-sm text-muted-foreground">Our team will respond within 24 hours.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-card border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-card border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-card border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Message</label>
                  <textarea
                    rows={5}
                    required
                    className="w-full bg-card border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-mono text-sm px-6 py-3 rounded hover:cyber-glow-strong transition-shadow"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
