import React from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import styles from "./App.module.css";
import { Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/members" element={<Members />} />
        <Route path="/memberships" element={<h1>Memberships</h1>} />
        <Route path="/revenue" element={<h1>Revenue</h1>} />
        <Route path="/payments" element={<h1>Payments</h1>} />
        <Route path="/reminders" element={<h1>Reminders</h1>} />
        <Route path="/settings" element={<h1>Settings</h1>} />
      </Routes>
    </div>
  );
};

export default App;
