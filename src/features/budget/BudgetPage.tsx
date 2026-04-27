import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Budget, CalendarEvent, Transaction, User } from "@/types";
import { forecastByCategory } from "@/lib/behavioralModel";

interface BudgetPageProps {
  user: User;
  transactions: Transaction[];
  events: CalendarEvent[];
}

interface BudgetFormState {
  name: string;
  amount: string;
  categoryName: string;
  color: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function BudgetPage({ user, transactions, events }: BudgetPageProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [predictionOverrides, setPredictionOverrides] = useState<Record<string, number>>({});
  const [editingPredictionId, setEditingPredictionId] = useState<string | null>(null);
  const [predictionInput, setPredictionInput] = useState("");
  const [form, setForm] = useState<BudgetFormState>({
    name: "",
    amount: "",
    categoryName: "",
    color: "#3B82F6",
  });

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (tx.type !== "EXPENSE") return false;
      const date = new Date(tx.date);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [transactions]);

  const behaviorForecast = useMemo(() => forecastByCategory(transactions, 30), [transactions]);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/budgets?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setBudgets(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, [user.id]);

  const allocationRows = useMemo(() => {
    return budgets.map((budget) => {
      const budgetLabel = normalize(budget.category?.name || budget.name);
      const spent = monthlyExpenses
        .filter((tx) => normalize(tx.category || "other") === budgetLabel)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const eventPrediction = events
        .filter((event) => new Date(event.start) > new Date())
        .filter((event) => {
          const categories = (event.spendingCategories || []).map((category) => normalize(category));
          return categories.includes(budgetLabel) || normalize(event.category) === budgetLabel;
        })
        .reduce((sum, event) => {
          const range = event.expectedSpendingRange || [0, 0];
          const average = (range[0] + range[1]) / 2;
          return sum + average * (event.spendingProbability || 0);
        }, 0);

      const behaviorPrediction = behaviorForecast
        .filter((entry) => normalize(entry.category) === budgetLabel)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const basePrediction = eventPrediction + behaviorPrediction;
      const prediction = predictionOverrides[budget.id] ?? basePrediction;
      const remaining = budget.amount - spent - prediction;

      return {
        budget,
        spent,
        eventPrediction,
        behaviorPrediction,
        prediction,
        remaining,
      };
    });
  }, [budgets, monthlyExpenses, events, behaviorForecast, predictionOverrides]);

  const submitBudget = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        name: form.name,
        amount: form.amount,
        categoryName: form.categoryName || form.name,
        color: form.color,
        period: "MONTHLY",
      }),
    });
    if (!response.ok) return;
    const budget = await response.json();
    setBudgets((prev) => [budget, ...prev]);
    setShowAdd(false);
    setForm({ name: "", amount: "", categoryName: "", color: "#3B82F6" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Budget Allocation</h1>
          <p className="text-gray-400">Track spent, predicted, and remaining budget per category.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAdd(true)}>
          + Add Budget
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-300">
                <th className="text-left p-4">Category</th>
                <th className="text-right p-4">Limit</th>
                <th className="text-right p-4">Spent</th>
                <th className="text-right p-4">Events Mode</th>
                <th className="text-right p-4">Behavioral Mode</th>
                <th className="text-right p-4">Predicted (editable)</th>
                <th className="text-right p-4">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {allocationRows.map((row) => {
                const spentPercent = Math.min(100, (row.spent / row.budget.amount) * 100);
                const predictedPercent = Math.min(100 - spentPercent, (row.prediction / row.budget.amount) * 100);
                const remainingPercent = Math.max(0, 100 - spentPercent - predictedPercent);
                const remainingColor =
                  row.remaining < 0 ? "text-red-400" : row.remaining < row.budget.amount * 0.2 ? "text-yellow-400" : "text-emerald-400";

                return (
                  <tr key={row.budget.id} className="border-b border-gray-800 text-white">
                    <td className="p-4">
                      <p className="font-semibold">{row.budget.category?.name || row.budget.name}</p>
                      <div className="h-2 w-44 bg-gray-700 rounded-full mt-2 overflow-hidden flex">
                        <div className="bg-red-500 h-2" style={{ width: `${spentPercent}%` }} />
                        <div className="bg-yellow-500/70 h-2" style={{ width: `${predictedPercent}%` }} />
                        <div className="bg-emerald-500/40 h-2" style={{ width: `${remainingPercent}%` }} />
                      </div>
                    </td>
                    <td className="p-4 text-right">${row.budget.amount.toFixed(2)}</td>
                    <td className="p-4 text-right text-red-400">${row.spent.toFixed(2)}</td>
                    <td className="p-4 text-right text-yellow-300">${row.eventPrediction.toFixed(2)}</td>
                    <td className="p-4 text-right text-purple-300">${row.behaviorPrediction.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      {editingPredictionId === row.budget.id ? (
                        <div className="flex justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={predictionInput}
                            onChange={(e) => setPredictionInput(e.target.value)}
                            className="w-24 px-2 py-1 rounded bg-gray-700 border border-gray-600"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const parsed = parseFloat(predictionInput);
                              if (Number.isFinite(parsed)) {
                                setPredictionOverrides((prev) => ({ ...prev, [row.budget.id]: parsed }));
                              }
                              setEditingPredictionId(null);
                              setPredictionInput("");
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="underline decoration-dotted text-yellow-200"
                          onClick={() => {
                            setEditingPredictionId(row.budget.id);
                            setPredictionInput(row.prediction.toFixed(2));
                          }}
                        >
                          ${row.prediction.toFixed(2)}
                        </button>
                      )}
                    </td>
                    <td className={`p-4 text-right font-semibold ${remainingColor}`}>${row.remaining.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && allocationRows.length === 0 && (
            <div className="p-8 text-center text-gray-400">No budgets yet. Add your first category budget.</div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
          onClick={() => setShowAdd(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-semibold mb-4">Add Budget</h3>
            <form className="space-y-4" onSubmit={submitBudget}>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Budget name"
              />
              <input
                required
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Monthly limit"
              />
              <input
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Category (optional)"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
