import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SavingsGoal, SavingsGoalFormData } from "@/types";
import { formatDate } from "@/lib/utils";

interface SavingsGoalsSectionProps {
  goals: SavingsGoal[];
  onAddGoal: (data: SavingsGoalFormData) => Promise<void>;
  onAddContribution: (goal: SavingsGoal, amount: number) => Promise<void>;
}

export function SavingsGoalsSection({ goals, onAddGoal, onAddContribution }: SavingsGoalsSectionProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [formData, setFormData] = useState<SavingsGoalFormData>({
    name: "",
    targetAmount: "",
    targetDate: "",
    monthlyContribution: "",
    color: "#10B981",
    icon: "💰",
  });

  const handleGoalSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onAddGoal(formData);
    setShowAddGoal(false);
    setFormData({
      name: "",
      targetAmount: "",
      targetDate: "",
      monthlyContribution: "",
      color: "#10B981",
      icon: "💰",
    });
  };

  const handleContribution = async (goal: SavingsGoal) => {
    const amount = parseFloat(contributionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    await onAddContribution(goal, amount);
    setContributionGoalId(null);
    setContributionAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Savings Goals</h2>
        <Button onClick={() => setShowAddGoal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          + Add Savings Goal
        </Button>
      </div>

      {goals.length === 0 && (
        <Card className="glass">
          <CardContent className="p-8 text-center text-gray-300">
            No savings goals yet. Add one to start tracking progress.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <Card key={goal.id} className="glass">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-lg font-semibold">{goal.icon || "💰"} {goal.name}</h3>
                    <p className="text-sm text-gray-400">
                      {goal.targetDate ? `Target date: ${formatDate(goal.targetDate)}` : "No target date"}
                    </p>
                  </div>
                  <span className="text-emerald-300 font-semibold">{progress.toFixed(0)}%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-gray-700">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Current</p>
                    <p className="text-white font-semibold">${goal.currentAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Target</p>
                    <p className="text-white font-semibold">${goal.targetAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Monthly</p>
                    <p className="text-white font-semibold">${(goal.monthlyContribution || 0).toFixed(2)}</p>
                  </div>
                </div>

                {contributionGoalId === goal.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      placeholder="Contribution amount"
                    />
                    <Button size="sm" onClick={() => handleContribution(goal)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setContributionGoalId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setContributionGoalId(goal.id)}
                  >
                    Add contribution
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddGoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
          onClick={() => setShowAddGoal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-semibold mb-4">Create Savings Goal</h3>
            <form className="space-y-4" onSubmit={handleGoalSubmit}>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Goal name"
              />
              <input
                required
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Target amount"
              />
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              />
              <input
                type="number"
                step="0.01"
                value={formData.monthlyContribution}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Monthly contribution"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Save
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddGoal(false)}>
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
