import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { Transaction, TransactionFormData } from "@/types";
import { formatDate } from "@/lib/utils";

interface TransactionsPageProps {
  transactions: Transaction[];
  loading: boolean;
  onAddTransaction: (data: TransactionFormData) => Promise<any>;
  onUpdateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<any>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function TransactionsPage({
  transactions,
  loading,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: TransactionsPageProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const pageSize = 10;

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.category).filter(Boolean))) as string[];
  }, [transactions]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    const filteredItems = transactions.filter((tx) => {
      if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "ALL" && tx.category !== categoryFilter) return false;
      if (normalizedSearch && !tx.description.toLowerCase().includes(normalizedSearch)) return false;

      const txDate = new Date(tx.date);
      if (startDate && txDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });

    return filteredItems.sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount-desc") return b.amount - a.amount;
      return a.amount - b.amount;
    });
  }, [transactions, typeFilter, categoryFilter, search, startDate, endDate, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) return;
    await onDeleteTransaction(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400">Search, filter, edit, and clean up your transaction history.</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowAddModal(true)}>
          + Add Transaction
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
            placeholder="Search description"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "ALL" | "INCOME" | "EXPENSE")}
            className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
          >
            <option value="ALL">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-gray-300">Loading transactions...</p>}
        {!loading && pageItems.length === 0 && (
          <Card className="glass">
            <CardContent className="p-6 text-center text-gray-300">
              No transactions match your filters.
            </CardContent>
          </Card>
        )}

        {pageItems.map((tx) => (
          <Card key={tx.id} className="glass">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-white font-semibold">{tx.description}</p>
                <div className="text-sm text-gray-400 flex flex-wrap gap-2">
                  <span>{formatDate(tx.date)}</span>
                  <span>•</span>
                  <span>{tx.category || "Uncategorized"}</span>
                  {tx.event?.title && <><span>•</span><span>Linked: {tx.event.title}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={`font-bold ${tx.type === "EXPENSE" ? "text-red-400" : "text-emerald-400"}`}>
                  {tx.type === "EXPENSE" ? "-" : "+"}${tx.amount.toFixed(2)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(tx)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(tx.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">
          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </div>

      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await onAddTransaction(data);
            setShowAddModal(false);
          }}
        />
      )}

      {editing && (
        <AddTransactionModal
          onClose={() => setEditing(null)}
          onAdd={async (data) => {
            await onUpdateTransaction(editing.id, data);
            setEditing(null);
          }}
          initialData={{
            amount: editing.amount.toString(),
            description: editing.description,
            category: editing.category || "",
            type: editing.type,
            date: new Date(editing.date).toISOString().slice(0, 10),
          }}
          title="Edit Transaction"
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}
