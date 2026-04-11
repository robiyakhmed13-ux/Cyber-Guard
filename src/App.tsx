import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import ThreatDetection from "./pages/ThreatDetection";
import NetworkMonitoring from "./pages/NetworkMonitoring";
import IncidentResponse from "./pages/IncidentResponse";
import VulnerabilityAssessment from "./pages/VulnerabilityAssessment";
import SIEM from "./pages/SIEM";
import Firewall from "./pages/Firewall";
import EndpointSecurity from "./pages/EndpointSecurity";
import CloudSecurity from "./pages/CloudSecurity";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Compliance from "./pages/Compliance";
import CaseStudies from "./pages/CaseStudies";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import IntegrationDashboard from "./pages/IntegrationDashboard";
import DataManagementDashboard from "./pages/DataManagementDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/integration" element={<IntegrationDashboard />} />
            <Route path="/data-management" element={<DataManagementDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/threat-detection" element={<ThreatDetection />} />
            <Route path="/network-monitoring" element={<NetworkMonitoring />} />
            <Route path="/incident-response" element={<IncidentResponse />} />
            <Route path="/vulnerability-assessment" element={<VulnerabilityAssessment />} />
            <Route path="/siem" element={<SIEM />} />
            <Route path="/firewall" element={<Firewall />} />
            <Route path="/endpoint-security" element={<EndpointSecurity />} />
            <Route path="/cloud-security" element={<CloudSecurity />} />
            <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
