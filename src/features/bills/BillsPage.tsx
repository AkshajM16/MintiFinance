import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { BillReminder, BillReminderFormData } from "@/types";
import { formatDate } from "@/lib/utils";

interface BillsPageProps {
  billReminders: BillReminder[];
  onAddBillReminder: (data: BillReminderFormData) => Promise<void>;
  onMarkBillAsPaid: (id: string) => Promise<void>;
}

export function BillsPage({ billReminders, onAddBillReminder, onMarkBillAsPaid }: BillsPageProps) {
  const [showAddBill, setShowAddBill] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [formData, setFormData] = useState<BillReminderFormData>({
    name: "",
    amount: "",
    dueDate: "",
    category: "",
    reminderDays: 3,
    isRecurring: false,
    frequency: "MONTHLY",
  });

  const overdue = billReminders.filter((bill) => !bill.isPaid && new Date(bill.dueDate) < new Date());
  const upcoming = billReminders.filter((bill) => !bill.isPaid && new Date(bill.dueDate) >= new Date());
  const paid = billReminders.filter((bill) => bill.isPaid);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onAddBillReminder(formData);
    setShowAddBill(false);
    setFormData({
      name: "",
      amount: "",
      dueDate: "",
      category: "",
      reminderDays: 3,
      isRecurring: false,
      frequency: "MONTHLY",
    });
  };

  const BillCard = ({ bill, overdueCard = false }: { bill: BillReminder; overdueCard?: boolean }) => (
    <Card className={`glass ${overdueCard ? "border border-red-500/50 bg-red-500/5" : ""}`}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold">{bill.name}</h3>
          <p className="text-sm text-gray-400">
            {bill.category || "Uncategorized"} • Due {formatDate(bill.dueDate)}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${overdueCard ? "text-red-300" : "text-white"}`}>${bill.amount.toFixed(2)}</p>
          {!bill.isPaid ? (
            <Button
              size="sm"
              className="mt-2 bg-green-600 hover:bg-green-700"
              onClick={() => onMarkBillAsPaid(bill.id)}
            >
              Mark as paid
            </Button>
          ) : (
            <p className="text-xs mt-2 text-emerald-300">Paid</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bills</h1>
          <p className="text-gray-400">Track upcoming bills, overdue payments, and payment history.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddBill(true)}>
          + Add Bill
        </Button>
      </div>

      {overdue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-red-300">Overdue</h2>
          {overdue.map((bill) => (
            <BillCard key={bill.id} bill={bill} overdueCard />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Upcoming</h2>
        {upcoming.length === 0 && (
          <Card className="glass">
            <CardContent className="p-6 text-center text-gray-400">No upcoming bills.</CardContent>
          </Card>
        )}
        {upcoming
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
      </div>

      <div className="space-y-3">
        <button
          className="text-sm text-gray-300 underline decoration-dotted"
          onClick={() => setShowPaid((prev) => !prev)}
        >
          {showPaid ? "Hide paid bills" : `Show paid bills (${paid.length})`}
        </button>
        {showPaid && paid.map((bill) => <BillCard key={bill.id} bill={bill} />)}
      </div>

      {showAddBill && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
          onClick={() => setShowAddBill(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl font-semibold mb-4">Add Bill Reminder</h3>
            <form className="space-y-4" onSubmit={submit}>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Bill name"
              />
              <input
                required
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Amount"
              />
              <input
                required
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              />
              <input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                placeholder="Category"
              />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                Recurring bill
              </label>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Save</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddBill(false)}>
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
