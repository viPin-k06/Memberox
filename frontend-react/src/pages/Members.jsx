import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import styles from "./Members.module.css";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MEMBERSHIP_TYPES = ["Basic", "Premium"];
const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer"];
const STATUS_FILTERS = ["All", "Active", "Expiring", "Expired"];
const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const EXPIRING_SOON_DAYS = 7;

// Edit these to match your gym's prices.
// Fee = package price for that duration if one exists, otherwise monthly rate x months.
const MONTHLY_RATE = { Basic: 999, Premium: 899 };
const PACKAGE_PRICES = {
  Premium: { 3: 2499, 6: 4999 },
};

const STATUS_CLASS = {
  Active: styles.statusActive,
  Expiring: styles.statusExpiring,
  Expired: styles.statusExpired,
};

// Dates are stored as plain "YYYY-MM-DD" strings (no timezone surprises).
// `expiry` display strings are derived, never stored.
const INITIAL_MEMBERS = [
  {
    id: "m-1",
    name: "Rahul Sharma",
    mobileNumber: "9876543210",
    email: "rahul@example.com",
    membership: "Premium",
    membershipMonths: 3,
    membershipFee: 2499,
    joiningDate: "2026-07-12",
    expiryDate: "2026-10-12",
    currentCycleId: "rahul-cycle-1",
    payments: [
      {
        id: "p-101",
        amount: 2499,
        date: "2026-07-12",
        mode: "UPI",
        type: "Joining",
        membershipMonths: 3,
        cycleId: "rahul-cycle-1",
      },
    ],
  },
  {
    id: "m-2",
    name: "Priya Singh",
    mobileNumber: "9876543211",
    email: "",
    membership: "Basic",
    membershipMonths: 1,
    membershipFee: 999,
    joiningDate: "2026-09-18",
    expiryDate: "2026-10-18",
    currentCycleId: "priya-cycle-1",
    payments: [
      {
        id: "p-102",
        amount: 999,
        date: "2026-09-18",
        mode: "Cash",
        type: "Joining",
        membershipMonths: 1,
        cycleId: "priya-cycle-1",
      },
    ],
  },
  {
    id: "m-3",
    name: "Amit Kumar",
    mobileNumber: "9876543212",
    email: "",
    membership: "Premium",
    membershipMonths: 6,
    membershipFee: 4999,
    joiningDate: "2026-04-05",
    expiryDate: "2026-10-05",
    currentCycleId: "amit-cycle-1",
    payments: [
      {
        id: "p-103",
        amount: 4999,
        date: "2026-04-05",
        mode: "Cash",
        type: "Joining",
        membershipMonths: 6,
        cycleId: "amit-cycle-1",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

const createId = () => crypto.randomUUID();

const pad = (n) => String(n).padStart(2, "0");

const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDate = (isoDate) => new Date(`${isoDate}T00:00:00`);

const formatDate = (isoDate) =>
  parseDate(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const formatDuration = (months) =>
  months === 12 ? "1 Year" : `${months} ${months === 1 ? "Month" : "Months"}`;

const getPlanFee = (membership, months) =>
  PACKAGE_PRICES[membership]?.[months] ?? MONTHLY_RATE[membership] * months;

const getInitials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

// Adds months, clamping to the end of shorter months (31 Jan + 1mo = 28/29 Feb).
const addMonths = (isoDate, months) => {
  const date = parseDate(isoDate);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));

  return toISODate(date);
};

const getMemberStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Math.round guards against 23/25-hour days around DST changes.
  const daysRemaining = Math.round(
    (parseDate(expiryDate) - today) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) return "Expired";
  if (daysRemaining <= EXPIRING_SOON_DAYS) return "Expiring";
  return "Active";
};

// Total paid for the member's current membership period.
const getAmountPaid = (member) =>
  member.payments
    .filter((payment) => payment.cycleId === member.currentCycleId)
    .reduce((total, payment) => total + payment.amount, 0);

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */

const useForm = (initialValues) => {
  const [form, setForm] = useState(initialValues);

  const bind = (name) => ({
    value: form[name],
    onChange: (event) =>
      setForm((current) => ({ ...current, [name]: event.target.value })),
  });

  return [form, bind, setForm];
};

const StatusBadge = ({ status }) => (
  <span className={`${styles.status} ${STATUS_CLASS[status]}`}>{status}</span>
);

const DurationSelect = (props) => (
  <select {...props}>
    {DURATION_OPTIONS.map((months) => (
      <option key={months} value={months}>
        {months} {months === 1 ? "Month" : "Months"}
      </option>
    ))}
  </select>
);

const PaymentModeSelect = (props) => (
  <select {...props}>
    {PAYMENT_MODES.map((mode) => (
      <option key={mode} value={mode}>
        {mode}
      </option>
    ))}
  </select>
);

const FormError = ({ message }) =>
  message ? (
    <p role="alert" className={styles.formError}>
      {message}
    </p>
  ) : null;

const Modal = ({
  title,
  onClose,
  children,
  contentClassName = styles.memberModalContent,
  closeOnBackdrop = false,
  closeOnEscape = true,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!closeOnEscape) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, closeOnEscape]);

  return (
    <div
      className={styles.memberModal}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.memberModalHeader}>
          <h2 id={titleId}>{title}</h2>

          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Forms (each owns its state, so it resets automatically on reopen)   */
/* ------------------------------------------------------------------ */

// `onSubmit` returns an error string to display, or null on success.
const MemberForm = ({ mode, initialValues, onSubmit, onClose }) => {
  const isEdit = mode === "edit";
  const [form, bind, setForm] = useForm(initialValues);
  const [error, setError] = useState("");

  // When adding, the fee follows the selected membership and duration
  // (the owner can still adjust it afterwards).
  const handlePlanChange = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => {
      const next = { ...current, [field]: value };

      return isEdit
        ? next
        : {
            ...next,
            membershipFee: String(
              getPlanFee(next.membership, Number(next.membershipMonths)),
            ),
          };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const mobileNumber = form.mobileNumber.trim();

    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    const result = onSubmit({
      ...form,
      name: form.name.trim(),
      mobileNumber,
      email: form.email.trim(),
      membershipMonths: Number(form.membershipMonths),
      membershipFee: Number(form.membershipFee) || 0,
    });

    if (result) setError(result);
  };

  return (
    <Modal title={isEdit ? "Edit Member" : "Add Member"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            placeholder="Enter member name"
            autoFocus
            required
            {...bind("name")}
          />
        </label>

        <label>
          Mobile Number
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter mobile number"
            required
            {...bind("mobileNumber")}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            placeholder="Enter email (optional)"
            {...bind("email")}
          />
        </label>

        {!isEdit && (
          <label>
            Joining Date
            <input type="date" required {...bind("joiningDate")} />
          </label>
        )}

        <label>
          Membership
          <select
            value={form.membership}
            onChange={handlePlanChange("membership")}
          >
            {MEMBERSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        {!isEdit && (
          <label>
            Membership Duration
            <DurationSelect
              value={form.membershipMonths}
              onChange={handlePlanChange("membershipMonths")}
            />
          </label>
        )}

        {!isEdit && (
          <>
            <label>
              Membership Fee
              <input
                type="number"
                min="1"
                placeholder="Enter membership fee"
                required
                {...bind("membershipFee")}
              />
            </label>

            <label>
              Payment Mode
              <PaymentModeSelect {...bind("paymentMode")} />
            </label>

            <p>
              Amount to collect:{" "}
              <strong>{formatCurrency(Number(form.membershipFee) || 0)}</strong>
            </p>
          </>
        )}

        <FormError message={error} />

        <button type="submit" className={styles.modalSubmitBtn}>
          {isEdit
            ? "Save Changes"
            : `Collect ${formatCurrency(Number(form.membershipFee) || 0)} & Add Member`}
        </button>
      </form>
    </Modal>
  );
};

// Renewal always collects the full fee, so the payment is recorded automatically.
const RenewForm = ({ member, onSubmit, onClose }) => {
  const [form, bind, setForm] = useForm({
    months: String(member.membershipMonths),
    fee: String(getPlanFee(member.membership, member.membershipMonths)),
    date: toISODate(new Date()),
    mode: "Cash",
  });
  // Only used when the membership has already expired: "old" | "payment"
  const [startFrom, setStartFrom] = useState("payment");

  // Fee follows the selected duration (the owner can still adjust it).
  const handleMonthsChange = (event) => {
    const months = event.target.value;
    setForm((current) => ({
      ...current,
      months,
      fee: String(getPlanFee(member.membership, Number(months))),
    }));
  };

  const fee = Number(form.fee) || 0;

  const isExpired = Boolean(form.date) && member.expiryDate < form.date;

  // Active members always extend from their current due date.
  // Expired members: the owner chooses the old due date or the payment date.
  const startDate =
    isExpired && startFrom === "payment" ? form.date : member.expiryDate;

  const newExpiry = form.date
    ? addMonths(startDate, Number(form.months))
    : null;

  const stillExpired = Boolean(newExpiry) && newExpiry < form.date;

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      months: Number(form.months),
      fee,
      date: form.date,
      mode: form.mode,
      startDate,
    });
  };

  return (
    <Modal title="Renew Membership" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label>
          Membership Duration
          <DurationSelect
            value={form.months}
            onChange={handleMonthsChange}
            autoFocus
          />
        </label>

        <label>
          Membership Fee
          <input
            type="number"
            min="1"
            placeholder="Fee for this renewal"
            required
            {...bind("fee")}
          />
        </label>

        <label>
          Payment Date
          <input type="date" required {...bind("date")} />
        </label>

        <label>
          Payment Mode
          <PaymentModeSelect {...bind("mode")} />
        </label>

        {isExpired && (
          <>
            <p>
              Membership expired on{" "}
              <strong>{formatDate(member.expiryDate)}</strong>. Count the new
              period from:
            </p>

            <div
              className={styles.choiceGroup}
              role="group"
              aria-label="Start new period from"
            >
              <button
                type="button"
                aria-pressed={startFrom === "old"}
                className={
                  startFrom === "old" ? styles.choiceBtnActive : styles.choiceBtn
                }
                onClick={() => setStartFrom("old")}
              >
                Old due date
                <small>{formatDate(member.expiryDate)}</small>
              </button>

              <button
                type="button"
                aria-pressed={startFrom === "payment"}
                className={
                  startFrom === "payment"
                    ? styles.choiceBtnActive
                    : styles.choiceBtn
                }
                onClick={() => setStartFrom("payment")}
              >
                Payment date
                <small>{formatDate(form.date)}</small>
              </button>
            </div>
          </>
        )}

        <p>
          Amount to collect: <strong>{formatCurrency(fee)}</strong>
          {newExpiry && <> · New due date: {formatDate(newExpiry)}</>}
        </p>

        {stillExpired && (
          <p>
            Heads up: the membership will still be expired after this renewal.
          </p>
        )}

        <button type="submit" className={styles.modalSubmitBtn}>
          Collect {formatCurrency(fee)} &amp; Renew
        </button>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Member details                                                      */
/* ------------------------------------------------------------------ */

const MemberDetails = ({
  member,
  isChildModalOpen,
  onClose,
  onEdit,
  onRenew,
  onDelete,
}) => {
  const amountPaid = getAmountPaid(member);

  const rows = [
    ["Name", member.name],
    ["Mobile Number", member.mobileNumber],
    ["Email", member.email || "Not provided"],
    ["Joining Date", formatDate(member.joiningDate)],
    ["Membership", member.membership],
    ["Duration", formatDuration(member.membershipMonths)],
    ["Membership Fee", formatCurrency(member.membershipFee)],
    ["Amount Paid", formatCurrency(amountPaid)],
    ["Membership Status", member.status],
    ["Expiry", formatDate(member.expiryDate)],
  ];

  // Newest first
  const payments = [...member.payments].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <Modal
      title="Member Details"
      onClose={onClose}
      contentClassName={styles.memberDetailsModal}
      closeOnBackdrop
      closeOnEscape={!isChildModalOpen}
    >
      <div className={styles.memberDetails}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.memberDetailsActions}>
        <button className={styles.editMemberBtn} onClick={onEdit}>
          Edit Member
        </button>

        <button className={styles.renewMemberBtn} onClick={onRenew}>
          Renew Membership
        </button>

        <button className={styles.deleteMemberBtn} onClick={onDelete}>
          Delete Member
        </button>
      </div>

      {payments.length > 0 && (
        <div className={styles.paymentHistory}>
          <h3>Payment History</h3>

          {payments.map((payment) => (
            <div key={payment.id} className={styles.paymentHistoryItem}>
              <div>
                <strong>{formatCurrency(payment.amount)}</strong>
                <span>{formatDate(payment.date)}</span>
                <span>
                  {payment.type} · {formatDuration(payment.membershipMonths)}
                </span>
              </div>

              <span>{payment.mode}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const Members = () => {
  const [members, setMembers] = useState(INITIAL_MEMBERS);

  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Store the id, not a copy, so the details view can never go stale.
  const [selectedId, setSelectedId] = useState(null);
  // null | "add" | "edit" | "renew"
  const [activeModal, setActiveModal] = useState(null);

  // Close the filter menu when clicking elsewhere.
  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!filterRef.current?.contains(event.target)) setIsFilterOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isFilterOpen]);

  const membersWithStatus = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        status: getMemberStatus(member.expiryDate),
      })),
    [members],
  );

  const filteredMembers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return membersWithStatus.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.mobileNumber.includes(query);

      const matchesStatus =
        selectedStatus === "All" || member.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [membersWithStatus, searchValue, selectedStatus]);

  const selectedMember = membersWithStatus.find((m) => m.id === selectedId);

  const updateMember = (id, updater) =>
    setMembers((current) =>
      current.map((member) => (member.id === id ? updater(member) : member)),
    );

  const isDuplicateMobile = (mobileNumber, ignoreId) =>
    members.some(
      (member) => member.id !== ignoreId && member.mobileNumber === mobileNumber,
    );

  const closeModal = () => setActiveModal(null);

  /* ---------- Handlers ---------- */

  const handleAddMember = (values) => {
    if (isDuplicateMobile(values.mobileNumber)) {
      return "A member with this mobile number already exists.";
    }

    const cycleId = createId();

    setMembers((current) => [
      ...current,
      {
        id: createId(),
        name: values.name,
        mobileNumber: values.mobileNumber,
        email: values.email,
        joiningDate: values.joiningDate,
        membership: values.membership,
        membershipMonths: values.membershipMonths,
        membershipFee: values.membershipFee,
        expiryDate: addMonths(values.joiningDate, values.membershipMonths),
        currentCycleId: cycleId,
        // Full fee is collected when the member joins.
        payments: [
          {
            id: createId(),
            amount: values.membershipFee,
            date: values.joiningDate,
            mode: values.paymentMode,
            type: "Joining",
            membershipMonths: values.membershipMonths,
            cycleId,
          },
        ],
      },
    ]);

    closeModal();
    return null;
  };

  const handleEditMember = (values) => {
    if (isDuplicateMobile(values.mobileNumber, selectedId)) {
      return "Another member already uses this mobile number.";
    }

    updateMember(selectedId, (member) => ({
      ...member,
      name: values.name,
      mobileNumber: values.mobileNumber,
      email: values.email,
      membership: values.membership,
    }));

    closeModal();
    return null;
  };

  const handleDeleteMember = () => {
    if (!window.confirm(`Delete ${selectedMember.name}? This can't be undone.`)) {
      return;
    }

    setMembers((current) => current.filter((m) => m.id !== selectedId));
    setSelectedId(null);
  };

  // The only handler that extends a membership.
  const handleRenew = ({ months, fee, date, mode, startDate }) => {
    const cycleId = createId();

    updateMember(selectedId, (member) => {

      // Renewal always collects the full fee.
      const payments = [
        ...member.payments,
        {
          id: createId(),
          amount: fee,
          date,
          mode,
          type: "Renewal",
          membershipMonths: months,
          cycleId,
        },
      ];

      return {
        ...member,
        membershipMonths: months,
        membershipFee: fee,
        expiryDate: addMonths(startDate, months),
        currentCycleId: cycleId,
        payments,
      };
    });

    closeModal();
  };

  const handleRowKeyDown = (event, id) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(id);
    }
  };

  /* ---------- Render ---------- */

  return (
    <main className={styles.membersMain}>
      <div className={styles.membersHeader}>
        <div>
          <h1>Members</h1>
          <p>Manage your members and their memberships.</p>
        </div>

        <button
          className={styles.addMemberBtn}
          onClick={() => setActiveModal("add")}
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      <div className={styles.membersToolbar}>
        <div className={styles.memberSearch}>
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by name or mobile..."
            aria-label="Search members"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <div className={styles.memberFilter} ref={filterRef}>
          <button
            className={styles.memberFilterBtn}
            aria-haspopup="true"
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen((open) => !open)}
          >
            <Filter size={18} />
            {selectedStatus === "All" ? "Filter" : selectedStatus}
          </button>

          {isFilterOpen && (
            <div className={styles.filterMenu}>
              {STATUS_FILTERS.map((status) => (
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

      {/* DESKTOP TABLE */}
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
              <tr
                key={member.id}
                className={styles.memberRow}
                tabIndex={0}
                onClick={() => setSelectedId(member.id)}
                onKeyDown={(event) => handleRowKeyDown(event, member.id)}
              >
                <td>{member.name}</td>
                <td>{member.membership}</td>
                <td>
                  <StatusBadge status={member.status} />
                </td>
                <td>{formatDate(member.expiryDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className={styles.membersMobileList}>
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className={styles.memberMobileCard}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedId(member.id)}
            onKeyDown={(event) => handleRowKeyDown(event, member.id)}
          >
            <div className={styles.memberAvatar}>{getInitials(member.name)}</div>

            <div className={styles.memberMobileInfo}>
              <strong>{member.name}</strong>
              <p>{member.membership}</p>
            </div>

            <div className={styles.memberMobileDetails}>
              <StatusBadge status={member.status} />
              <span className={styles.memberMobileExpiry}>
                {formatDate(member.expiryDate)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <p className={styles.emptyState}>
          {members.length === 0
            ? "No members yet. Add your first member to get started."
            : "No members match your search or filter."}
        </p>
      )}

      {/* MODALS */}
      {activeModal === "add" && (
        <MemberForm
          mode="add"
          initialValues={{
            name: "",
            mobileNumber: "",
            email: "",
            joiningDate: toISODate(new Date()),
            membership: MEMBERSHIP_TYPES[0],
            membershipMonths: "1",
            membershipFee: String(getPlanFee(MEMBERSHIP_TYPES[0], 1)),
            paymentMode: PAYMENT_MODES[0],
          }}
          onSubmit={handleAddMember}
          onClose={closeModal}
        />
      )}

      {selectedMember && (
        <MemberDetails
          member={selectedMember}
          isChildModalOpen={activeModal !== null}
          onClose={() => setSelectedId(null)}
          onEdit={() => setActiveModal("edit")}
          onRenew={() => setActiveModal("renew")}
          onDelete={handleDeleteMember}
        />
      )}

      {selectedMember && activeModal === "edit" && (
        <MemberForm
          mode="edit"
          initialValues={{
            name: selectedMember.name,
            mobileNumber: selectedMember.mobileNumber,
            email: selectedMember.email || "",
            membership: selectedMember.membership,
          }}
          onSubmit={handleEditMember}
          onClose={closeModal}
        />
      )}

      {selectedMember && activeModal === "renew" && (
        <RenewForm
          member={selectedMember}
          onSubmit={handleRenew}
          onClose={closeModal}
        />
      )}
    </main>
  );
};

export default Members;