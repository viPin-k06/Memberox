import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import FAQ from "./pages/FAQ";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Memberships from "./pages/Memberships";
import Revenue from "./pages/Revenue";
import Payments from "./pages/Payments";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";

import styles from "./App.module.css";

const DashboardLayout = () => {
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <Outlet />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/faq" element={<FAQ />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
