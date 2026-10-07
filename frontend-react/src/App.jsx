import React from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import styles from "./App.module.css";
import { Routes, Route } from "react-router-dom";
import Memberships from "./pages/Memberships";
import Revenue from "./pages/Revenue";
import Payments from "./pages/Payments";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/members" element={<Members />} />
        <Route path="/memberships" element={<Memberships />} />
        <Route path="/revenue" element={<Revenue />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
};

export default App;
