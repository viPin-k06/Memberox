import React, { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import styles from "./Members.module.css";

const Members = () => {
  const members = [
    {
      id: 1,
      name: "Rahul Sharma",
      membership: "Premium",
      status: "Active",
      expiry: "12 Oct 2026",
    },
    {
      id: 2,
      name: "Priya Singh",
      membership: "Basic",
      status: "Expiring",
      expiry: "18 Oct 2026",
    },
    {
      id: 3,
      name: "Amit Kumar",
      membership: "Premium",
      status: "Expiring",
      expiry: "5 Oct 2026",
    },
    {
      id: 4,
      name: "Kuldeep Kumar",
      membership: "Premium",
      status: "Expired",
      expiry: "5 Oct 2026",
    },
  ];

  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name
      .toLowerCase()
      .includes(searchValue.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" || member.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className={styles.membersMain}>
      <div className={styles.membersHeader}>
        <div>
          <h1>Members</h1>
          <p>Manage your members and their memberships.</p>
        </div>

        <button className={styles.addMemberBtn}>
          <Plus size={18} />
          Add Member
        </button>
      </div>

      <div className={styles.membersToolbar}>
        <div className={styles.memberSearch}>
          <Search size={18} />

          <input
            type="text"
            placeholder="Search members..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <div className={styles.memberFilter}>
          <button
            className={styles.memberFilterBtn}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={18} />
            {selectedStatus === "All" ? "Filter" : selectedStatus}
          </button>

          {isFilterOpen && (
            <div className={styles.filterMenu}>
              {["All", "Active", "Expiring", "Expired"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setIsFilterOpen(false);
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.membersTableWrapper}>
        <table className={styles.membersTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Membership</th>
              <th>Status</th>
              <th>Expiry</th>
            </tr>
          </thead>

          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.membership}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      member.status === "Active"
                        ? styles.statusActive
                        : member.status === "Expiring"
                          ? styles.statusExpiring
                          : styles.statusExpired
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td>{member.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.membersMobileList}>
        {filteredMembers.map((member) => (
          <div className={styles.memberMobileCard} key={member.id}>
            <div className={styles.memberAvatar}>
              {member.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </div>

            <div className={styles.memberMobileInfo}>
              <strong>{member.name}</strong>
              <p>{member.membership}</p>
            </div>

            <button className={styles.memberActionBtn}>⋮</button>

            <div className={styles.memberMobileDetails}>
              <span
                className={`${styles.status} ${
                  member.status === "Active"
                    ? styles.statusActive
                    : member.status === "Expiring"
                      ? styles.statusExpiring
                      : styles.statusExpired
                }`}
              >
                {member.status}
              </span>

              <span className={styles.memberMobileExpiry}>{member.expiry}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Members;
