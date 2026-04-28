import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Phase3AuthProvider } from "@/context/Phase3AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import CaseStudies from "./pages/CaseStudies";
import CloudSecurity from "./pages/CloudSecurity";
import Compliance from "./pages/Compliance";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import DataManagementDashboard from "./pages/DataManagementDashboard";
import EndpointSecurity from "./pages/EndpointSecurity";
import FAQ from "./pages/FAQ";
import Firewall from "./pages/Firewall";
import IncidentResponse from "./pages/IncidentResponse";
import IntelligenceHub from "./pages/IntelligenceHub";
import Index from "./pages/Index";
import IntegrationDashboard from "./pages/IntegrationDashboard";
import Login from "./pages/Login";
import NetworkMonitoring from "./pages/NetworkMonitoring";
import NotFound from "./pages/NotFound";
import SIEM from "./pages/SIEM";
import ThreatDetection from "./pages/ThreatDetection";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import VulnerabilityAssessment from "./pages/VulnerabilityAssessment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Phase3AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/integration" element={<IntegrationDashboard />} />
              <Route path="/intelligence-hub" element={<IntelligenceHub />} />

              {/* Protected: requires login */}
              <Route
                path="/data-management"
                element={
                  <ProtectedRoute>
                    <DataManagementDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Informational / documentation pages */}
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

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </Phase3AuthProvider>
  </QueryClientProvider>
);

export default App;
