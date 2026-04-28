import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Database,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Brain,
  Shield,
  X,
} from "lucide-react";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Pages hidden from the main nav — accessible via the "Docs" dropdown
const docPages = [
  { path: "/threat-detection", label: "Threat Detection" },
  { path: "/network-monitoring", label: "Network Monitoring" },
  { path: "/incident-response", label: "Incident Response" },
  { path: "/vulnerability-assessment", label: "Vulnerability" },
  { path: "/siem", label: "SIEM" },
  { path: "/firewall", label: "Firewall" },
  { path: "/endpoint-security", label: "Endpoint Security" },
  { path: "/cloud-security", label: "Cloud Security" },
  { path: "/threat-intelligence", label: "Threat Intelligence" },
  { path: "/intelligence-hub", label: "Intelligence Hub" },
  { path: "/compliance", label: "Compliance" },
  { path: "/about", label: "About" },
  { path: "/case-studies", label: "Case Studies" },
  { path: "/faq", label: "FAQ" },
  { path: "/contact", label: "Contact" },
];

const roleBadgeVariant = (role?: string) => {
  if (role === "admin") return "default";
  if (role === "analyst") return "secondary";
  return "outline";
};

// ─── small reusable pieces ───────────────────────────────────────────────────

const NavLink = ({
  to,
  label,
  icon: Icon,
  current,
  onClick,
}: {
  to: string;
  label: string;
  icon?: React.ElementType;
  current: string;
  onClick?: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
      current === to
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
    }`}
  >
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {label}
  </Link>
);

const DocsDropdown = ({
  current,
}: {
  current: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = docPages.some((p) => p.path === current);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
          isActive
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        }`}
      >
        Docs
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 rounded-md border border-border bg-background/98 backdrop-blur-md shadow-lg z-50 p-1">
          {docPages.map((p) => (
            <Link
              key={p.path}
              to={p.path}
              onClick={() => setOpen(false)}
              className={`block px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                current === p.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── main Layout ─────────────────────────────────────────────────────────────

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = usePhase3Auth();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const close = () => setMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col scan-line">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Shield className="h-6 w-6 text-primary animate-pulse-glow" />
            <span className="font-mono text-sm font-bold text-primary cyber-text-glow">
              CYBERGUARD
            </span>
          </Link>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {isAuthenticated ? (
              /* ── Authenticated ── */
              <>
                <NavLink
                  to="/data-management"
                  label="Workspace"
                  icon={Database}
                  current={location.pathname}
                />
                <NavLink
                  to="/dashboard"
                  label="Dashboard"
                  icon={LayoutDashboard}
                  current={location.pathname}
                />
                <NavLink
                  to="/intelligence-hub"
                  label="Intelligence"
                  icon={Brain}
                  current={location.pathname}
                />
                <NavLink
                  to="/integration"
                  label="Integration"
                  icon={Shield}
                  current={location.pathname}
                />
                <DocsDropdown current={location.pathname} />

                {/* User pill */}
                <div className="ml-3 flex items-center gap-2 pl-3 border-l border-border">
                  <Badge
                    variant={roleBadgeVariant(user?.role)}
                    className="text-xs font-mono capitalize"
                  >
                    {user?.role}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {user?.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </Button>
                </div>
              </>
            ) : (
              /* ── Unauthenticated ── */
              <>
                <NavLink to="/" label="Home" current={location.pathname} />
                <NavLink
                  to="/dashboard"
                  label="Dashboard"
                  current={location.pathname}
                />
                <NavLink
                  to="/integration"
                  label="Integration"
                  current={location.pathname}
                />
                <DocsDropdown current={location.pathname} />

                <div className="ml-3 pl-3 border-l border-border">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-mono text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Login
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-1">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/data-management"
                  label="Workspace"
                  icon={Database}
                  current={location.pathname}
                  onClick={close}
                />
                <NavLink
                  to="/dashboard"
                  label="Dashboard"
                  icon={LayoutDashboard}
                  current={location.pathname}
                  onClick={close}
                />
                <NavLink
                  to="/intelligence-hub"
                  label="Intelligence"
                  icon={Brain}
                  current={location.pathname}
                  onClick={close}
                />
                <NavLink
                  to="/integration"
                  label="Integration"
                  icon={Shield}
                  current={location.pathname}
                  onClick={close}
                />
                <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={roleBadgeVariant(user?.role)}
                      className="text-xs font-mono capitalize"
                    >
                      {user?.role}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {user?.username}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/"
                  label="Home"
                  current={location.pathname}
                  onClick={close}
                />
                <NavLink
                  to="/dashboard"
                  label="Dashboard"
                  current={location.pathname}
                  onClick={close}
                />
                <NavLink
                  to="/integration"
                  label="Integration"
                  current={location.pathname}
                  onClick={close}
                />
                <div className="pt-2">
                  <Link
                    to="/login"
                    onClick={close}
                    className="flex items-center justify-center gap-2 w-full rounded bg-primary px-4 py-2.5 text-sm font-mono text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    Login to Workspace
                  </Link>
                </div>
              </>
            )}

            {/* Docs section */}
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs text-muted-foreground font-mono mb-2 px-1">
                Documentation
              </p>
              <div className="grid grid-cols-2 gap-0.5">
                {docPages.map((p) => (
                  <Link
                    key={p.path}
                    to={p.path}
                    onClick={close}
                    className={`text-xs font-mono px-2 py-1.5 rounded transition-colors ${
                      location.pathname === p.path
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 bg-background">
        <div className="container">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm text-primary">CYBERGUARD</span>
          </div>
          <p className="text-center text-xs text-muted-foreground font-mono mb-4">
            © 2025 CyberGuard — Cybersecurity Monitoring &amp; Threat Detection
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {docPages.map((link) => (
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
