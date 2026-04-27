import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, CalendarEvent, Transaction, TransactionFormData, BudgetGoal, BillReminder, SavingsGoal } from "@/types";
import { CATEGORY_COLORS, APP_CONFIG } from "@/constants";
import { formatDate } from "@/lib/utils";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { BudgetGoalsSection } from "@/components/BudgetGoalsSection";
import { BillRemindersSection } from "@/components/BillRemindersSection";

interface DashboardProps {
  user: User;
  events: CalendarEvent[];
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  billReminders: BillReminder[];
  savingsGoals: SavingsGoal[];
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  syncing: boolean;
  error: string | null;
  onLogout: () => void;
  onAddTransaction: (data: TransactionFormData) => Promise<any>;
  onAddBudgetGoal: (data: any) => Promise<void>;
  onAddBillReminder: (data: any) => Promise<void>;
  onMarkBillAsPaid: (id: string) => Promise<void>;
  onAddSavingsGoal: (data: any) => Promise<void>;
}

export function Dashboard({
  user,
  events,
  transactions,
  budgetGoals,
  billReminders,
  savingsGoals,
  totals,
  syncing,
  error,
  onLogout,
  onAddTransaction,
  onAddBudgetGoal,
  onAddBillReminder,
  onMarkBillAsPaid,
  onAddSavingsGoal,
}: DashboardProps) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'bills' | 'savings'>('overview');

  const handleAddTransaction = async (data: TransactionFormData) => {
    try {
      await onAddTransaction(data);
      setShowAddTransaction(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  // Calculate predicted spending from upcoming events
  const upcomingEvents = events.filter(event => new Date(event.start) > new Date());
  const predictedSpending = upcomingEvents.reduce((total, event) => {
    if (event.spendingProbability && event.expectedSpendingRange) {
      const avgExpected = (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2;
      return total + (avgExpected * event.spendingProbability);
    }
    return total;
  }, 0);

  // Get high-spending-probability events
  const highSpendingEvents = upcomingEvents
    .filter(event => event.spendingProbability && event.spendingProbability > 0.7)
    .sort((a, b) => (b.spendingProbability || 0) - (a.spendingProbability || 0))
    .slice(0, 5);

  // Calculate total savings from goals
  const totalSavings = savingsGoals.reduce((total, goal) => total + goal.currentAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((total, goal) => total + goal.targetAmount, 0);

  // Calculate upcoming bills total
  const upcomingBillsTotal = billReminders
    .filter(bill => !bill.isPaid)
    .reduce((total, bill) => total + bill.amount, 0);

  // Skeleton loader for dashboard
  if (syncing) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl h-24" />
          ))}
        </div>
        <div className="bg-card rounded-xl h-96" />
      </div>
    );
  }

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="container mx-auto px-4 py-8"
      aria-label="Dashboard Main Content"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Smart Budget Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Welcome back, {user.name || user.email}!
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowAddTransaction(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            + Add Transaction
          </Button>
          <Button onClick={onLogout} variant="outline" size="lg">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-red-400">
                  ${totals.expenses.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${totals.income.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Net Balance</p>
                <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ${totals.balance.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Predicted Spending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${predictedSpending.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Savings</p>
                <p className="text-xl font-bold text-emerald-400">
                  ${totalSavings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  of ${totalSavingsTarget.toFixed(2)} target
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Upcoming Bills</p>
                <p className="text-xl font-bold text-orange-400">
                  ${upcomingBillsTotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {billReminders.filter(b => !b.isPaid).length} bills due
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Goals</p>
                <p className="text-xl font-bold text-purple-400">
                  {budgetGoals.filter(g => g.isActive).length}
                </p>
                <p className="text-xs text-gray-400">
                  budget goals
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-800/50 rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'goals' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('goals')}
          className="flex-1"
        >
          Goals
        </Button>
        <Button
          variant={activeTab === 'bills' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('bills')}
          className="flex-1"
        >
          Bills
        </Button>
        <Button
          variant={activeTab === 'savings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('savings')}
          className="flex-1"
        >
          Savings
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Spending Predictions */}
          {highSpendingEvents.length > 0 && (
            <Card className="glass mb-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  High Spending Probability Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {highSpendingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other}>
                            {event.category}
                          </Badge>
                          <span className="text-xs text-gray-400">{formatDate(event.start)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-400">
                          {(event.spendingProbability! * 100).toFixed(0)}% chance
                        </div>
                        <div className="text-xs text-gray-400">
                          ${event.expectedSpendingRange?.[0] || 0} - ${event.expectedSpendingRange?.[1] || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Events Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Calendar Events ({events.length})
                </h2>
                {syncing && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Syncing...</span>
                  </div>
                )}
              </div>

              {events.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {events.map((event) => (
                    <Card 
                      key={event.id} 
                      className="glass hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowAddTransaction(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold text-white text-sm">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className={CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other}>
                                {event.category}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {formatDate(event.start)}
                              </span>
                            </div>
                            {/* Spending Prediction */}
                            {event.spendingProbability && event.spendingProbability > 0.3 && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                  <span className="text-xs text-yellow-400">
                                    {(event.spendingProbability * 100).toFixed(0)}% spending chance
                                  </span>
                                </div>
                                {event.expectedSpendingRange && (
                                  <span className="text-xs text-gray-400">
                                    ${event.expectedSpendingRange[0]}-${event.expectedSpendingRange[1]}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowAddTransaction(true);
                            }}
                          >
                            + Expense
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
                    <p className="text-gray-400">Connect your Google Calendar to see your events and spending predictions.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Transactions Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Recent Transactions ({transactions.length})
                </h2>
              </div>

              {transactions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="glass">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-white text-sm">
                              {transaction.description}
                            </h3>
                            <div className="flex items-center gap-2">
                              {transaction.category && (
                                <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/20">
                                  {transaction.category}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                            {transaction.event && (
                              <div className="text-xs text-blue-400">
                                Linked to: {transaction.event.title}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${
                              transaction.type === 'EXPENSE' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {transaction.type === 'EXPENSE' ? '-' : '+'}${transaction.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {transaction.type.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
                    <p className="text-gray-400">Add your first transaction to start tracking your spending.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'goals' && (
        <BudgetGoalsSection
          budgetGoals={budgetGoals}
          onAddGoal={onAddBudgetGoal}
        />
      )}

      {activeTab === 'bills' && (
        <BillRemindersSection
          billReminders={billReminders}
          onAddReminder={onAddBillReminder}
          onMarkAsPaid={onMarkBillAsPaid}
        />
      )}

      {activeTab === 'savings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Savings Goals</h2>
            <Button
              onClick={() => {
                const name = window.prompt("Goal name");
                const targetAmount = window.prompt("Target amount");
                if (!name || !targetAmount) return;
                onAddSavingsGoal({
                  name,
                  targetAmount,
                  targetDate: "",
                  monthlyContribution: "",
                  color: "#10B981",
                  icon: "💰",
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              + Add Goal
            </Button>
          </div>

          {savingsGoals.length === 0 && (
            <Card className="glass">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Savings Goals Yet</h3>
                <p className="text-gray-400">Track your savings progress and set financial goals.</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              return (
                <Card key={goal.id} className="glass">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-semibold">{goal.icon || "💰"} {goal.name}</h3>
                      <span className="text-emerald-300 text-sm">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-gray-300 text-sm">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          onClose={() => {
            setShowAddTransaction(false);
            setSelectedEvent(null);
          }}
          onAdd={handleAddTransaction}
          selectedEvent={selectedEvent}
        />
      )}
    </motion.div>
  );
} 