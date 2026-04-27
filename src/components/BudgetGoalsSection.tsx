import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BudgetGoal, BudgetGoalFormData } from "@/types";
import { formatDate } from "@/lib/utils";

interface BudgetGoalsSectionProps {
  budgetGoals: BudgetGoal[];
  onAddGoal: (data: BudgetGoalFormData) => Promise<void>;
}

export function BudgetGoalsSection({ budgetGoals, onAddGoal }: BudgetGoalsSectionProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [formData, setFormData] = useState<BudgetGoalFormData>({
    name: '',
    targetAmount: '',
    deadline: '',
    category: '',
    color: '#3B82F6',
    icon: '🎯',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddGoal(formData);
      setShowAddGoal(false);
      setFormData({
        name: '',
        targetAmount: '',
        deadline: '',
        category: '',
        color: '#3B82F6',
        icon: '🎯',
      });
    } catch (err) {
      console.error('Failed to add budget goal:', err);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Budget Goals</h2>
        <Button
          onClick={() => setShowAddGoal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add Goal
        </Button>
      </div>

      {budgetGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetGoals.map((goal) => {
            const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
            return (
              <Card key={goal.id} className="glass hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{goal.icon}</div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{goal.name}</h3>
                        {goal.category && (
                          <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/20 text-xs">
                            {goal.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Progress</p>
                      <p className="text-lg font-bold text-white">
                        {progress.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current</span>
                      <span className="text-white font-medium">
                        ${goal.currentAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Target</span>
                      <span className="text-white font-medium">
                        ${goal.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-white font-medium">
                        ${(goal.targetAmount - goal.currentAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {goal.deadline && (
                    <div className="mt-3 text-xs text-gray-400">
                      Due: {formatDate(goal.deadline)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Budget Goals Yet</h3>
            <p className="text-gray-400 mb-4">Set financial goals to track your progress and stay motivated.</p>
            <Button onClick={() => setShowAddGoal(true)} className="bg-blue-600 hover:bg-blue-700">
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddGoal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Create Budget Goal</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Emergency Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Savings"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-center"
                    placeholder="🎯"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Create Goal
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 