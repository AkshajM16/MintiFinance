import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BillReminder, BillReminderFormData } from "@/types";
import { formatDate } from "@/lib/utils";

interface BillRemindersSectionProps {
  billReminders: BillReminder[];
  onAddReminder: (data: BillReminderFormData) => Promise<void>;
  onMarkAsPaid: (id: string) => Promise<void>;
}

export function BillRemindersSection({ billReminders, onAddReminder, onMarkAsPaid }: BillRemindersSectionProps) {
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [formData, setFormData] = useState<BillReminderFormData>({
    name: '',
    amount: '',
    dueDate: '',
    category: '',
    reminderDays: 3,
    isRecurring: false,
    frequency: 'MONTHLY',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddReminder(formData);
      setShowAddReminder(false);
      setFormData({
        name: '',
        amount: '',
        dueDate: '',
        category: '',
        reminderDays: 3,
        isRecurring: false,
        frequency: 'MONTHLY',
      });
    } catch (err) {
      console.error('Failed to add bill reminder:', err);
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (daysUntilDue: number, isPaid: boolean) => {
    if (isPaid) return 'bg-green-500/20 text-green-400 border-green-500/20';
    if (daysUntilDue < 0) return 'bg-red-500/20 text-red-400 border-red-500/20';
    if (daysUntilDue <= 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
  };

  const getStatusText = (daysUntilDue: number, isPaid: boolean) => {
    if (isPaid) return 'Paid';
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue === 0) return 'Due Today';
    if (daysUntilDue === 1) return 'Due Tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  const upcomingBills = billReminders
    .filter(bill => !bill.isPaid)
    .sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate));

  const paidBills = billReminders.filter(bill => bill.isPaid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Bill Reminders</h2>
        <Button
          onClick={() => setShowAddReminder(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add Bill
        </Button>
      </div>

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Upcoming Bills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBills.slice(0, 6).map((bill) => {
              const daysUntilDue = getDaysUntilDue(bill.dueDate);
              return (
                <Card key={bill.id} className="glass hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{bill.name}</h4>
                        {bill.category && (
                          <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/20 text-xs mt-1">
                            {bill.category}
                          </Badge>
                        )}
                      </div>
                      <Badge className={getStatusColor(daysUntilDue, bill.isPaid)}>
                        {getStatusText(daysUntilDue, bill.isPaid)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-white font-medium">
                          ${bill.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Due Date</span>
                        <span className="text-white font-medium">
                          {formatDate(bill.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onMarkAsPaid(bill.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        Mark as Paid
                      </Button>
                      {bill.isRecurring && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20 text-xs">
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recently Paid</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidBills.slice(0, 3).map((bill) => (
              <Card key={bill.id} className="glass opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{bill.name}</h4>
                      {bill.category && (
                        <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/20 text-xs mt-1">
                          {bill.category}
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
                      Paid
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white font-medium">
                        ${bill.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Due Date</span>
                      <span className="text-white font-medium">
                        {formatDate(bill.dueDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {billReminders.length === 0 && (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Bill Reminders</h3>
            <p className="text-gray-400 mb-4">Add your bills to never miss a payment again.</p>
            <Button onClick={() => setShowAddReminder(true)} className="bg-blue-600 hover:bg-blue-700">
              Add Your First Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Bill Modal */}
      {showAddReminder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddReminder(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Add Bill Reminder</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bill Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Rent, Electricity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Utilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reminder Days Before Due
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <label htmlFor="isRecurring" className="text-sm text-gray-300">
                  Recurring Bill
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddReminder(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Add Bill
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 