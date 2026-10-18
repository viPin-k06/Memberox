import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Layers3,
  UsersRound,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  X,
  Check,
  BadgeIndianRupee,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import styles from "./Memberships.module.css";

const DURATIONS = [1, 3, 6, 12];

const EMPTY_PRICES = { 1: "", 3: "", 6: "", 12: "" };

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDuration = (months) =>
  months === 12 ? "1 Year" : `${months} ${months === 1 ? "Month" : "Months"}`;

const todayISO = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Supabase returns at most 1,000 rows per request by default. Paginate so

// the active membership counts don't silently ignore older records.

const fetchAllMemberships = async (organizationId) => {
  const rows = [];

  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase

      .from("memberships")

      .select("id, member_id, plan_id, plan_name, expiry_date, created_at")

      .eq("organization_id", organizationId)

      .order("created_at", { ascending: false })

      .order("id", { ascending: false })

      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) break;
  }

  return rows;
};

const Memberships = () => {
  const [organizationId, setOrganizationId] = useState(null);

  const [plans, setPlans] = useState([]);

  const [membershipRecords, setMembershipRecords] = useState([]);

  const [totalMembers, setTotalMembers] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [prices, setPrices] = useState({ ...EMPTY_PRICES });

  const loadData = useCallback(async () => {
    setLoading(true);

    setError("");

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!userData.user) throw new Error("Please log in again.");

      const { data: organization, error: orgError } = await supabase

        .from("organizations")

        .select("id")

        .eq("owner_id", userData.user.id)

        .single();

      if (orgError) throw orgError;

      setOrganizationId(organization.id);

      // Count registered members, including those without a membership.
      const { count: memberCount, error: membersError } = await supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      if (membersError) throw membersError;
      setTotalMembers(memberCount ?? 0);

      const { data: planRows, error: plansError } = await supabase

        .from("membership_plans")

        .select(
          "id, name, description, monthly_price, duration_prices, is_active",
        )

        .eq("organization_id", organization.id)

        .order("created_at", { ascending: true });

      if (plansError) throw plansError;

      const memberships = await fetchAllMemberships(organization.id);

      setPlans(planRows ?? []);

      setMembershipRecords(memberships);
    } catch (err) {
      setError(err.message || "Unable to load membership plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching page data when the component mounts is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Each renewal creates a new membership row. Count only the newest period

  // for each member, not every historical membership row.

  const latestMemberships = useMemo(() => {
    const sorted = [...membershipRecords].sort((a, b) => {
      const dateOrder = (b.created_at ?? "").localeCompare(a.created_at ?? "");

      return dateOrder || b.id.localeCompare(a.id);
    });

    const latest = new Map();

    for (const membership of sorted) {
      if (!latest.has(membership.member_id)) {
        latest.set(membership.member_id, membership);
      }
    }

    return [...latest.values()];
  }, [membershipRecords]);

  const plansWithCounts = useMemo(() => {
    const today = todayISO();

    return plans.map((plan) => {
      const activeMembers = latestMemberships.filter((membership) => {
        if (membership.expiry_date < today) return false;

        // Legacy membership records may have no plan_id because the Members

        // page originally stored only the plan name.

        return membership.plan_id
          ? membership.plan_id === plan.id
          : membership.plan_name?.toLowerCase() === plan.name.toLowerCase();
      }).length;

      return {
        ...plan,

        activeMembers,

        prices: DURATIONS.map((months) => ({
          months,

          price: Number(
            months === 1
              ? plan.monthly_price
              : (plan.duration_prices?.[String(months)] ??
                  Number(plan.monthly_price) * months),
          ),
        })),
      };
    });
  }, [plans, latestMemberships]);

  const resetForm = () => {
    setName("");

    setDescription("");

    setPrices({ ...EMPTY_PRICES });

    setEditingId(null);

    setFormError("");
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);

    resetForm();
  };

  const openAddModal = () => {
    resetForm();

    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan.id);

    setName(plan.name);

    setDescription(plan.description ?? "");

    setPrices(
      Object.fromEntries(
        plan.prices.map(({ months, price }) => [months, String(price)]),
      ),
    );

    setFormError("");

    setIsModalOpen(true);
  };

  const savePlan = async (event) => {
    event.preventDefault();

    if (!organizationId || saving) return;

    setFormError("");

    const trimmedName = name.trim();

    const parsedPrices = Object.fromEntries(
      DURATIONS.map((months) => [String(months), Number(prices[months])]),
    );

    if (!trimmedName) {
      setFormError("Enter a plan name.");

      return;
    }

    if (
      DURATIONS.some(
        (months) =>
          String(prices[months]).trim() === "" ||
          !Number.isFinite(parsedPrices[String(months)]) ||
          parsedPrices[String(months)] <= 0,
      )
    ) {
      setFormError("Enter a valid price greater than zero for every duration.");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        organization_id: organizationId,

        name: trimmedName,

        description: description.trim(),

        monthly_price: parsedPrices["1"],

        duration_prices: {
          3: parsedPrices["3"],

          6: parsedPrices["6"],

          12: parsedPrices["12"],
        },
      };

      const result = editingId
        ? await supabase

            .from("membership_plans")

            .update(payload)

            .eq("id", editingId)

            .eq("organization_id", organizationId)

            .select("id")

            .single()
        : await supabase

            .from("membership_plans")

            .insert(payload)

            .select("id")

            .single();

      if (result.error) throw result.error;

      setIsModalOpen(false);

      resetForm();

      await loadData();
    } catch (err) {
      setFormError(
        err.code === "23505"
          ? "A plan with this name already exists for your business."
          : err.message || "Could not save the plan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (plan) => {
    if (deletingId) return;

    // Don't delete a plan with historical memberships. Keeping the plan

    // preserves its identity and avoids confusing historical reports.

    const hasHistory = membershipRecords.some(
      (membership) =>
        membership.plan_id === plan.id ||
        (!membership.plan_id &&
          membership.plan_name?.toLowerCase() === plan.name.toLowerCase()),
    );

    if (hasHistory) {
      window.alert(
        "This plan has membership history and cannot be deleted. Edit it instead.",
      );

      return;
    }

    if (!window.confirm(`Delete the ${plan.name} membership plan?`)) return;

    setDeletingId(plan.id);

    setError("");

    try {
      const { error: deleteError } = await supabase

        .from("membership_plans")

        .delete()

        .eq("id", plan.id)

        .eq("organization_id", organizationId);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete the plan.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} />
            PLAN MANAGEMENT
          </div>

          <h1>Memberships</h1>

          <p>Create flexible membership plans and keep pricing organized.</p>
        </div>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openAddModal}
          disabled={loading || !organizationId}
        >
          <Plus size={18} />
          Add Plan
        </button>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>

          <button type="button" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      <section className={styles.stats} aria-label="Membership overview">
        <article className={`${styles.statCard} ${styles.plansStat}`}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <Layers3 size={21} />
            </div>

            <ArrowUpRight size={18} className={styles.statArrow} />
          </div>

          <span>Total plans</span>

          <strong>{loading ? "—" : plans.length}</strong>

          <small>Membership options available</small>
        </article>

        <article className={`${styles.statCard} ${styles.membersStat}`}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <UsersRound size={21} />
            </div>

            <ArrowUpRight size={18} className={styles.statArrow} />
          </div>

          <span>Total members</span>

          <strong>{loading ? "—" : totalMembers}</strong>

          <small>Registered members in your business</small>
        </article>
      </section>

      <section className={styles.plansSection} aria-labelledby="plans-heading">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>YOUR OFFERINGS</span>

            <h2 id="plans-heading">Membership plans</h2>

            <p>Choose a plan to review its pricing or make changes.</p>
          </div>

          <span className={styles.planTotal}>
            {loading
              ? "Loading…"
              : `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`}
          </span>
        </div>

        {loading ? (
          <div className={styles.emptyState} role="status">
            Loading membership plans...
          </div>
        ) : plansWithCounts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Layers3 size={26} />
            </div>

            <h3>No plans created yet</h3>

            <p>
              Start by adding a plan with your preferred durations and prices.
            </p>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={openAddModal}
            >
              <Plus size={17} /> Create your first plan
            </button>
          </div>
        ) : (
          <div className={styles.planGrid}>
            {plansWithCounts.map((plan) => (
              <article key={plan.id} className={styles.planCard}>
                <div className={styles.planAccent} />

                <div className={styles.planHeader}>
                  <div className={styles.planIdentity}>
                    <div className={styles.planIcon}>
                      <Layers3 size={21} />
                    </div>

                    <div>
                      <span className={styles.planTag}>MEMBERSHIP PLAN</span>

                      <h3>{plan.name}</h3>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      aria-label={`Edit ${plan.name}`}
                      title={`Edit ${plan.name}`}
                      onClick={() => openEditModal(plan)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      className={styles.deleteBtn}
                      aria-label={`Delete ${plan.name}`}
                      title={`Delete ${plan.name}`}
                      disabled={deletingId === plan.id}
                      onClick={() => deletePlan(plan)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {plan.description && (
                  <p className={styles.planDescription}>{plan.description}</p>
                )}

                <div className={styles.memberCount}>
                  <div className={styles.memberCountIcon}>
                    <UsersRound size={16} />
                  </div>

                  <strong>{plan.activeMembers}</strong>

                  <span>
                    {plan.activeMembers === 1
                      ? "active member"
                      : "active members"}
                  </span>
                </div>

                <div className={styles.pricingHeading}>
                  <span>
                    <CalendarDays size={15} /> Duration
                  </span>

                  <span>
                    <BadgeIndianRupee size={15} /> Price
                  </span>
                </div>

                <div className={styles.priceList}>
                  {plan.prices.map((price) => (
                    <div key={price.months} className={styles.priceRow}>
                      <span>{formatDuration(price.months)}</span>

                      <strong>{formatCurrency(price.price)}</strong>
                    </div>
                  ))}
                </div>

                <div className={styles.planFooter}>
                  <span>
                    <Check size={14} /> Flexible durations
                  </span>

                  <button type="button" onClick={() => openEditModal(plan)}>
                    Edit plan <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.sectionEyebrow}>
                  {editingId ? "UPDATE YOUR OFFERING" : "CREATE AN OFFERING"}
                </span>

                <h2 id="plan-modal-title">
                  {editingId ? "Edit membership plan" : "Add membership plan"}
                </h2>

                <p>Set your plan details and prices for each duration.</p>
              </div>

              <button
                type="button"
                className={styles.closeBtn}
                aria-label="Close"
                disabled={saving}
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={savePlan}>
              <label>
                Plan name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Standard"
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Description <span className={styles.optional}>(optional)</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What does this plan include?"
                  rows={3}
                />
              </label>

              <div className={styles.formSectionTitle}>
                <BadgeIndianRupee size={17} />
                Duration pricing
              </div>

              <div className={styles.priceInputs}>
                {DURATIONS.map((months) => (
                  <label key={months}>
                    {formatDuration(months)} (₹)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={prices[months]}
                      onChange={(event) =>
                        setPrices((current) => ({
                          ...current,

                          [months]: event.target.value,
                        }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </label>
                ))}
              </div>

              {formError && (
                <p role="alert" className={styles.formError}>
                  {formError}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className={styles.submitBtn}
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Memberships;
