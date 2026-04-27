import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCalendar } from "@/hooks/useCalendar";
import { useTransactions } from "@/hooks/useTransactions";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { Dashboard } from "@/features/budget/Dashboard";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { BudgetPage } from "@/features/budget/BudgetPage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { BillsPage } from "@/features/bills/BillsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { PredictionsPage } from "@/features/predictions/PredictionsPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { Sidebar } from "@/components/Sidebar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ChatBot } from "@/components/ChatBot";
import GoogleCallback from "./GoogleCallback";
import { getAuthHeaders } from "@/services/api";
import {
  BudgetGoal,
  BillReminder,
  SavingsGoal,
  TransactionFormData,
  BudgetGoalFormData,
  BillReminderFormData,
  SavingsGoalFormData,
} from "@/types";

function MainApp() {
  const { user, login, logout, loading: authLoading, getAccessToken } = useAuth();
  const { events, syncing: calendarSyncing, error: calendarError, syncCalendar } =
    useCalendar(user);
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loading: transactionsLoading,
    fetchTransactions,
  } = useTransactions(user);

  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      loadAllData();
      const accessToken = getAccessToken();
      if (accessToken) {
        syncCalendar(accessToken);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [goalsRes, billsRes, savingsRes] = await Promise.all([
        authFetch("/api/budget-goals"),
        authFetch("/api/bill-reminders"),
        authFetch("/api/savings-goals"),
      ]);

      if (goalsRes.ok) setBudgetGoals(await goalsRes.json());
      if (billsRes.ok) setBillReminders(await billsRes.json());
      if (savingsRes.ok) setSavingsGoals(await savingsRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudgetGoal = async (data: BudgetGoalFormData) => {
    const response = await authFetch("/api/budget-goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to add budget goal");
    const newGoal = await response.json();
    setBudgetGoals((prev) => [newGoal, ...prev]);
  };

  const handleAddBillReminder = async (data: BillReminderFormData) => {
    const response = await authFetch("/api/bill-reminders", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to add bill reminder");
    const newBill = await response.json();
    setBillReminders((prev) => [newBill, ...prev]);
  };

  const handleMarkBillAsPaid = async (id: string) => {
    const bill = billReminders.find((b) => b.id === id);
    const response = await authFetch(`/api/bill-reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isPaid: true }),
    });
    if (!response.ok) throw new Error("Failed to mark bill as paid");

    if (bill) {
      await addTransaction({
        amount: bill.amount.toString(),
        description: `Paid bill: ${bill.name}`,
        category: bill.category || "Bills & Utilities",
        type: "EXPENSE",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setBillReminders((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isPaid: true } : b))
    );
  };

  const handleAddSavingsGoal = async (data: SavingsGoalFormData) => {
    const response = await authFetch("/api/savings-goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to add savings goal");
    const newGoal = await response.json();
    setSavingsGoals((prev) => [newGoal, ...prev]);
  };

  const handleAddTransaction = async (data: TransactionFormData) => {
    return addTransaction(data);
  };

  const handleUpdateTransaction = async (
    id: string,
    data: Partial<TransactionFormData>
  ) => {
    await updateTransaction(id, data);
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleAddSavingsContribution = async (
    goal: SavingsGoal,
    amount: number
  ) => {
    await authFetch(`/api/savings-goals/${goal.id}`, {
      method: "PATCH",
      body: JSON.stringify({ contributionAmount: amount }),
    });
    setSavingsGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, currentAmount: g.currentAmount + amount }
          : g
      )
    );
    await addTransaction({
      amount: amount.toString(),
      description: `Savings contribution: ${goal.name}`,
      category: "Savings",
      type: "INCOME",
      date: new Date().toISOString().slice(0, 10),
    });
    await fetchTransactions();
  };

  const totals = {
    income: transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0),
    balance: transactions.reduce(
      (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount),
      0
    ),
  };

  const sidebarStats = {
    totalBalance: totals.balance,
    monthlySpending: totals.expenses,
    upcomingBills: billReminders
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0),
    activeGoals: budgetGoals.filter((g) => g.isActive).length,
  };

  const renderPageContent = () => {
    if (!user) return null;

    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            user={user}
            events={events}
            transactions={transactions}
            budgetGoals={budgetGoals}
            billReminders={billReminders}
            savingsGoals={savingsGoals}
            totals={totals}
            syncing={calendarSyncing || transactionsLoading || loading}
            error={calendarError}
            onLogout={logout}
            onAddTransaction={handleAddTransaction}
            onAddBudgetGoal={handleAddBudgetGoal}
            onAddBillReminder={handleAddBillReminder}
            onMarkBillAsPaid={handleMarkBillAsPaid}
            onAddSavingsGoal={handleAddSavingsGoal}
          />
        );
      case "predictions":
        return <PredictionsPage events={events} transactions={transactions} />;
      case "analytics":
        return <AnalyticsPage transactions={transactions} />;
      case "accounts":
        return <AccountsPage user={user} />;
      case "goals":
        return (
          <GoalsPage
            budgetGoals={budgetGoals}
            savingsGoals={savingsGoals}
            onAddBudgetGoal={handleAddBudgetGoal}
            onAddSavingsGoal={handleAddSavingsGoal}
            onAddSavingsContribution={handleAddSavingsContribution}
          />
        );
      case "bills":
        return (
          <BillsPage
            billReminders={billReminders}
            onAddBillReminder={handleAddBillReminder}
            onMarkBillAsPaid={handleMarkBillAsPaid}
          />
        );
      case "transactions":
        return (
          <TransactionsPage
            transactions={transactions}
            loading={transactionsLoading}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case "budget":
        return (
          <BudgetPage user={user} transactions={transactions} events={events} />
        );
      case "settings":
        return (
          <SettingsPage
            user={user}
            calendarConnected={Boolean(getAccessToken())}
            onSignOut={logout}
            onResyncCalendar={async () => {
              const token = getAccessToken();
              if (token) await syncCalendar(token);
            }}
          />
        );
      default:
        return (
          <Dashboard
            user={user}
            events={events}
            transactions={transactions}
            budgetGoals={budgetGoals}
            billReminders={billReminders}
            savingsGoals={savingsGoals}
            totals={totals}
            syncing={calendarSyncing || transactionsLoading || loading}
            error={calendarError}
            onLogout={logout}
            onAddTransaction={handleAddTransaction}
            onAddBudgetGoal={handleAddBudgetGoal}
            onAddBillReminder={handleAddBillReminder}
            onMarkBillAsPaid={handleMarkBillAsPaid}
            onAddSavingsGoal={handleAddSavingsGoal}
          />
        );
    }
  };

  if (authLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
        >
          <LoginScreen onLogin={login} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
      >
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          onCollapseChange={setSidebarCollapsed}
          user={user}
          stats={sidebarStats}
        />

        <div
          className={`p-8 transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPageContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <ChatBot userId={user.id} />
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/google-callback" element={<GoogleCallback />} />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  );
}
