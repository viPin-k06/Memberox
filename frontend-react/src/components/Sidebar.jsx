import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  Users,
  IdCard,
  CreditCard,
  Bell,
  Settings,
  Wallet,
  ChartSpline,
} from "lucide-react";

const Sidebar = () => {
  return (
    <div>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoFull}>Memberox</span>
          <span className={styles.logoMobile}>M</span>
        </div>

        <nav className={styles.sidebarNav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <ChartSpline />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/members"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <Users />
            <span>Members</span>
          </NavLink>

          <NavLink
            to="/memberships"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <IdCard />
            <span>Memberships</span>
          </NavLink>

          <NavLink
            to="/revenue"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <Wallet />
            <span>Revenue</span>
          </NavLink>

          <NavLink
            to="/payments"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <CreditCard />
            <span>Payments</span>
          </NavLink>

          <NavLink
            to="/reminders"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <Bell />
            <span>Reminders</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <Settings />
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
