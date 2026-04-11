import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Shield, Menu, X } from "lucide-react";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/integration", label: "Integration" },
  { path: "/data-management", label: "Data Layer" },
  { path: "/about", label: "About" },
  { path: "/threat-detection", label: "Threat Detection" },
  { path: "/network-monitoring", label: "Network Monitoring" },
  { path: "/incident-response", label: "Incident Response" },
  { path: "/vulnerability-assessment", label: "Vulnerability" },
  { path: "/siem", label: "SIEM" },
  { path: "/firewall", label: "Firewall" },
  { path: "/endpoint-security", label: "Endpoint" },
  { path: "/cloud-security", label: "Cloud" },
  { path: "/threat-intelligence", label: "Intelligence" },
  { path: "/compliance", label: "Compliance" },
  { path: "/case-studies", label: "Case Studies" },
  { path: "/faq", label: "FAQ" },
  { path: "/contact", label: "Contact" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col scan-line">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="h-6 w-6 text-primary animate-pulse-glow" />
            <span className="font-mono text-sm font-bold text-primary cyber-text-glow">
              CYBERGUARD
            </span>
          </Link>
          <button
            className="md:hidden text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <nav className="hidden md:flex flex-wrap gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 py-1 text-xs font-mono transition-colors rounded ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10 cyber-glow"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-border bg-background p-4 grid grid-cols-3 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`px-2 py-1 text-xs font-mono transition-colors rounded text-center ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8 bg-background">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm text-primary">CYBERGUARD</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            © 2025 CyberGuard - Cybersecurity Monitoring & Threat Detection
          </p>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
