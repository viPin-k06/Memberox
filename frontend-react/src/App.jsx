import React from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import styles from "./App.module.css";

const App = () => {
  return (
    <div className={styles.dashboard}>
      <Sidebar />

      <Dashboard />
    </div>
  );
};

export default App;
