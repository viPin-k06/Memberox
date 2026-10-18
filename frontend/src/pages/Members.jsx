import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Plus,
  Search,
  Filter,
  Users,
  UserRoundCheck,
  Clock3,
  UserRoundX,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import styles from "./Members.module.css";

import { supabase } from "../lib/supabase";

/* ------------------------------------------------------------------ */

/* Constants                                                           */

/* ------------------------------------------------------------------ */

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer"];

const STATUS_FILTERS = ["All", "Active", "Expiring", "Expired"];

const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const EXPIRING_SOON_DAYS = 7;

const STATUS_CLASS = {
  Active: styles.statusActive,

  Expiring: styles.statusExpiring,

  Expired: styles.statusExpired,
};

/* ------------------------------------------------------------------ */

/* Pure helpers                                                        */

/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, "0");

const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDate = (isoDate) => new Date(`${isoDate}T00:00:00`);

const formatDate = (isoDate) =>
  isoDate
    ? parseDate(isoDate).toLocaleDateString("en-GB", {
        day: "numeric",

        month: "short",

        year: "numeric",
      })
    : "—";

const formatCurrency = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const formatDuration = (months) =>
  months === 12 ? "1 Year" : `${months} ${months === 1 ? "Month" : "Months"}`;

// Prices come from the business's saved Supabase membership plans.*

const getPlanFee = (plans, planName, months, planId = null) => {
  const plan = plans.find(
    (item) => (planId && item.id === planId) || item.name === planName,
  );

  if (!plan) return 0;

  const custom = plan.duration_prices?.[String(months)];

  return custom != null ? Number(custom) : Number(plan.monthly_price) * months;
};

const getInitials = (name) =>
  name

    .trim()

    .split(/\s+/)

    .slice(0, 2)

    .map((word) => word[0]?.toUpperCase() ?? "")

    .join("");

// Adds months, clamping to the end of shorter months (31 Jan + 1mo = 28/29 Feb).*

const addMonths = (isoDate, months) => {
  const date = parseDate(isoDate);

  const originalDay = date.getDate();

  date.setDate(1);

  date.setMonth(date.getMonth() + months);

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();

  date.setDate(Math.min(originalDay, lastDay));

  return toISODate(date);
};

const getMemberStatus = (expiryDate) => {
  if (!expiryDate) return "Expired";

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // Math.round guards against 23/25-hour days around DST changes.*

  const daysRemaining = Math.round(
    (parseDate(expiryDate) - today) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) return "Expired";

  if (daysRemaining <= EXPIRING_SOON_DAYS) return "Expiring";

  return "Active";
};

// Total paid for the member's current membership period.*

const getAmountPaid = (member) =>
  member.payments

    .filter((payment) => payment.cycleId === member.currentCycleId)

    .reduce((total, payment) => total + payment.amount, 0);

// The UI keeps its existing camelCase shape; PostgreSQL uses snake_case.*

const buildMemberView = (memberRows, membershipRows, paymentRows) => {
  const cyclesByMember = new Map();

  const cycleById = new Map();

  for (const cycle of membershipRows) {
    if (!cyclesByMember.has(cycle.member_id))
      cyclesByMember.set(cycle.member_id, []);

    cyclesByMember.get(cycle.member_id).push(cycle);

    cycleById.set(cycle.id, cycle);
  }

  const paymentsByMember = new Map();

  for (const payment of paymentRows) {
    const cycle = cycleById.get(payment.membership_id);

    if (!cycle) continue;

    if (!paymentsByMember.has(payment.member_id))
      paymentsByMember.set(payment.member_id, []);

    paymentsByMember.get(payment.member_id).push({
      id: payment.id,

      amount: Number(payment.amount),

      date: payment.payment_date,

      mode: payment.payment_mode,

      type: payment.payment_type,

      membershipMonths: cycle.duration_months,

      cycleId: payment.membership_id,
    });
  }

  return memberRows.map((row) => {
    const cycles = (cyclesByMember.get(row.id) || []).sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );

    const current = cycles.at(-1);

    const joining =
      cycles.find((cycle) => cycle.renewal_start_type === "joining") ||
      cycles[0];

    return {
      id: row.id,

      name: row.name,

      mobileNumber: row.mobile_number,

      email: row.email || "",

      joiningDate: joining?.start_date || row.created_at.slice(0, 10),

      membership: current?.plan_name || "—",

      planId: current?.plan_id || null,

      membershipMonths: current?.duration_months || 1,

      membershipFee: Number(current?.fee || 0),

      expiryDate: current?.expiry_date || "",

      currentCycleId: current?.id || null,

      payments: paymentsByMember.get(row.id) || [],
    };
  });
};

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

