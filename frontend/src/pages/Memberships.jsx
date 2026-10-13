import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import styles from "./Memberships.module.css";

const INITIAL_PLANS = [
  {
    id: 1,
    name: "Basic",
    description: "Simple monthly membership for regular gym access.",
    prices: [
      { months: 1, price: 999 },
      { months: 3, price: 2899 },
      { months: 6, price: 5499 },
      { months: 12, price: 9999 },
    ],
    activeMembers: 42,
  },
  {
    id: 2,
    name: "Premium",
    description: "Premium membership with access to all gym facilities.",
    prices: [
      { months: 1, price: 899 },
      { months: 3, price: 2499 },
      { months: 6, price: 4999 },
      { months: 12, price: 8999 },
    ],
    activeMembers: 68,
  },
];

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const formatDuration = (months) =>
  months === 12 ? "1 Year" : `${months} ${months === 1 ? "Month" : "Months"}`;

const Memberships = () => {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  const totalMembers = useMemo(
    () => plans.reduce((total, plan) => total + plan.activeMembers, 0),
    [plans],
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setMonthlyPrice("");
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan.id);
    setName(plan.name);
    setDescription(plan.description);
    setMonthlyPrice(String(plan.prices[0]?.price ?? ""));
    setIsModalOpen(true);
  };

  const savePlan = (event) => {
    event.preventDefault();

    const price = Number(monthlyPrice);
    if (!name.trim() || price <= 0) return;

    if (editingId) {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === editingId
            ? {
                ...plan,
                name: name.trim(),
                description: description.trim(),
                prices: [
                  { months: 1, price },
                  { months: 3, price: price * 3 },
                  { months: 6, price: price * 6 },
                  { months: 12, price: price * 12 },
                ],
              }
            : plan,
        ),
      );
    } else {
      setPlans((current) => [
        ...current,
        {
          id: Date.now(),
          name: name.trim(),
          description: description.trim(),
          activeMembers: 0,
          prices: [
            { months: 1, price },
            { months: 3, price: price * 3 },
            { months: 6, price: price * 6 },
            { months: 12, price: price * 12 },
          ],
        },
      ]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const deletePlan = (id) => {
    if (!window.confirm("Delete this membership plan?")) return;
    setPlans((current) => current.filter((plan) => plan.id !== id));
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Memberships</h1>
          <p>Create and manage membership plans for your gym.</p>
        </div>

        <button className={styles.primaryBtn} onClick={openAddModal}>
          <Plus size={18} />
          Add Plan
        </button>
      </div>

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

      <section className={styles.planGrid}>
        {plans.map((plan) => (
          <article key={plan.id} className={styles.planCard}>
            <div className={styles.planHeader}>
              <div>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>

              <div className={styles.cardActions}>
                <button
                  aria-label={`Edit ${plan.name}`}
                  onClick={() => openEditModal(plan)}
                >
                  <Pencil size={17} />
                </button>

                <button
                  aria-label={`Delete ${plan.name}`}
                  onClick={() => deletePlan(plan.id)}
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

      {plans.length === 0 && (
        <div className={styles.emptyState}>
          No membership plans yet. Add your first plan.
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? "Edit Plan" : "Add Membership Plan"}</h2>
              <button onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={savePlan}>
              <label>
                Plan Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Standard"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short description"
                  rows="3"
                />
              </label>

              <label>
                Monthly Price
                <input
                  type="number"
                  min="1"
                  value={monthlyPrice}
                  onChange={(event) => setMonthlyPrice(event.target.value)}
                  placeholder="Enter monthly price"
                  required
                />
              </label>

              <button className={styles.submitBtn} type="submit">
                {editingId ? "Save Changes" : "Add Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Memberships;
