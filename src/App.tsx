import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { SchedulingPage } from "@/pages/SchedulingPage";
import { ReportingPage } from "@/pages/ReportingPage";
import { ExceptionsPage } from "@/pages/ExceptionsPage";
import { TrackingPage } from "@/pages/TrackingPage";
import { WarehousePage } from "@/pages/WarehousePage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/exceptions" element={<ExceptionsPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
