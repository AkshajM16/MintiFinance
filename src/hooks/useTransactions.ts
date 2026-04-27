import { useState, useEffect, useCallback } from "react";
import { Transaction, User, TransactionFormData, TransactionFilters } from "@/types";
import { transactionsApi } from "@/services/api";

export function useTransactions(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (filters?: TransactionFilters) => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await transactionsApi.list(filters);
        setTransactions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch transactions"
        );
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const addTransaction = useCallback(
    async (data: TransactionFormData) => {
      if (!user) return;

      try {
        setError(null);
        const newTransaction = await transactionsApi.create(data);
        setTransactions((prev) => [newTransaction, ...prev]);
        return newTransaction;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to add transaction"
        );
        console.error("Failed to add transaction:", err);
        throw err;
      }
    },
    [user]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<TransactionFormData>) => {
      try {
        setError(null);
        const updated = await transactionsApi.update(id, data);
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update transaction"
        );
        console.error("Failed to update transaction:", err);
        throw err;
      }
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setError(null);
      await transactionsApi.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction"
      );
      console.error("Failed to delete transaction:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [user, fetchTransactions]);

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

  return {
    transactions,
    loading,
    error,
    totals,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
