// src/components/AccountsManager.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Wallet, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import type { BookmakerAccount, Transaction, AccountSummary } from '@/lib/accounts';
import { BOOKMAKERS, generateTransactionId, calculateAccountSummaries, getTotalBankroll } from '@/lib/accounts';

interface AccountsManagerProps {
  accounts: BookmakerAccount[];
  transactions: Transaction[];
  onToggleAccount: (bookmaker: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function AccountsManager({
  accounts,
  transactions,
  onToggleAccount,
  onAddTransaction,
  onDeleteTransaction,
}: AccountsManagerProps) {
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState<{
    bookmaker: string;
    type: 'deposit' | 'withdrawal' | 'bonus';
    amount: string;
    note: string;
  }>({
    bookmaker: '',
    type: 'deposit',
    amount: '',
    note: '',
  });

  const activeAccounts = accounts.filter(a => a.isActive);
  const summaries = calculateAccountSummaries(accounts, transactions);
  const totals = getTotalBankroll(summaries);

  const handleAddTransaction = () => {
    if (!newTransaction.bookmaker || !newTransaction.amount) return;

    const transaction: Transaction = {
      id: generateTransactionId(),
      accountId: accounts.find(a => a.bookmaker === newTransaction.bookmaker)?.id || '',
      bookmaker: newTransaction.bookmaker,
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      note: newTransaction.note || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(transaction);
    setNewTransaction({ bookmaker: '', type: 'deposit', amount: '', note: '' });
    setIsAddingTransaction(false);
  };

  return (
    <div className="space-y-6">
      {/* Totals Overview */}
      <div className="grid grid-cols-3 gap-px bg-[#222]">
        <div className="bg-black px-4 py-3">
          <div className="text-xs text-[#666] uppercase tracking-wide mb-1">Total Deposited</div>
          <div className="text-2xl font-mono text-[#aa6666]">
            ${totals.totalDeposited.toFixed(2)}
          </div>
        </div>
        <div className="bg-black px-4 py-3">
          <div className="text-xs text-[#666] uppercase tracking-wide mb-1">Total Withdrawn</div>
          <div className="text-2xl font-mono text-[#66aa66]">
            ${totals.totalWithdrawn.toFixed(2)}
          </div>
        </div>
        <div className="bg-black px-4 py-3">
          <div className="text-xs text-[#666] uppercase tracking-wide mb-1">Net Profit/Loss</div>
          <div className={`text-2xl font-mono ${totals.netProfit >= 0 ? 'text-[#66aa66]' : 'text-[#aa6666]'}`}>
            {totals.netProfit >= 0 ? '+' : ''}${totals.netProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* My Accounts Section */}
      <div className="border border-[#222] bg-[#0a0a0a]">
        <button
          onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#111] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4 text-[#666]" />
            <span className="text-sm font-medium">My Betting Accounts</span>
            <span className="text-xs px-2 py-0.5 bg-[#222] text-[#888]">
              {activeAccounts.length} active
            </span>
          </div>
          {isAccountsExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#666]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#666]" />
          )}
        </button>

        {isAccountsExpanded && (
          <div className="px-4 pb-4 border-t border-[#222]">
            <p className="text-xs text-[#666] py-3">
              Select the bookmakers you have accounts with. This helps track your bankroll across platforms.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BOOKMAKERS.map(bookie => {
                const isActive = accounts.find(a => a.bookmaker === bookie.key)?.isActive ?? false;
                return (
                  <button
                    key={bookie.key}
                    onClick={() => onToggleAccount(bookie.key)}
                    className={`px-3 py-2 text-sm border transition-colors text-left ${
                      isActive
                        ? 'bg-white text-black border-white'
                        : 'border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    {bookie.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Account Summaries */}
      {summaries.length > 0 && (
        <div className="border border-[#222] bg-[#0a0a0a]">
          <div className="px-4 py-3 border-b border-[#222]">
            <span className="text-sm font-medium">Account Balances</span>
          </div>
          <div className="divide-y divide-[#222]">
            {summaries.map(summary => (
              <div key={summary.bookmaker} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {BOOKMAKERS.find(b => b.key === summary.bookmaker)?.name || summary.bookmaker}
                  </div>
                  <div className="text-xs text-[#666]">
                    {summary.transactionCount} transactions
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono ${summary.netPosition >= 0 ? 'text-[#66aa66]' : 'text-[#aa6666]'}`}>
                    {summary.netPosition >= 0 ? '+' : ''}${summary.netPosition.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#666]">
                    In: ${summary.totalDeposits.toFixed(0)} | Out: ${summary.totalWithdrawals.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Transaction */}
      <div className="border border-[#222] bg-[#0a0a0a]">
        <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
          <span className="text-sm font-medium">Transactions</span>
          <button
            onClick={() => setIsAddingTransaction(!isAddingTransaction)}
            className="flex items-center gap-1 px-2 py-1 text-xs border border-[#333] text-[#888] hover:bg-[#111] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {isAddingTransaction && (
          <div className="px-4 py-4 border-b border-[#222] bg-[#111] space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                  Bookmaker
                </label>
                <select
                  value={newTransaction.bookmaker}
                  onChange={e => setNewTransaction(prev => ({ ...prev, bookmaker: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm focus:border-white focus:outline-none"
                >
                  <option value="">Select...</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.bookmaker} value={acc.bookmaker}>
                      {BOOKMAKERS.find(b => b.key === acc.bookmaker)?.name || acc.bookmaker}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                  Type
                </label>
                <select
                  value={newTransaction.type}
                  onChange={e => setNewTransaction(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm focus:border-white focus:outline-none"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 pl-7 font-mono text-sm focus:border-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wide mb-2">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={newTransaction.note}
                  onChange={e => setNewTransaction(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. Sign up bonus"
                  className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm focus:border-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTransaction}
                disabled={!newTransaction.bookmaker || !newTransaction.amount}
                className="px-4 py-2 text-sm bg-white text-black font-medium hover:bg-[#eee] transition-colors disabled:bg-[#333] disabled:text-[#666] disabled:cursor-not-allowed"
              >
                Add Transaction
              </button>
              <button
                onClick={() => setIsAddingTransaction(false)}
                className="px-4 py-2 text-sm border border-[#333] text-[#888] hover:bg-[#111] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Transaction List */}
        {transactions.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#666] text-sm">
            No transactions yet. Add your first deposit to start tracking.
          </div>
        ) : (
          <div className="divide-y divide-[#222] max-h-80 overflow-y-auto">
            {transactions.slice(0, 50).map(txn => (
              <div key={txn.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#111] group">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${
                    txn.type === 'deposit' 
                      ? 'bg-[#1a1616] text-[#aa6666]' 
                      : txn.type === 'withdrawal'
                        ? 'bg-[#161a16] text-[#66aa66]'
                        : 'bg-[#1a1a16] text-[#aaaa66]'
                  }`}>
                    {txn.type === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : txn.type === 'withdrawal' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <Gift className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {BOOKMAKERS.find(b => b.key === txn.bookmaker)?.name || txn.bookmaker}
                    </div>
                    <div className="text-xs text-[#666]">
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      {txn.note && ` • ${txn.note}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`font-mono text-right ${
                    txn.type === 'deposit' 
                      ? 'text-[#aa6666]' 
                      : 'text-[#66aa66]'
                  }`}>
                    {txn.type === 'deposit' ? '-' : '+'}${txn.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => onDeleteTransaction(txn.id)}
                    className="p-1 text-[#666] hover:text-[#aa6666] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
