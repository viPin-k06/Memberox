import React from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
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
