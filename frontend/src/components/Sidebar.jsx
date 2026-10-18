import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Sidebar.module.css";
import {
  Users,
  IdCard,
  CreditCard,
  Bell,
  Settings,
  Wallet,
  ChartSpline,
  LogOut,
  Dumbbell,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: ChartSpline,
  },
  {
    label: "Members",
    path: "/members",
    icon: Users,
  },
  {
    label: "Memberships",
    path: "/memberships",
    icon: IdCard,
  },
  {
    label: "Revenue",
    path: "/revenue",
    icon: Wallet,
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CreditCard,
  },
  {
    label: "Reminders",
    path: "/reminders",
    icon: Bell,
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const logoutHandler = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
      setLogoutError("Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <div className={styles.sidebarWrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Dumbbell size={22} strokeWidth={2.2} />
          </div>

          <div className={styles.brandText}>
            <span className={styles.brandName}>Memberox</span>
            <span className={styles.brandSubtitle}>Management platform</span>
          </div>
        </div>

        <div className={styles.navigationArea}>
          <p className={styles.sectionLabel}>WORKSPACE</p>

          <nav className={styles.sidebarNav} aria-label="Main navigation">
            {navigation.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                title={label}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ""}`
                }
              >
                <Icon size={20} strokeWidth={1.9} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={styles.settingsSection}>
            <p className={styles.sectionLabel}>PREFERENCES</p>

            <NavLink
              to="/settings"
              title="Settings"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              <Settings size={20} strokeWidth={1.9} />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          {logoutError && (
            <p className={styles.logoutError} role="alert">
              {logoutError}
            </p>
          )}

          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            className={styles.logoutButton}
            onClick={logoutHandler}
            disabled={loggingOut}
          >
            <LogOut size={20} strokeWidth={1.9} />
            <span>{loggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
