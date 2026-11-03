
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/shared";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Health",
  "Entertainment",
  "Other",
];

const CATEGORY_ICONS = {
  Food: "🍽️",
  Transport: "🚗",
  Shopping: "🛍️",
  Bills: "🧾",
  Education: "🎓",
  Health: "💚",
  Entertainment: "🎬",
  Other: "✳️",
};

const SharedExpenses = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [error, setError] = useState("");

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  const [memberEmails, setMemberEmails] = useState({});
  const [addingMember, setAddingMember] = useState({});

  const [settlementAmounts, setSettlementAmounts] = useState({});
  const [settlingExpense, setSettlingExpense] = useState({});
  const [settlementMessage, setSettlementMessage] = useState({});

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const getToken = () => getUser().token;

  const getUserId = () => {
    const user = getUser();
    return (user.id || user._id)?.toString();
  };

  // FIX: Stable authentication function
  const getAuthConfig = useCallback(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, [navigate]);

  // FIX: Stable loadGroups function
  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError("");

    const config = getAuthConfig();

    if (!config) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/groups`, config);
      setGroups(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load groups. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  // FIX: Stable loadExpenses function
  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true);

    const config = getAuthConfig();

    if (!config) {
      setExpensesLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/expenses`, config);
      setExpenses(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load shared expenses."
      );
    } finally {
      setExpensesLoading(false);
    }
  }, [getAuthConfig]);

  // FIX: Correct React Hook dependencies
  useEffect(() => {
    loadGroups();
    loadExpenses();
  }, [loadGroups, loadExpenses]);

  // CREATE GROUP
  const createGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || creating) return;

    const config = getAuthConfig();
    if (!config) return;

    setCreating(true);
    setError("");

    try {
      await axios.post(
        `${API_URL}/groups`,
        {
          name: groupName.trim(),
          description: description.trim(),
        },
        config
      );

      setGroupName("");
      setDescription("");
      await loadGroups();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create the group. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  // CREATE SHARED EXPENSE
  const createSharedExpense = async (e) => {
    e.preventDefault();

    if (
      !expenseTitle.trim() ||
      !totalAmount ||
      !selectedGroup ||
      !paidBy ||
      savingExpense
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const amount = Number(totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const group = groups.find(
      (item) => item._id === selectedGroup
    );

    if (!group || !group.members?.length) {
      setError("Select a group that has members.");
      return;
    }

    const currentUserId = getUserId();

    if (
      !currentUserId ||
      !group.members.some(
        (member) => member._id?.toString() === currentUserId
      )
    ) {
      setError(
        "Your account must be a member of this group to create an expense."
      );
      return;
    }

    const validPayer = group.members.some(
      (member) => member._id?.toString() === paidBy
    );

    if (!validPayer) {
      setError("Select a valid group member as the payer.");
      return;
    }

    const amountInPaise = Math.round(amount * 100);

    const baseShare = Math.floor(
      amountInPaise / group.members.length
    );

    const remainder = amountInPaise % group.members.length;

    const splits = group.members.map((member, index) => ({
      userId: member._id,
      amountOwed:
        (baseShare + (index < remainder ? 1 : 0)) / 100,
    }));

    const config = getAuthConfig();
    if (!config) return;

    setSavingExpense(true);
    setError("");

    try {
      await axios.post(
        `${API_URL}/expenses`,
        {
          title: expenseTitle.trim(),
          totalAmount: amountInPaise / 100,
          category: expenseCategory,
          paidBy,
          groupId: selectedGroup,
          splits,
        },
        config
      );

      setExpenseTitle("");
      setTotalAmount("");
      setExpenseCategory("Food");
      setSelectedGroup("");
      setPaidBy("");

      await loadExpenses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create the shared expense. Please try again."
      );
    } finally {
      setSavingExpense(false);
    }
  };

  // ADD GROUP MEMBER
  const addMember = async (e, groupId) => {
    e.preventDefault();

    const email = (memberEmails[groupId] || "")
      .trim()
      .toLowerCase();

    if (!email) {
      setError("Please enter the member's email address.");
      return;
    }

    const config = getAuthConfig();
    if (!config) return;

    setAddingMember((prev) => ({
      ...prev,
      [groupId]: true,
    }));

    setError("");

    try {
      await axios.post(
        `${API_URL}/groups/${groupId}/members`,
        { email },
        config
      );

      setMemberEmails((prev) => ({
        ...prev,
        [groupId]: "",
      }));

      await loadGroups();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not add this member. Please try again."
      );
    } finally {
      setAddingMember((prev) => ({
        ...prev,
        [groupId]: false,
      }));
    }
  };

  // SETTLE EXPENSE
  const settleExpense = async (expense) => {
    const expenseId = expense._id;
    const amount = Number(settlementAmounts[expenseId]);
    const currentUserId = getUserId();

    const mySplit = (expense.splits || []).find((split) => {
      const splitUserId = split.userId?._id || split.userId;
      return splitUserId?.toString() === currentUserId;
    });

    if (!mySplit) {
      setSettlementMessage((prev) => ({
        ...prev,
        [expenseId]: {
          type: "error",
          text: "Your share was not found for this expense.",
        },
      }));
      return;
    }

    const payerId = (
      expense.paidBy?._id || expense.paidBy
    )?.toString();

    if (payerId === currentUserId) {
      setSettlementMessage((prev) => ({
        ...prev,
        [expenseId]: {
          type: "error",
          text: "The payer cannot repay themselves.",
        },
      }));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setSettlementMessage((prev) => ({
        ...prev,
        [expenseId]: {
          type: "error",
          text: "Enter a repayment amount greater than zero.",
        },
      }));
      return;
    }

    const toCents = (value) =>
      Math.round((Number(value) + Number.EPSILON) * 100);

    const remainingCents =
      toCents(mySplit.amountOwed) -
      toCents(mySplit.settledAmount || 0);

    const amountCents = toCents(amount);

    if (amountCents > remainingCents) {
      setSettlementMessage((prev) => ({
        ...prev,
        [expenseId]: {
          type: "error",
          text: `You can repay up to ₹${(
            remainingCents / 100
          ).toLocaleString("en-IN")}.`,
        },
      }));
      return;
    }

    const config = getAuthConfig();
    if (!config) return;

    setSettlingExpense((prev) => ({
      ...prev,
      [expenseId]: true,
    }));

    setSettlementMessage((prev) => ({
      ...prev,
      [expenseId]: null,
    }));

    try {
      const response = await axios.post(
        `${API_URL}/expenses/${expenseId}/settle`,
        { amount: amountCents / 100 },
        config
      );

      setSettlementMessage((prev) => ({
        ...prev,
        [expenseId]: {
          type: "success",
          text:
            response.data.message ||
            "Repayment recorded successfully.",
        },
      }));

      setSettlementAmounts((prev) => ({
        ...prev,
        [expenseId]: "",
      }));

      await loadExpenses();
    } catch (err) {
      setSettlementMessage((prev) => ({
        ...prev,
        [expenseId]: {
          type: "error",
          text:
            err.response?.data?.message ||
            "Could not record repayment. Please try again.",
        },
      }));
    } finally {
      setSettlingExpense((prev) => ({
        ...prev,
        [expenseId]: false,
      }));
    }
  };

  // FORMATTING HELPERS
  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalSharedSpending = expenses.reduce(
    (sum, expense) => sum + (Number(expense.totalAmount) || 0),
    0
  );

  const memberCount = new Set(
    groups.flatMap((group) =>
      (group.members || []).map((member) => member._id)
    )
  ).size;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b100d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-300";

  return (
    <div className="min-h-screen bg-[#080b09] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#07100b]">
              ₹
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Personal Finance
              </p>
              <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">
                Shared Expenses
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300 sm:px-4"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-400/15 bg-[#101713] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/[0.07] blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Shared finances
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Split expenses,
              <span className="block text-emerald-400">
                not friendships.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
              Organise shared bills with friends, roommates, and travel
              groups. Keep everyone's contributions and repayments in one
              place.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#create-group"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#07100b] transition hover:bg-emerald-300"
              >
                <span>+</span> Create a group
              </a>

              <a
                href="#shared-expenses"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/[0.08]"
              >
                View expenses
              </a>
            </div>
          </div>
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 font-bold text-red-300">
              !
            </span>

            <div className="flex-1">
              <p className="font-semibold text-red-300">
                Something went wrong
              </p>
              <p className="mt-1 text-sm text-red-200/80">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="text-gray-500 transition hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#101713] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-400">Your groups</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-xl">
                👥
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-white">
              {loading ? "—" : groups.length}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Groups you can access
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101713] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-400">Group members</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-xl">
                🧑‍🤝‍🧑
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-white">
              {loading ? "—" : memberCount}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Unique members across your groups
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101713] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-400">Shared spending</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-xl">
                ₹
              </span>
            </div>

            <p className="mt-4 break-words text-2xl font-bold text-white sm:text-3xl">
              {expensesLoading
                ? "—"
                : `₹${formatMoney(totalSharedSpending)}`}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Across loaded shared expenses
            </p>
          </div>
        </section>

        {/* CREATE GROUP AND GROUP LIST */}
        <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section
            id="create-group"
            className="scroll-mt-28 rounded-3xl border border-white/[0.08] bg-[#101713] p-6 sm:p-7"
          >
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
                👥
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Create a group
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Start sharing expenses together.
                </p>
              </div>
            </div>

            <form onSubmit={createGroup} className="space-y-5">
              <div>
                <label htmlFor="groupName" className={labelClass}>
                  Group name <span className="text-emerald-400">*</span>
                </label>

                <input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip"
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="groupDescription" className={labelClass}>
                  Description
                  <span className="ml-2 font-normal text-gray-500">
                    Optional
                  </span>
                </label>

                <textarea
                  id="groupDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this group for?"
                  rows={3}
                  maxLength={500}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <button
                type="submit"
                disabled={creating || !groupName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 font-bold text-[#07100b] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                    Creating group...
                  </>
                ) : (
                  <>+ Create group</>
                )}
              </button>
            </form>
          </section>

          {/* GROUP LIST */}
          <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Your groups
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Manage your group members.
                </p>
              </div>

              <button
                type="button"
                onClick={loadGroups}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
                <p className="mt-4 text-sm text-gray-400">
                  Loading your groups...
                </p>
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
                <div className="mb-4 text-4xl">👥</div>
                <h3 className="font-bold text-white">No groups yet</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-400">
                  Create your first group to start organising shared bills.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <article
                    key={group._id}
                    className="rounded-2xl border border-white/[0.07] bg-[#0b100d] p-4 transition hover:border-emerald-400/20 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl">
                        👥
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-bold text-white">
                          {group.name}
                        </h3>

                        <p className="mt-1 text-xs text-emerald-300">
                          {group.members?.length || 0}{" "}
                          {(group.members?.length || 0) === 1
                            ? "member"
                            : "members"}
                        </p>

                        {group.description && (
                          <p className="mt-3 break-words text-sm leading-5 text-gray-400">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Add a member
                      </p>

                      <form
                        onSubmit={(e) => addMember(e, group._id)}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          type="email"
                          value={memberEmails[group._id] || ""}
                          onChange={(e) =>
                            setMemberEmails((prev) => ({
                              ...prev,
                              [group._id]: e.target.value,
                            }))
                          }
                          placeholder="Registered member's email"
                          required
                          className={`${inputClass} min-w-0 flex-1`}
                        />

                        <button
                          type="submit"
                          disabled={!!addingMember[group._id]}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-gray-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300 disabled:opacity-50"
                        >
                          {addingMember[group._id]
                            ? "Adding..."
                            : "Add member"}
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* CREATE SHARED EXPENSE */}
        <section className="mt-8 rounded-3xl border border-white/[0.08] bg-[#101713] p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
              🧾
            </div>
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Create split expense
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Add a bill and divide it equally among group members.
              </p>
            </div>
          </div>

          <form onSubmit={createSharedExpense} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="expenseTitle" className={labelClass}>
                  Expense title <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="expenseTitle"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Dinner with friends"
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="totalAmount" className={labelClass}>
                  Total amount <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center font-bold text-emerald-400">
                    ₹
                  </span>
                  <input
                    id="totalAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="expenseCategory" className={labelClass}>
                  Category
                </label>
                <select
                  id="expenseCategory"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-[#101713]"
                    >
                      {CATEGORY_ICONS[category]} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="selectedGroup" className={labelClass}>
                  Group <span className="text-emerald-400">*</span>
                </label>
                <select
                  id="selectedGroup"
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setPaidBy("");
                  }}
                  required
                  className={inputClass}
                >
                  <option value="" className="bg-[#101713]">
                    Select a group
                  </option>
                  {groups.map((group) => (
                    <option
                      key={group._id}
                      value={group._id}
                      className="bg-[#101713]"
                    >
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="paidBy" className={labelClass}>
                  Paid by <span className="text-emerald-400">*</span>
                </label>
                <select
                  id="paidBy"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  required
                  disabled={!selectedGroup}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="" className="bg-[#101713]">
                    Select the member who paid
                  </option>
                  {groups
                    .find((group) => group._id === selectedGroup)
                    ?.members?.map((member) => (
                      <option
                        key={member._id}
                        value={member._id}
                        className="bg-[#101713]"
                      >
                        {member.name || member.email || "Group member"}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* LIVE SPLIT PREVIEW */}
            {selectedGroup && (
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">
                      Equal split preview
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      The amount will be divided across all group members.
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    {groups.find((group) => group._id === selectedGroup)
                      ?.members?.length || 0}{" "}
                    members
                  </span>
                </div>

                {(() => {
                  const memberTotal =
                    groups.find((group) => group._id === selectedGroup)
                      ?.members?.length || 0;

                  const cents = Math.round(
                    (Number(totalAmount) || 0) * 100
                  );

                  const base = memberTotal
                    ? Math.floor(cents / memberTotal)
                    : 0;

                  const remainder = memberTotal
                    ? cents % memberTotal
                    : 0;

                  return (
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-white/[0.07] pt-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          Approximate share per member
                        </p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          ₹
                          {formatMoney(
                            memberTotal
                              ? (base + (remainder > 0 ? 1 : 0)) / 100
                              : 0
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Final shares are balanced to the nearest paise.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              type="submit"
              disabled={savingExpense || !selectedGroup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 font-bold text-[#07100b] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
            >
              {savingExpense ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                  Saving expense...
                </>
              ) : (
                <>+ Create split expense</>
              )}
            </button>
          </form>
        </section>

        {/* SHARED EXPENSES */}
        <section
          id="shared-expenses"
          className="mt-8 scroll-mt-28 rounded-3xl border border-white/[0.08] bg-[#101713] p-6 sm:p-8"
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Transactions
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Shared expenses
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Track everyone's share and record repayments.
              </p>
            </div>

            <button
              type="button"
              onClick={loadExpenses}
              disabled={expensesLoading}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              {expensesLoading ? "Loading..." : "Refresh expenses"}
            </button>
          </div>

          {expensesLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
              <p className="mt-4 text-sm text-gray-400">
                Loading shared expenses...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
              <div className="mb-4 text-4xl">🧾</div>
              <h3 className="font-bold text-white">
                No shared expenses yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-400">
                Once you create a shared expense, it will appear here with
                individual shares and settlement options.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {expenses.map((expense) => {
                const currentUserId = getUserId();

                const payerId = (
                  expense.paidBy?._id || expense.paidBy
                )?.toString();

                const mySplit = (expense.splits || []).find((split) => {
                  const splitUserId =
                    split.userId?._id || split.userId;
                  return splitUserId?.toString() === currentUserId;
                });

                const remainingCents = mySplit
                  ? Math.max(
                      0,
                      Math.round(
                        Number(mySplit.amountOwed || 0) * 100
                      ) -
                        Math.round(
                          Number(mySplit.settledAmount || 0) * 100
                        )
                    )
                  : 0;

                const canSettle =
                  Boolean(mySplit) &&
                  payerId !== currentUserId &&
                  remainingCents > 0;

                const totalSettled = (expense.splits || []).reduce(
                  (sum, split) =>
                    sum + (Number(split.settledAmount) || 0),
                  0
                );

                const totalOwed = (expense.splits || []).reduce(
                  (sum, split) =>
                    sum + (Number(split.amountOwed) || 0),
                  0
                );

                const settlementPercent = totalOwed
                  ? Math.min((totalSettled / totalOwed) * 100, 100)
                  : 0;

                return (
                  <article
                    key={expense._id}
                    className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b100d]"
                  >
                    {/* EXPENSE HEADER */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl">
                            {CATEGORY_ICONS[expense.category] || "🧾"}
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-bold text-white">
                              {expense.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">
                              {expense.category || "Other"} ·{" "}
                              {formatDate(expense.date || expense.createdAt)}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              Paid by{" "}
                              <span className="font-medium text-gray-300">
                                {expense.paidBy?.name ||
                                  expense.paidBy?.email ||
                                  "Group member"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs text-gray-500">
                            Total expense
                          </p>
                          <p className="mt-1 text-2xl font-bold text-emerald-300">
                            ₹{formatMoney(expense.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {/* SETTLEMENT PROGRESS */}
                      <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-300">
                            Repayment progress
                          </p>
                          <p className="text-xs text-gray-400">
                            ₹{formatMoney(totalSettled)} of ₹
                            {formatMoney(totalOwed)} repaid
                          </p>
                        </div>

                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]"
                          role="progressbar"
                          aria-label="Repayment progress"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={settlementPercent}
                        >
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                            style={{ width: `${settlementPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* MEMBER SHARES */}
                    <div className="border-t border-white/[0.07] p-5 sm:p-6">
                      <h4 className="mb-4 text-sm font-bold text-white">
                        Member breakdown
                      </h4>

                      <div className="space-y-3">
                        {(expense.splits || []).map((split, index) => {
                          const owed = Number(split.amountOwed || 0);
                          const settled = Number(split.settledAmount || 0);
                          const remaining = Math.max(0, owed - settled);

                          const splitUserId = (
                            split.userId?._id || split.userId
                          )?.toString();

                          const isCurrentUser =
                            splitUserId === currentUserId;

                          const fullySettled = remaining < 0.005;

                          return (
                            <div
                              key={split.userId?._id || index}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                    isCurrentUser
                                      ? "bg-emerald-400/15 text-emerald-300"
                                      : "bg-white/[0.06] text-gray-300"
                                  }`}
                                >
                                  {(
                                    split.userId?.name ||
                                    split.userId?.email ||
                                    "M"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="break-words text-sm font-semibold text-gray-200">
                                    {split.userId?.name ||
                                      split.userId?.email ||
                                      "Group member"}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-emerald-300">
                                        You
                                      </span>
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Share ₹{formatMoney(owed)} · Repaid ₹
                                    {formatMoney(settled)}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="font-bold text-white">
                                  ₹{formatMoney(remaining)}
                                </p>
                                <span
                                  className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${
                                    fullySettled
                                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                      : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                                  }`}
                                >
                                  {fullySettled ? "Settled" : "Pending"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SETTLE UP */}
                    {canSettle && (
                      <div className="border-t border-white/[0.07] bg-emerald-400/[0.03] p-5 sm:p-6">
                        <div className="mb-4">
                          <h4 className="font-bold text-emerald-300">
                            Settle your share
                          </h4>
                          <p className="mt-1 text-sm text-gray-400">
                            Outstanding balance:{" "}
                            <span className="font-semibold text-white">
                              ₹{formatMoney(remainingCents / 100)}
                            </span>
                          </p>
                        </div>

                        <form
                          className="flex flex-col gap-3 sm:flex-row"
                          onSubmit={(e) => {
                            e.preventDefault();
                            settleExpense(expense);
                          }}
                        >
                          <div className="relative min-w-0 flex-1">
                            <span className="absolute inset-y-0 left-4 flex items-center font-bold text-emerald-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              max={(remainingCents / 100).toFixed(2)}
                              step="0.01"
                              required
                              value={settlementAmounts[expense._id] || ""}
                              onChange={(e) =>
                                setSettlementAmounts((prev) => ({
                                  ...prev,
                                  [expense._id]: e.target.value,
                                }))
                              }
                              placeholder="Enter repayment amount"
                              className={`${inputClass} pl-10`}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={!!settlingExpense[expense._id]}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-[#07100b] transition hover:bg-emerald-300 disabled:opacity-50"
                          >
                            {settlingExpense[expense._id] ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                                Recording...
                              </>
                            ) : (
                              "Record repayment"
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* SETTLEMENT MESSAGE */}
                    {settlementMessage[expense._id] && (
                      <div
                        role="status"
                        className={`border-t border-white/[0.07] p-4 text-sm ${
                          settlementMessage[expense._id].type === "success"
                            ? "bg-emerald-400/[0.05] text-emerald-300"
                            : "bg-red-400/[0.05] text-red-300"
                        }`}
                      >
                        {settlementMessage[expense._id].text}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-white/[0.06] py-6 text-center">
          <p className="text-xs text-gray-500">
            Better together. Share fairly. Settle easily.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SharedExpenses;
