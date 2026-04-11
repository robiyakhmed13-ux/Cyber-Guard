import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import AnimatedStat from "@/components/AnimatedStat";
import ScrollReveal from "@/components/ScrollReveal";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { Shield, AlertTriangle, Activity, Eye } from "lucide-react";

const generateTraffic = () =>
  Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    inbound: Math.floor(200 + Math.random() * 300),
    outbound: Math.floor(150 + Math.random() * 250),
    threats: Math.floor(Math.random() * 20),
  }));

const threatTypes = [
  { name: "Malware", value: 340, color: "hsl(0, 70%, 50%)" },
  { name: "Phishing", value: 250, color: "hsl(35, 90%, 55%)" },
  { name: "DDoS", value: 180, color: "hsl(270, 60%, 55%)" },
  { name: "Intrusion", value: 120, color: "hsl(180, 70%, 45%)" },
  { name: "Ransomware", value: 90, color: "hsl(325, 70%, 50%)" },
];

const weeklyData = [
  { day: "Mon", blocked: 145, detected: 178 },
  { day: "Tue", blocked: 198, detected: 220 },
  { day: "Wed", blocked: 167, detected: 195 },
  { day: "Thu", blocked: 230, detected: 258 },
  { day: "Fri", blocked: 189, detected: 210 },
  { day: "Sat", blocked: 87, detected: 102 },
  { day: "Sun", blocked: 65, detected: 78 },
];

const securityScore = [
  { metric: "Firewall", score: 95 },
  { metric: "Endpoint", score: 88 },
  { metric: "Network", score: 92 },
  { metric: "Cloud", score: 78 },
  { metric: "Identity", score: 85 },
  { metric: "Data", score: 90 },
];

const recentAlerts = [
  { time: "2 min ago", type: "Critical", msg: "Ransomware signature detected on endpoint WS-042", icon: AlertTriangle },
  { time: "8 min ago", type: "Warning", msg: "Unusual outbound traffic from server DB-03", icon: Activity },
  { time: "15 min ago", type: "Info", msg: "Vulnerability scan completed — 3 new findings", icon: Eye },
  { time: "23 min ago", type: "Critical", msg: "Brute force attack blocked on SSH port 22", icon: Shield },
  { time: "31 min ago", type: "Warning", msg: "SSL certificate expiring in 7 days for api.internal", icon: AlertTriangle },
];

const chartTheme = {
  grid: "hsl(145, 40%, 18%)",
  text: "hsl(220, 10%, 55%)",
  green: "hsl(145, 80%, 42%)",
  cyan: "hsl(180, 70%, 45%)",
  orange: "hsl(35, 90%, 55%)",
  red: "hsl(0, 70%, 50%)",
};

const Dashboard = () => {
  const [traffic, setTraffic] = useState(generateTraffic);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTraffic(generateTraffic());
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader
        title="Security Dashboard"
        subtitle="Real-time monitoring overview — data refreshes every 5 seconds."
      />
      <div className="container pb-16 space-y-8">
        {/* Stats Row */}
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded p-4">
              <AnimatedStat value={10247} label="Threats Blocked Today" />
            </div>
            <div className="bg-card border border-border rounded p-4">
              <AnimatedStat value={99} label="Uptime %" suffix="%" delay={200} />
            </div>
            <div className="bg-card border border-border rounded p-4">
              <AnimatedStat value={847} label="Active Endpoints" delay={400} />
            </div>
            <div className="bg-card border border-border rounded p-4">
              <AnimatedStat value={23} label="Open Incidents" delay={600} />
            </div>
          </div>
        </ScrollReveal>

        {/* Traffic Chart */}
        <ScrollReveal delay={100}>
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-mono text-sm text-primary mb-4">{`> Network_Traffic (Live)`}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={traffic}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: chartTheme.text }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: chartTheme.text }} />
                <Tooltip
                  contentStyle={{ background: "hsl(220, 18%, 10%)", border: `1px solid ${chartTheme.green}`, borderRadius: 4, fontSize: 12, fontFamily: "JetBrains Mono" }}
                  labelStyle={{ color: chartTheme.green }}
                />
                <Area type="monotone" dataKey="inbound" stroke={chartTheme.green} fill={chartTheme.green} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="outbound" stroke={chartTheme.cyan} fill={chartTheme.cyan} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="threats" stroke={chartTheme.red} fill={chartTheme.red} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-3 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Inbound</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: chartTheme.cyan }} /> Outbound</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: chartTheme.red }} /> Threats</span>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Threat Distribution Pie */}
          <ScrollReveal delay={200}>
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-mono text-sm text-primary mb-4">{`> Threat_Distribution`}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={threatTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {threatTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(220, 18%, 10%)", border: `1px solid ${chartTheme.green}`, borderRadius: 4, fontSize: 12, fontFamily: "JetBrains Mono" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-mono">
                {threatTypes.map((t) => (
                  <span key={t.name} className="flex items-center gap-1 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: t.color }} />
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Weekly Bar Chart */}
          <ScrollReveal delay={300}>
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-mono text-sm text-primary mb-4">{`> Weekly_Overview`}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: chartTheme.text }} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.text }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220, 18%, 10%)", border: `1px solid ${chartTheme.green}`, borderRadius: 4, fontSize: 12, fontFamily: "JetBrains Mono" }}
                  />
                  <Bar dataKey="detected" fill={chartTheme.orange} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="blocked" fill={chartTheme.green} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-3 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: chartTheme.orange }} /> Detected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: chartTheme.green }} /> Blocked</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Security Score Radar */}
          <ScrollReveal delay={200}>
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-mono text-sm text-primary mb-4">{`> Security_Posture`}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={securityScore}>
                  <PolarGrid stroke={chartTheme.grid} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: chartTheme.text }} />
                  <Radar dataKey="score" stroke={chartTheme.green} fill={chartTheme.green} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>

          {/* Recent Alerts */}
          <ScrollReveal delay={300}>
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-mono text-sm text-primary mb-4">{`> Recent_Alerts`}</h2>
              <div className="space-y-3">
                {recentAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 border border-border rounded p-3 hover:cyber-glow transition-shadow animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <alert.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${alert.type === "Critical" ? "text-destructive" : alert.type === "Warning" ? "text-orange-400" : "text-primary"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          alert.type === "Critical" ? "bg-destructive/20 text-destructive" :
                          alert.type === "Warning" ? "bg-orange-400/20 text-orange-400" :
                          "bg-primary/20 text-primary"
                        }`}>{alert.type}</span>
                        <span className="text-xs text-muted-foreground font-mono">{alert.time}</span>
                      </div>
                      <p className="text-xs text-secondary-foreground mt-1 truncate">{alert.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
