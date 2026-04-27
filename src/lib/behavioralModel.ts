import { Transaction } from "@/types";

export interface HabitProfile {
  avgSpendByDayOfWeek: Record<number, number>;
  avgSpendByMonth: Record<number, number>;
  examWeekDelta: number;
}

export interface CategoryForecast {
  category: string;
  amount: number;
}

export interface HabitualPrediction {
  date: string;
  predictedSpend: number;
}

export interface SpendingAnomaly {
  transactionId: string;
  category: string;
  amount: number;
  zScore: number;
}

interface CategorizedSpendStats {
  mean: number;
  stdDev: number;
}

const EXAM_WEEK_KEYWORDS = ["exam", "midterm", "final", "quiz", "project"];

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function onlyExpenseTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => tx.type === "EXPENSE");
}

function normalizeCategory(category?: string): string {
  return (category || "Other").trim();
}

function getCategoryStats(transactions: Transaction[]): Record<string, CategorizedSpendStats> {
  const grouped: Record<string, number[]> = {};
  for (const tx of transactions) {
    const category = normalizeCategory(tx.category);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(tx.amount);
  }

  const stats: Record<string, CategorizedSpendStats> = {};
  for (const [category, values] of Object.entries(grouped)) {
    stats[category] = {
      mean: mean(values),
      stdDev: stdDev(values),
    };
  }
  return stats;
}

function isExamWeekTransaction(tx: Transaction): boolean {
  const text = `${tx.description} ${tx.category || ""}`.toLowerCase();
  return EXAM_WEEK_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function learnHabits(transactions: Transaction[]): HabitProfile {
  const expenses = onlyExpenseTransactions(transactions);
  const dayBuckets: Record<number, number[]> = {};
  const monthBuckets: Record<number, number[]> = {};

  for (const tx of expenses) {
    const date = toDate(tx.date);
    const day = date.getDay();
    const month = date.getMonth();

    if (!dayBuckets[day]) dayBuckets[day] = [];
    if (!monthBuckets[month]) monthBuckets[month] = [];

    dayBuckets[day].push(tx.amount);
    monthBuckets[month].push(tx.amount);
  }

  const avgSpendByDayOfWeek: Record<number, number> = {};
  const avgSpendByMonth: Record<number, number> = {};

  for (let i = 0; i < 7; i += 1) {
    avgSpendByDayOfWeek[i] = mean(dayBuckets[i] || []);
  }
  for (let i = 0; i < 12; i += 1) {
    avgSpendByMonth[i] = mean(monthBuckets[i] || []);
  }

  const examWeekExpenses = expenses.filter(isExamWeekTransaction).map((tx) => tx.amount);
  const nonExamExpenses = expenses.filter((tx) => !isExamWeekTransaction(tx)).map((tx) => tx.amount);
  const examWeekDelta = mean(examWeekExpenses) - mean(nonExamExpenses);

  return {
    avgSpendByDayOfWeek,
    avgSpendByMonth,
    examWeekDelta: Number.isFinite(examWeekDelta) ? examWeekDelta : 0,
  };
}

export function detectAnomalies(transactions: Transaction[], zThreshold = 2): SpendingAnomaly[] {
  const expenses = onlyExpenseTransactions(transactions);
  const statsByCategory = getCategoryStats(expenses);
  const anomalies: SpendingAnomaly[] = [];

  for (const tx of expenses) {
    const category = normalizeCategory(tx.category);
    const stats = statsByCategory[category];
    if (!stats || stats.stdDev === 0) continue;

    const zScore = (tx.amount - stats.mean) / stats.stdDev;
    if (Math.abs(zScore) >= zThreshold) {
      anomalies.push({
        transactionId: tx.id,
        category,
        amount: tx.amount,
        zScore,
      });
    }
  }

  return anomalies;
}

export function predictHabitualExpenses(
  transactions: Transaction[],
  futureDates: Date[]
): HabitualPrediction[] {
  const habits = learnHabits(transactions);
  const expenses = onlyExpenseTransactions(transactions);
  const recentAvg = mean(
    expenses
      .filter((tx) => {
        const date = toDate(tx.date);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return diffMs <= 30 * 24 * 60 * 60 * 1000;
      })
      .map((tx) => tx.amount)
  );

  return futureDates.map((date) => {
    const dayMean = habits.avgSpendByDayOfWeek[date.getDay()] || 0;
    const monthMean = habits.avgSpendByMonth[date.getMonth()] || 0;
    const baseline = (dayMean + monthMean + recentAvg) / 3;
    const examBoost = habits.examWeekDelta > 0 && [0, 6].includes(date.getDay())
      ? habits.examWeekDelta * 0.15
      : 0;

    return {
      date: date.toISOString(),
      predictedSpend: Math.max(0, baseline + examBoost),
    };
  });
}

export function forecastByCategory(
  transactions: Transaction[],
  days = 30
): CategoryForecast[] {
  const expenses = onlyExpenseTransactions(transactions);
  const grouped: Record<string, number[]> = {};
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 90);

  for (const tx of expenses) {
    const date = toDate(tx.date);
    if (date < windowStart) continue;
    const category = normalizeCategory(tx.category);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(tx.amount);
  }

  const dayMultiplier = days / 30;
  return Object.entries(grouped)
    .map(([category, values]) => ({
      category,
      amount: mean(values) * Math.max(1, values.length / 6) * dayMultiplier,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function generateFutureDates(days = 30): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  for (let i = 1; i <= days; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    dates.push(date);
  }
  return dates;
}
