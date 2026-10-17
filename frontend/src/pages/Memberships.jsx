import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
const fetchAllMemberships = async () => {
  const rows = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("memberships")
      .select("id, member_id, plan_id, plan_name, expiry_date, created_at")
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
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!userData.user) throw new Error("Please log in again.");

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", userData.user.id)
        .single();
      if (orgError) throw orgError;
      setOrganizationId(organization.id);

      const { data: planRows, error: plansError } = await supabase
        .from("membership_plans")
        .select("id, name, description, monthly_price, duration_prices, is_active")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: true });
      if (plansError) throw plansError;

      const memberships = await fetchAllMemberships();
      setPlans(planRows ?? []);
      setMembershipRecords(memberships);
    } catch (err) {
      setError(err.message || "Unable to load membership plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

  const totalMembers = useMemo(() => {
    const today = todayISO();
    return latestMemberships.filter((membership) => membership.expiry_date >= today)
      .length;
  }, [latestMemberships]);

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
      Object.fromEntries(plan.prices.map(({ months, price }) => [months, String(price)])),
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
        : await supabase.from("membership_plans").insert(payload).select("id").single();

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
      <div className={styles.header}>
        <div>
          <h1>Memberships</h1>
          <p>Create and manage membership plans for your business.</p>
        </div>
        <button className={styles.primaryBtn} onClick={openAddModal} disabled={loading || !organizationId}>
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      {error && (
        <div role="alert" className={styles.emptyState}>
          <p>{error}</p>
          <button type="button" onClick={loadData}>Retry</button>
        </div>
      )}

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>Total Plans</span>
          <strong>{plans.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Active Memberships</span>
          <strong>{totalMembers}</strong>
        </div>
      </section>

      {loading ? (
        <div className={styles.emptyState}>Loading membership plans...</div>
      ) : (
        <>
          <section className={styles.planGrid}>
            {plansWithCounts.map((plan) => (
              <article key={plan.id} className={styles.planCard}>
                <div className={styles.planHeader}>
                  <div>
                    <h2>{plan.name}</h2>
                    <p>{plan.description}</p>
                  </div>
                  <div className={styles.cardActions}>
                    <button type="button" aria-label={`Edit ${plan.name}`} onClick={() => openEditModal(plan)}>
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${plan.name}`}
                      disabled={deletingId === plan.id}
                      onClick={() => deletePlan(plan)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className={styles.memberCount}>
                  {plan.activeMembers} active members
                </div>
                <div className={styles.priceList}>
                  {plan.prices.map((price) => (
                    <div key={price.months} className={styles.priceRow}>
                      <span>{formatDuration(price.months)}</span>
                      <strong>{formatCurrency(price.price)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
          {!error && plans.length === 0 && (
            <div className={styles.emptyState}>
              No membership plans yet. Add your first plan.
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
            <div className={styles.modalHeader}>
              <h2 id="plan-modal-title">{editingId ? "Edit Plan" : "Add Membership Plan"}</h2>
              <button type="button" aria-label="Close" disabled={saving} onClick={closeModal}>×</button>
            </div>
            <form onSubmit={savePlan}>
              <label>
                Plan Name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Standard" required maxLength={100} />
              </label>
              <label>
                Description
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" rows={3} />
              </label>
              {DURATIONS.map((months) => (
                <label key={months}>
                  {formatDuration(months)} Price (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={prices[months]}
                    onChange={(event) =>
                      setPrices((current) => ({ ...current, [months]: event.target.value }))
                    }
                    placeholder={`Price for ${formatDuration(months).toLowerCase()}`}
                    required
                  />
                </label>
              ))}
              {formError && <p role="alert" style={{ color: "var(--error, #b91c1c)" }}>{formError}</p>}
              <button className={styles.submitBtn} type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Memberships;
