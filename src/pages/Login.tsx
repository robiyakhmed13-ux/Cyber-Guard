import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePhase3Auth, type Phase3Role } from "@/context/Phase3AuthContext";
import {
  ArrowRight,
  Database,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCog,
  UserRoundSearch,
} from "lucide-react";

const roleCards: Array<{
  role: Phase3Role;
  title: string;
  username: string;
  password: string;
  description: string;
  capabilities: string[];
  icon: typeof ShieldCheck;
  color: string;
}> = [
  {
    role: "admin",
    title: "Administrator",
    username: "admin",
    password: "Admin123!",
    description: "Full access to all features including delete operations, cache management, and audit logs.",
    capabilities: [
      "Create, update, and delete incidents",
      "Create and delete threat intelligence",
      "Clear cache and review audit trail",
      "Run async jobs and transformations",
    ],
    icon: ShieldCheck,
    color: "border-primary/40 bg-primary/5",
  },
  {
    role: "analyst",
    title: "Security Analyst",
    username: "analyst1",
    password: "Analyst123!",
    description: "Operational user for day-to-day investigation, triage, and threat intelligence work.",
    capabilities: [
      "Create and update incidents",
      "Create and delete threat intelligence",
      "Run async jobs and XML transformation",
      "Read metrics and system events",
    ],
    icon: UserCog,
    color: "border-border/70 bg-card/80",
  },
  {
    role: "viewer",
    title: "Read-Only Viewer",
    username: "viewer1",
    password: "Analyst123!",
    description: "Safe account for demonstrating the platform. Cannot create or modify any data.",
    capabilities: [
      "View all incidents and threat intel",
      "See health, metrics, and system events",
      "No write, update, or delete permissions",
    ],
    icon: UserRoundSearch,
    color: "border-border/70 bg-card/80",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, loginWithRole, isAuthenticated, isHydrated, user, logout } = usePhase3Auth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState<string | null>(null);

  // Where to send the user after a successful login
  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get("returnTo") || "/data-management";

  // Already logged in — go straight to the workspace (or returnTo)
  if (isHydrated && isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading("manual");
    try {
      const loggedInUser = await login(username, password);
      toast({
        title: "Signed in",
        description: `Welcome ${loggedInUser.username}. Opening the workspace.`,
      });
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unable to sign in.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleQuickLogin = async (role: Phase3Role) => {
    setLoading(role);
    try {
      const loggedInUser = await loginWithRole(role);
      toast({
        title: "Demo account ready",
        description: `Signed in as ${loggedInUser.role}. Opening workspace.`,
      });
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast({
        title: "Quick login failed",
        description: error instanceof Error ? error.message : "Unable to sign in with this account.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 pb-16 px-4">
      <div className="w-full max-w-5xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-mono text-foreground cyber-text-glow">
            Sign in to CyberGuard
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The Phase III backend has three pre-seeded accounts. Pick a role below to instantly
            experience the platform as that user type.
          </p>
        </div>

        {/* Main grid: login form left, role cards right */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">

          {/* ── Login form ── */}
          <Card className="border-primary/20 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <KeyRound className="h-5 w-5" /> Sign In
              </CardTitle>
              <CardDescription>
                Enter credentials manually or use a one-click demo below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={loading !== null}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading !== null}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading !== null}>
                  <KeyRound className="h-4 w-4" />
                  {loading === "manual" ? "Signing in..." : "Login"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-mono">
                    or use a demo account
                  </span>
                </div>
              </div>

              {/* Quick login buttons */}
              <div className="grid gap-2">
                {roleCards.map((card) => (
                  <Button
                    key={card.role}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleQuickLogin(card.role)}
                    disabled={loading !== null}
                  >
                    <card.icon className="h-4 w-4" />
                    {loading === card.role
                      ? `Signing in as ${card.role}...`
                      : `Continue as ${card.title}`}
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                ))}
              </div>

              {/* Backend note */}
              <p className="text-xs text-muted-foreground border border-border rounded p-3 font-mono leading-relaxed">
                <span className="text-primary">Note:</span> The Phase III backend must be running
                for login to work.
                <br />
                Start it: <span className="text-primary">cd server/phase3 &amp;&amp; npm start</span>
              </p>
            </CardContent>
          </Card>

          {/* ── Role cards ── */}
          <div className="grid gap-4 sm:grid-cols-1">
            {roleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.role} className={`border ${card.color}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-base">{card.title}</CardTitle>
                      </div>
                      <Badge
                        variant={
                          card.role === "admin"
                            ? "default"
                            : card.role === "analyst"
                            ? "secondary"
                            : "outline"
                        }
                        className="font-mono"
                      >
                        {card.role}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Credentials */}
                    <div className="rounded-md border border-border bg-background p-2.5 font-mono text-xs text-muted-foreground grid grid-cols-2 gap-x-4">
                      <span className="text-foreground/60">username</span>
                      <span className="text-primary">{card.username}</span>
                      <span className="text-foreground/60">password</span>
                      <span className="text-primary">{card.password}</span>
                    </div>
                    {/* Capabilities */}
                    <ul className="space-y-1">
                      {card.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-primary mt-0.5">›</span>
                          {cap}
                        </li>
                      ))}
                    </ul>
                    {/* Quick login shortcut */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 text-xs border border-border/60"
                      onClick={() => handleQuickLogin(card.role)}
                      disabled={loading !== null}
                    >
                      <Database className="h-3.5 w-3.5" />
                      {loading === card.role ? "Signing in..." : `Login as ${card.role}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
