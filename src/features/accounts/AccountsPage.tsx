import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AccountsPageProps {
  user: any;
}

interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'error';
  institution: string;
  accountNumber: string;
}

export function AccountsPage({ user }: AccountsPageProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      name: 'Chase Checking',
      type: 'checking',
      balance: 2450.67,
      currency: 'USD',
      lastSync: new Date(),
      status: 'connected',
      institution: 'Chase Bank',
      accountNumber: '****1234'
    },
    {
      id: '2',
      name: 'Savings Account',
      type: 'savings',
      balance: 12500.00,
      currency: 'USD',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'connected',
      institution: 'Chase Bank',
      accountNumber: '****5678'
    }
  ]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const connectedAccounts = accounts.filter(account => account.status === 'connected');

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return '🏦';
      case 'savings': return '💰';
      case 'credit': return '💳';
      case 'investment': return '📈';
      default: return '🏛️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'disconnected': return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const handleConnectBank = async () => {
    setConnecting(true);
    // Simulate bank connection process
    setTimeout(() => {
      setConnecting(false);
      setShowAddAccount(false);
      // In a real app, this would redirect to bank OAuth
      alert('Bank connection would redirect to your bank\'s secure login page');
    }, 2000);
  };

  const handleSyncAccount = async (accountId: string) => {
    // Simulate account sync
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, lastSync: new Date() }
        : account
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bank Accounts</h1>
          <p className="text-gray-400">
            Connect and manage your bank accounts for automatic transaction sync
          </p>
        </div>
        <Button
          onClick={() => setShowAddAccount(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Connect Bank
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${totalBalance.toFixed(2)}
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
                <p className="text-gray-400 text-sm">Connected</p>
                <p className="text-2xl font-bold text-blue-400">
                  {connectedAccounts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔗</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Sync</p>
                <p className="text-2xl font-bold text-purple-400">
                  {connectedAccounts.length > 0 ? 'Today' : 'Never'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Auto Sync</p>
                <p className="text-2xl font-bold text-orange-400">
                  {connectedAccounts.length > 0 ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
        
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <Card key={account.id} className="glass hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getAccountIcon(account.type)}</div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{account.name}</h3>
                        <p className="text-gray-400 text-sm">{account.institution}</p>
                        <p className="text-gray-500 text-xs">{account.accountNumber}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(account.status)}>
                      {getStatusText(account.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Balance</span>
                      <span className="text-white font-bold text-lg">
                        ${account.balance.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Type</span>
                      <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/20 capitalize">
                        {account.type}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last Sync</span>
                      <span className="text-white text-sm">
                        {account.lastSync.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncAccount(account.id)}
                      className="flex-1"
                    >
                      🔄 Sync Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      ⚙️ Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Bank Accounts Connected</h3>
              <p className="text-gray-400 mb-4">
                Connect your bank accounts to automatically sync transactions and get real-time balance updates.
              </p>
              <Button onClick={() => setShowAddAccount(true)} className="bg-blue-600 hover:bg-blue-700">
                Connect Your First Bank
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Supported Banks */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Supported Banks & Institutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'Chase', 'Bank of America', 'Wells Fargo', 'Citibank',
              'Capital One', 'American Express', 'Discover', 'US Bank',
              'PNC Bank', 'TD Bank', 'BB&T', 'SunTrust'
            ].map((bank, index) => (
              <div key={index} className="flex items-center justify-center p-4 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300 font-medium text-sm">{bank}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4 text-center">
            More than 10,000 banks and credit unions supported via Plaid integration
          </p>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Bank-Level Security</h4>
              <p className="text-gray-400 text-sm">
                All connections use bank-level encryption and security protocols
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👁️</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Read-Only Access</h4>
              <p className="text-gray-400 text-sm">
                We can only view your transactions, never make changes to your accounts
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🛡️</span>
              </div>
              <h4 className="font-semibold text-white mb-2">SOC 2 Compliant</h4>
              <p className="text-gray-400 text-sm">
                Our infrastructure meets the highest security and privacy standards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Account Modal */}
      {showAddAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddAccount(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Connect Bank Account</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  🔒 Your bank credentials are never stored. We use secure OAuth connections.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Select Your Bank
                </label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="">Search for your bank...</option>
                  <option value="chase">Chase Bank</option>
                  <option value="bofa">Bank of America</option>
                  <option value="wells">Wells Fargo</option>
                  <option value="citi">Citibank</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Account Types
                </label>
                <div className="space-y-2">
                  {(['checking', 'savings', 'credit'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                      <span className="text-white capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAccount(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConnectBank}
                  disabled={connecting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {connecting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </div>
                  ) : (
                    'Connect Bank'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 