// `onSubmit` returns an error string to display, or null on success.*

const MemberForm = ({ mode, initialValues, onSubmit, onClose, plans }) => {
  const isEdit = mode === "edit";

  const [form, bind, setForm] = useForm(initialValues);

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  // When adding, the fee follows the selected membership and duration*

  // (the owner can still adjust it afterwards).*

  const handlePlanChange = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => {
      const next = { ...current, [field]: value };

      return isEdit
        ? next
        : {
            ...next,

            membershipFee: String(
              getPlanFee(plans, next.membership, Number(next.membershipMonths)),
            ),
          };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    const mobileNumber = form.mobileNumber.trim();

    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");

      return;
    }

    if (!form.name.trim()) {
      setError("Enter the member's name.");

      return;
    }

    if (!isEdit && Number(form.membershipFee) <= 0) {
      setError("Membership fee must be greater than zero.");

      return;
    }

    setSaving(true);

    try {
      const result = await onSubmit({
        ...form,

        name: form.name.trim(),

        mobileNumber,

        email: form.email.trim(),

        membershipMonths: Number(form.membershipMonths),

        membershipFee: Number(form.membershipFee) || 0,
      });

      if (result) setError(result);
    } catch (err) {
      setError(err.message || "Unable to save member.");
    } finally {
      setSaving(false);
    }
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
            {isEdit && !plans.some((plan) => plan.name === form.membership) && (
              <option value={form.membership}>
                {form.membership} (previous plan)
              </option>
            )}

            {plans.map((plan) => (
              <option key={plan.id} value={plan.name}>
                {plan.name}
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

        <button
          type="submit"
          disabled={saving}
          className={styles.modalSubmitBtn}
        >
          {saving
            ? "Saving..."
            : isEdit
              ? "Save Changes"
              : `Collect ${formatCurrency(Number(form.membershipFee) || 0)} & Add Member`}
        </button>
      </form>
    </Modal>
  );
};

// Renewal always collects the full fee, so the payment is recorded automatically.*

const RenewForm = ({ member, onSubmit, onClose, plans }) => {
  const hasActivePlan = plans.some(
    (plan) => plan.id === member.planId || plan.name === member.membership,
  );

  const [form, bind, setForm] = useForm({
    months: String(member.membershipMonths),

    fee: String(
      getPlanFee(
        plans,
        member.membership,
        member.membershipMonths,
        member.planId,
      ),
    ),

    date: toISODate(new Date()),

    mode: "Cash",
  });

  // Only used when the membership has already expired: "old" | "payment"*

  const [startFrom, setStartFrom] = useState("payment");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // Fee follows the selected duration (the owner can still adjust it).*

  const handleMonthsChange = (event) => {
    const months = event.target.value;

    setForm((current) => ({
      ...current,

      months,

      fee: String(
        getPlanFee(plans, member.membership, Number(months), member.planId),
      ),
    }));
  };

  const fee = Number(form.fee) || 0;

  const isExpired = Boolean(form.date) && member.expiryDate < form.date;

  // Active members always extend from their current due date.*

  // Expired members: the owner chooses the old due date or the payment date.*

  const startDate =
    isExpired && startFrom === "payment" ? form.date : member.expiryDate;

  const newExpiry = form.date
    ? addMonths(startDate, Number(form.months))
    : null;

  const stillExpired = Boolean(newExpiry) && newExpiry < form.date;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!hasActivePlan) {
      setError(
        "This plan is no longer active. Select an active plan for the member before renewing.",
      );

      return;
    }

    if (fee <= 0 || !form.date || !startDate || !newExpiry) {
      setError("Enter a valid renewal date and fee.");

      return;
    }

    setSaving(true);

    try {
      const result = await onSubmit({
        months: Number(form.months),

        fee,

        date: form.date,

        mode: form.mode,

        startDate,

        renewalStartType: isExpired
          ? startFrom === "payment"
            ? "payment_date"
            : "old_expiry"
          : "old_expiry",
      });

      if (result) setError(result);
    } catch (err) {
      setError(err.message || "Unable to renew membership.");
    } finally {
      setSaving(false);
    }
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
                  startFrom === "old"
                    ? styles.choiceBtnActive
                    : styles.choiceBtn
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

        {!hasActivePlan && (
          <FormError message="This plan is no longer active. Edit the member to select an active plan before renewing." />
        )}

        <FormError message={error} />

        <button
          type="submit"
          disabled={saving || !hasActivePlan}
          className={styles.modalSubmitBtn}
        >
          {saving ? (
            "Saving..."
          ) : (
            <>Collect {formatCurrency(fee)} &amp; Renew</>
          )}
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

  // Newest first*

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

        <button
          className={styles.renewMemberBtn}
          onClick={onRenew}
          disabled={!member.currentCycleId}
        >
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
  const [members, setMembers] = useState([]);

  const [plans, setPlans] = useState([]);

  const [organizationId, setOrganizationId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState("");

  const [actionError, setActionError] = useState("");

  const [searchValue, setSearchValue] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("All");

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);

  const [activeModal, setActiveModal] = useState(null);

  const fetchMembers = useCallback(async (orgId) => {
    // Separate queries avoid ambiguous joins from our composite foreign keys.*

    const [memberResult, membershipResult, paymentResult] = await Promise.all([
      supabase
        .from("members")

        .select("id, name, mobile_number, email, created_at")

        .eq("organization_id", orgId)

        .order("created_at", { ascending: false }),

      supabase
        .from("memberships")

        .select(
          "id, member_id, plan_id, plan_name, duration_months, fee, start_date, expiry_date, renewal_start_type, created_at",
        )

        .eq("organization_id", orgId),

      supabase
        .from("payments")

        .select(
          "id, member_id, membership_id, amount, payment_date, payment_mode, payment_type",
        )

        .eq("organization_id", orgId),
    ]);

    const error =
      memberResult.error || membershipResult.error || paymentResult.error;

    if (error) throw error;

    setMembers(
      buildMemberView(
        memberResult.data || [],

        membershipResult.data || [],

        paymentResult.data || [],
      ),
    );

    setFetchError("");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) throw new Error("Please log in again.");

        const { data: org, error: orgError } = await supabase

          .from("organizations")

          .select("id")

          .eq("owner_id", userData.user.id)

          .single();

        if (orgError) throw orgError;

        if (cancelled) return;

        setOrganizationId(org.id);

        const { data: planData, error: planError } = await supabase

          .from("membership_plans")

          .select("id, name, monthly_price, duration_prices, is_active")

          .eq("organization_id", org.id)

          .eq("is_active", true)

          .order("name");

        if (planError) throw planError;

        if (cancelled) return;

        setPlans(planData || []);

        await fetchMembers(org.id);
      } catch (err) {
        if (!cancelled) setFetchError(err.message || "Unable to load members.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchMembers]);

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

  const memberCounts = useMemo(
    () => ({
      total: membersWithStatus.length,
      active: membersWithStatus.filter((member) => member.status === "Active")
        .length,
      expiring: membersWithStatus.filter(
        (member) => member.status === "Expiring",
      ).length,
      expired: membersWithStatus.filter((member) => member.status === "Expired")
        .length,
    }),
    [membersWithStatus],
  );

  const selectedMember = membersWithStatus.find(
    (member) => member.id === selectedId,
  );

  const isDuplicateMobile = (mobileNumber, ignoreId) =>
    members.some(
      (member) =>
        member.id !== ignoreId && member.mobileNumber === mobileNumber,
    );

  const closeModal = () => setActiveModal(null);

  const showDatabaseError = (error) =>
    error?.code === "23505"
      ? "This mobile number is already registered for your business."
      : error?.message || "Database operation failed.";

  // A new member creates three linked records. On failure, attempt cleanup.*

  const handleAddMember = async (values) => {
    if (!organizationId)
      return "Your organization is still loading. Please retry.";

    const selectedPlan = plans.find((plan) => plan.name === values.membership);

    if (!selectedPlan)
      return "Select an active membership plan before adding a member.";

    if (isDuplicateMobile(values.mobileNumber)) {
      return "A member with this mobile number already exists.";
    }

    const { data: member, error: memberError } = await supabase

      .from("members")

      .insert({
        organization_id: organizationId,

        name: values.name,

        mobile_number: values.mobileNumber,

        email: values.email || null,
      })

      .select("id")

      .single();

    if (memberError) return showDatabaseError(memberError);

    const { data: membership, error: membershipError } = await supabase

      .from("memberships")

      .insert({
        organization_id: organizationId,

        member_id: member.id,

        plan_id: selectedPlan.id,

        plan_name: values.membership,

        duration_months: values.membershipMonths,

        fee: values.membershipFee,

        start_date: values.joiningDate,

        expiry_date: addMonths(values.joiningDate, values.membershipMonths),

        renewal_start_type: "joining",
      })

      .select("id")

      .single();

    if (membershipError) {
      const { error: rollbackError } = await supabase
        .from("members")

        .delete()
        .eq("id", member.id)
        .eq("organization_id", organizationId);

      return rollbackError
        ? `Membership could not be saved: ${membershipError.message}. Cleanup also failed; check Supabase before retrying.`
        : showDatabaseError(membershipError);
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      organization_id: organizationId,

      member_id: member.id,

      membership_id: membership.id,

      amount: values.membershipFee,

      payment_date: values.joiningDate,

      payment_mode: values.paymentMode,

      payment_type: "Joining",
    });

    if (paymentError) {
      const { error: rollbackError } = await supabase
        .from("members")

        .delete()
        .eq("id", member.id)
        .eq("organization_id", organizationId);

      return rollbackError
        ? `Payment could not be saved: ${paymentError.message}. Cleanup also failed; check Supabase before retrying.`
        : showDatabaseError(paymentError);
    }

    closeModal();

    try {
      await fetchMembers(organizationId);
    } catch (err) {
      setFetchError(err.message);
    }

    return null;
  };

  const handleEditMember = async (values) => {
    if (!organizationId || !selectedMember) return "No member selected.";

    if (isDuplicateMobile(values.mobileNumber, selectedId)) {
      return "Another member already uses this mobile number.";
    }

    const { error } = await supabase
      .from("members")
      .update({
        name: values.name,

        mobile_number: values.mobileNumber,

        email: values.email || null,
      })
      .eq("id", selectedId)
      .eq("organization_id", organizationId);

    if (error) return showDatabaseError(error);

    // Preserve the original UI's ability to change the current plan label.*

    if (
      selectedMember.currentCycleId &&
      values.membership !== selectedMember.membership
    ) {
      const { error: planError } = await supabase
        .from("memberships")

        .update({
          plan_name: values.membership,

          plan_id:
            plans.find((plan) => plan.name === values.membership)?.id ?? null,
        })

        .eq("id", selectedMember.currentCycleId)

        .eq("organization_id", organizationId);

      if (planError) {
        try {
          await fetchMembers(organizationId);
        } catch {
          /* Show edit error below. */
        }

        return `Contact details were saved, but the plan could not be changed: ${planError.message}`;
      }
    }

    closeModal();

    setSelectedId(null);

    try {
      await fetchMembers(organizationId);
    } catch (err) {
      setFetchError(err.message);
    }

    return null;
  };

  const handleDeleteMember = async () => {
    if (!selectedMember || !organizationId) return;

    if (!window.confirm(`Delete ${selectedMember.name}? This can't be undone.`))
      return;

    setActionError("");

    const { error } = await supabase
      .from("members")

      .delete()
      .eq("id", selectedId)
      .eq("organization_id", organizationId);

    if (error) {
      setActionError(showDatabaseError(error));

      return;
    }

    setSelectedId(null);

    setActiveModal(null);

    try {
      await fetchMembers(organizationId);
    } catch (err) {
      setFetchError(err.message);
    }
  };

  const handleRenew = async ({
    months,
    fee,
    date,
    mode,
    startDate,
    renewalStartType,
  }) => {
    if (!organizationId || !selectedMember?.currentCycleId)
      return "No active membership period found.";

    const selectedPlan = plans.find(
      (plan) =>
        plan.id === selectedMember.planId ||
        plan.name === selectedMember.membership,
    );

    if (!selectedPlan)
      return "This membership plan is inactive. Edit the member to choose an active plan first.";

    const { data: membership, error: membershipError } = await supabase

      .from("memberships")

      .insert({
        organization_id: organizationId,

        member_id: selectedMember.id,

        plan_id: selectedPlan.id,

        plan_name: selectedPlan.name,

        duration_months: months,

        fee,

        start_date: startDate,

        expiry_date: addMonths(startDate, months),

        previous_expiry_date: selectedMember.expiryDate,

        renewal_start_type: renewalStartType,
      })

      .select("id")

      .single();

    if (membershipError) return showDatabaseError(membershipError);

    const { error: paymentError } = await supabase.from("payments").insert({
      organization_id: organizationId,

      member_id: selectedMember.id,

      membership_id: membership.id,

      amount: fee,

      payment_date: date,

      payment_mode: mode,

      payment_type: "Renewal",
    });

    if (paymentError) {
      const { error: rollbackError } = await supabase
        .from("memberships")

        .delete()
        .eq("id", membership.id)
        .eq("organization_id", organizationId);

      return rollbackError
        ? `Payment failed: ${paymentError.message}. Cleanup also failed; check Supabase before retrying.`
        : showDatabaseError(paymentError);
    }

    closeModal();

    setSelectedId(null);

    try {
      await fetchMembers(organizationId);
    } catch (err) {
      setFetchError(err.message);
    }

    return null;
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
          <span className={styles.pageEyebrow}>
            <Sparkles size={14} /> MEMBER DIRECTORY
          </span>
          <h1>Members</h1>
          <p>Manage your community, memberships, and upcoming renewals.</p>
        </div>
        <button
          type="button"
          disabled={loading || !organizationId || plans.length === 0}
          className={styles.addMemberBtn}
          onClick={() => setActiveModal("add")}
        >
          <Plus size={18} /> Add Member
        </button>
      </div>

      <section className={styles.memberStats} aria-label="Member statistics">
        <div className={`${styles.memberStatCard} ${styles.statTotal}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <Users size={20} />
            </span>
            <ArrowUpRight size={17} />
          </div>
          <span className={styles.statLabel}>Total members</span>
          <strong>{memberCounts.total}</strong>
          <small>Registered in your business</small>
        </div>
        <div className={`${styles.memberStatCard} ${styles.statActive}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <UserRoundCheck size={20} />
            </span>
            <ArrowUpRight size={17} />
          </div>
          <span className={styles.statLabel}>Active members</span>
          <strong>{memberCounts.active}</strong>
          <small>Memberships in good standing</small>
        </div>
        <div className={`${styles.memberStatCard} ${styles.statExpiring}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <Clock3 size={20} />
            </span>
            <ArrowUpRight size={17} />
          </div>
          <span className={styles.statLabel}>Expiring soon</span>
          <strong>{memberCounts.expiring}</strong>
          <small>Within the next 7 days</small>
        </div>
        <div className={`${styles.memberStatCard} ${styles.statExpired}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <UserRoundX size={20} />
            </span>
            <ArrowUpRight size={17} />
          </div>
          <span className={styles.statLabel}>Expired</span>
          <strong>{memberCounts.expired}</strong>
          <small>Memberships needing renewal</small>
        </div>
      </section>

      <section className={styles.directoryPanel} aria-label="Member directory">
        <div className={styles.directoryHeading}>
          <div>
            <span className={styles.directoryEyebrow}>YOUR COMMUNITY</span>
            <h2>Member directory</h2>
            <p>
              {filteredMembers.length}{" "}
              {filteredMembers.length === 1 ? "member" : "members"} shown
            </p>
          </div>
        </div>

        <div className={styles.membersToolbar}>
          <div className={styles.memberSearch}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name or mobile..."
              aria-label="Search members"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
          <div className={styles.memberFilter} ref={filterRef}>
            <button
              type="button"
              className={styles.memberFilterBtn}
              aria-haspopup="true"
              aria-expanded={isFilterOpen}
              onClick={() => setIsFilterOpen((open) => !open)}
            >
              <Filter size={18} />
              {selectedStatus === "All" ? "All statuses" : selectedStatus}
            </button>
            {isFilterOpen && (
              <div className={styles.filterMenu}>
                {STATUS_FILTERS.map((status) => (
                  <button
                    type="button"
                    key={status}
                    aria-pressed={selectedStatus === status}
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

        {loading && (
          <p role="status" className={styles.loadingMessage}>
            Loading members...
          </p>
        )}
        {!loading && !fetchError && plans.length === 0 && (
          <p role="status" className={styles.loadingMessage}>
            Create an active membership plan on the Memberships page before
            adding members.
          </p>
        )}
        {fetchError && (
          <p role="alert" className={styles.formError}>
            {fetchError}{" "}
            <button
              type="button"
              onClick={() => {
                if (!organizationId) {
                  window.location.reload();
                  return;
                }
                setFetchError("");
                fetchMembers(organizationId).catch((err) =>
                  setFetchError(err.message),
                );
              }}
            >
              Retry
            </button>
          </p>
        )}
        {actionError && (
          <p role="alert" className={styles.formError}>
            {actionError}
          </p>
        )}

        <div className={styles.membersTableWrapper}>
          <table className={styles.membersTable}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership</th>
                <th>Status</th>
                <th>Expiry</th>
                <th aria-label="View details"></th>
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
                  aria-label={`View ${member.name}'s details`}
                >
                  <td>
                    <div className={styles.tableMember}>
                      <span className={styles.tableAvatar}>
                        {getInitials(member.name)}
                      </span>
                      <div>
                        <strong>{member.name}</strong>
                        <small>{member.mobileNumber}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.planPill}>{member.membership}</span>
                  </td>
                  <td>
                    <StatusBadge status={member.status} />
                  </td>
                  <td>{formatDate(member.expiryDate)}</td>
                  <td>
                    <ArrowUpRight size={16} className={styles.rowArrow} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.membersMobileList}>
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={styles.memberMobileCard}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(member.id)}
              onKeyDown={(event) => handleRowKeyDown(event, member.id)}
              aria-label={`View ${member.name}'s details`}
            >
              <div className={styles.memberAvatar}>
                {getInitials(member.name)}
              </div>
              <div className={styles.memberMobileInfo}>
                <strong>{member.name}</strong>
                <p>
                  {member.membership} · {member.mobileNumber}
                </p>
              </div>
              <div className={styles.memberMobileDetails}>
                <StatusBadge status={member.status} />
                <span className={styles.memberMobileExpiry}>
                  Expires {formatDate(member.expiryDate)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!loading && !fetchError && filteredMembers.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={26} />
            <strong>
              {members.length === 0
                ? "Your member directory is empty"
                : "No matching members"}
            </strong>
            <p>
              {members.length === 0
                ? "Add your first member to start managing memberships."
                : "Try a different search or status filter."}
            </p>
          </div>
        )}
      </section>

      {/* MODALS */}

      {activeModal === "add" && (
        <MemberForm
          mode="add"
          initialValues={{
            name: "",

            mobileNumber: "",

            email: "",

            joiningDate: toISODate(new Date()),

            membership: plans[0]?.name || "",

            membershipMonths: "1",

            membershipFee: String(
              plans.length ? getPlanFee(plans, plans[0].name, 1) : 0,
            ),

            paymentMode: PAYMENT_MODES[0],
          }}
          onSubmit={handleAddMember}
          onClose={closeModal}
          plans={plans}
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
          plans={plans}
        />
      )}

      {selectedMember && activeModal === "renew" && (
        <RenewForm
          member={selectedMember}
          onSubmit={handleRenew}
          onClose={closeModal}
          plans={plans}
        />
      )}
    </main>
  );
};

export default Members;
