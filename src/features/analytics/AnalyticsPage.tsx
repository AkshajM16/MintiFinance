import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Transaction } from "@/types";

interface AnalyticsPageProps {
  transactions: Transaction[];
}

export function AnalyticsPage({ transactions }: AnalyticsPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");

  const colors = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981", "#06B6D4"];

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (selectedPeriod === "month") start.setMonth(now.getMonth() - 1);
    if (selectedPeriod === "quarter") start.setMonth(now.getMonth() - 3);
    if (selectedPeriod === "year") start.setFullYear(now.getFullYear() - 1);
    return transactions.filter((tx) => {
      const date = new Date(tx.date);
      return date >= start && date <= now;
    });
  }, [transactions, selectedPeriod]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expenses: number; savingsRate: number }> = {};
    for (const tx of filteredTransactions) {
      const date = new Date(tx.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[month]) map[month] = { month, income: 0, expenses: 0, savingsRate: 0 };
      if (tx.type === "INCOME") map[month].income += tx.amount;
      if (tx.type === "EXPENSE") map[month].expenses += tx.amount;
    }
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((entry) => ({
        ...entry,
        savingsRate: entry.income > 0 ? ((entry.income - entry.expenses) / entry.income) * 100 : 0,
      }));
  }, [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of filteredTransactions) {
      if (tx.type !== "EXPENSE") continue;
      const category = tx.category || "Other";
      map[category] = (map[category] || 0) + tx.amount;
    }
    return Object.entries(map).map(([category, amount], index) => ({
      category,
      amount,
      color: colors[index % colors.length],
    }));
  }, [filteredTransactions]);

  const categoryTrendData = useMemo(() => {
    const monthMap: Record<string, Record<string, number>> = {};
    for (const tx of filteredTransactions) {
      if (tx.type !== "EXPENSE") continue;
      const date = new Date(tx.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[month]) monthMap[month] = {};
      const category = tx.category || "Other";
      monthMap[month][category] = (monthMap[month][category] || 0) + tx.amount;
    }

    const months = Object.keys(monthMap).sort();
    const categories = Array.from(new Set(categoryBreakdown.map((entry) => entry.category)));
    return months.map((month) => {
      const row: Record<string, string | number> = { month };
      for (const category of categories) {
        row[category] = monthMap[month][category] || 0;
      }
      return row;
    });
  }, [filteredTransactions, categoryBreakdown]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month': return 'Last Month';
      case 'quarter': return 'Last 3 Months';
      case 'year': return 'Last Year';
    }
  };

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Spending Analytics</h1>
          <p className="text-gray-400">
            Detailed analysis of your financial patterns and trends
          </p>
        </div>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Net Balance</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ${(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Savings Rate</p>
                <p className="text-2xl font-bold text-purple-400">
                  {totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Category Breakdown ({getPeriodLabel()})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Spending Over Time */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Spending Over Time (Line)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              {Array.from(new Set(categoryBreakdown.map((entry) => entry.category))).map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Income vs Expenses + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Income vs Expenses (Bar)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#22C55E" />
                <Bar dataKey="expenses" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Savings Rate Trend (Area)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Area type="monotone" dataKey="savingsRate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 