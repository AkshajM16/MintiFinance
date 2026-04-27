// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
}

// Calendar Event types
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category: EventCategory;
  raw: any;
  transactions?: Transaction[];
  // Enhanced spending prediction
  spendingProbability?: number;
  expectedSpendingRange?: [number, number];
  spendingCategories?: string[];
  confidence?: number;
  keywords?: string[];
}

export type EventCategory = 
  | 'Dining & Social'
  | 'Travel & Transportation'
  | 'Shopping & Retail'
  | 'Entertainment & Recreation'
  | 'Health & Medical'
  | 'Education & Training'
  | 'College Classes'
  | 'Work & Business'
  | 'Personal & Social'
  | 'Other';

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: Date;
  category?: string;
  eventId?: string;
  type: TransactionType;
  createdAt: Date;
  updatedAt: Date;
  event?: CalendarEvent;
}

export type TransactionType = 'EXPENSE' | 'INCOME';

// Budget types
export interface Budget {
  id: string;
  userId: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
  categoryId?: string;
  category?: Category;
  spent: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// Category types
export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  budget?: number;
  icon?: string;
  isDefault: boolean;
  budgets?: Budget[];
  createdAt: Date;
  updatedAt: Date;
}

// Analysis types
export interface SpendingAnalysis {
  totalSpent: number;
  totalIncome: number;
  eventTriggeredSpending: number;
  eventTriggeredTransactions: Transaction[];
  categoryBreakdown: Record<string, number>;
  timeBasedAnalysis: TimeBasedAnalysis;
  eventSpendingCorrelation: EventSpendingCorrelation[];
}

export interface TimeBasedAnalysis {
  dayOfWeekSpending: Record<string, number>;
  totalDays: number;
  averageDailySpending: number;
}

export interface EventSpendingCorrelation {
  event: {
    id: string;
    title: string;
    start: Date;
    category: EventCategory;
  };
  transactions: Transaction[];
  totalSpent: number;
  transactionCount: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface TransactionFormData {
  amount: string;
  description: string;
  category: string;
  type: TransactionType;
  date: string;
  eventId?: string;
}

// Filter types
export interface EventFilters {
  category?: EventCategory;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  eventId?: string;
  search?: string;
}

// Budget Goal types
export interface BudgetGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  category?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Recurring Transaction types
export interface RecurringTransaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category?: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  lastProcessed?: Date;
  isActive: boolean;
  transactions?: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

// Bill Reminder types
export interface BillReminder {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  category?: string;
  isPaid: boolean;
  reminderDays: number;
  isRecurring: boolean;
  frequency?: RecurringFrequency;
  createdAt: Date;
  updatedAt: Date;
}

// Savings Goal types
export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  monthlyContribution?: number;
  color: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// Form types for new features
export interface BudgetGoalFormData {
  name: string;
  targetAmount: string;
  deadline?: string;
  category?: string;
  color: string;
  icon?: string;
}

export interface RecurringTransactionFormData {
  description: string;
  amount: string;
  category?: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
}

export interface BillReminderFormData {
  name: string;
  amount: string;
  dueDate: string;
  category?: string;
  reminderDays: number;
  isRecurring: boolean;
  frequency?: RecurringFrequency;
}

export interface SavingsGoalFormData {
  name: string;
  targetAmount: string;
  targetDate?: string;
  monthlyContribution?: string;
  color: string;
  icon?: string;
} 