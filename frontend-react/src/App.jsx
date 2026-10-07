import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";

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

const DashboardLayout = ({ children }) => {
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      {children}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        }
      />

      <Route
        path="/members"
        element={
          <DashboardLayout>
            <Members />
          </DashboardLayout>
        }
      />

      <Route
        path="/memberships"
        element={
          <DashboardLayout>
            <Memberships />
          </DashboardLayout>
        }
      />

      <Route
        path="/revenue"
        element={
          <DashboardLayout>
            <Revenue />
          </DashboardLayout>
        }
      />

      <Route
        path="/payments"
        element={
          <DashboardLayout>
            <Payments />
          </DashboardLayout>
        }
      />

      <Route
        path="/reminders"
        element={
          <DashboardLayout>
            <Reminders />
          </DashboardLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
