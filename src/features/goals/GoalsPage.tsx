import { BudgetGoal, BudgetGoalFormData, SavingsGoal, SavingsGoalFormData } from "@/types";
import { BudgetGoalsSection } from "@/components/BudgetGoalsSection";
import { SavingsGoalsSection } from "@/components/SavingsGoalsSection";

interface GoalsPageProps {
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  onAddBudgetGoal: (data: BudgetGoalFormData) => Promise<void>;
  onAddSavingsGoal: (data: SavingsGoalFormData) => Promise<void>;
  onAddSavingsContribution: (goal: SavingsGoal, amount: number) => Promise<void>;
}

export function GoalsPage({
  budgetGoals,
  savingsGoals,
  onAddBudgetGoal,
  onAddSavingsGoal,
  onAddSavingsContribution,
}: GoalsPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Financial Goals</h1>
        <p className="text-gray-400">Manage both your spending goals and your savings targets in one place.</p>
      </div>

      <BudgetGoalsSection budgetGoals={budgetGoals} onAddGoal={onAddBudgetGoal} />

      <SavingsGoalsSection
        goals={savingsGoals}
        onAddGoal={onAddSavingsGoal}
        onAddContribution={onAddSavingsContribution}
      />
    </div>
  );
}
