import React from "react";
import styles from "./Sidebar.module.css";
import {
  ChartLine,
  Users,
  IdCard,
  CreditCard,
  Bell,
  Settings,
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
          <a href="#" className={styles.active}>
            <ChartLine />
            <span>Overview</span>
          </a>

          <a href="#">
            <Users />
            <span>Members</span>
          </a>

          <a href="#">
            <IdCard />
            <span>Memberships</span>
          </a>

          <a href="#">
            <CreditCard />
            <span>Payments</span>
          </a>

          <a href="#">
            <Bell />
            <span>Reminders</span>
          </a>

          <a href="#">
            <Settings />
            <span>Settings</span>
          </a>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
