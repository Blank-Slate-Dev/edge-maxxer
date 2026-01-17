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
      <div 
        className="grid grid-cols-3 gap-px rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--background)' }}>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Total Deposited</div>
          <div className="text-2xl font-mono" style={{ color: 'var(--danger)' }}>
            ${totals.totalDeposited.toFixed(2)}
          </div>
        </div>
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--background)' }}>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Total Withdrawn</div>
          <div className="text-2xl font-mono" style={{ color: 'var(--success)' }}>
            ${totals.totalWithdrawn.toFixed(2)}
          </div>
        </div>
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--background)' }}>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Net Profit/Loss</div>
          <div 
            className="text-2xl font-mono"
            style={{ color: totals.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {totals.netProfit >= 0 ? '+' : ''}${totals.netProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* My Accounts Section */}
      <div 
        className="border rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <button
          onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--surface-hover)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>My Betting Accounts</span>
            <span 
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                color: 'var(--muted)'
              }}
            >
              {activeAccounts.length} active
            </span>
          </div>
          {isAccountsExpanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          )}
        </button>

        {isAccountsExpanded && (
          <div 
            className="px-4 pb-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs py-3" style={{ color: 'var(--muted)' }}>
              Select the bookmakers you have accounts with. This helps track your bankroll across platforms.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BOOKMAKERS.map(bookie => {
                const isActive = accounts.find(a => a.bookmaker === bookie.key)?.isActive ?? false;
                return (
                  <button
                    key={bookie.key}
                    onClick={() => onToggleAccount(bookie.key)}
                    className="px-3 py-2 text-sm border transition-colors text-left rounded"
                    style={{
                      backgroundColor: isActive ? 'var(--foreground)' : 'transparent',
                      borderColor: isActive ? 'var(--foreground)' : 'var(--border)',
                      color: isActive ? 'var(--background)' : 'var(--muted)'
                    }}
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
        <div 
          className="border rounded-lg"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div 
            className="px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Account Balances</span>
          </div>
          <div 
            className="divide-y"
            style={{ borderColor: 'var(--border)' }}
          >
            {summaries.map(summary => (
              <div 
                key={summary.bookmaker} 
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {BOOKMAKERS.find(b => b.key === summary.bookmaker)?.name || summary.bookmaker}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>
                    {summary.transactionCount} transactions
                  </div>
                </div>
                <div className="text-right">
                  <div 
                    className="font-mono"
                    style={{ color: summary.netPosition >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {summary.netPosition >= 0 ? '+' : ''}${summary.netPosition.toFixed(2)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>
                    In: ${summary.totalDeposits.toFixed(0)} | Out: ${summary.totalWithdrawals.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Transaction */}
      <div 
        className="border rounded-lg"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)'
        }}
      >
        <div 
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Transactions</span>
          <button
            onClick={() => setIsAddingTransaction(!isAddingTransaction)}
            className="flex items-center gap-1 px-2 py-1 text-xs border transition-colors rounded"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted)'
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {isAddingTransaction && (
          <div 
            className="px-4 py-4 border-b space-y-4"
            style={{ 
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface-secondary)'
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  className="block text-xs uppercase tracking-wide mb-2"
                  style={{ color: 'var(--muted)' }}
                >
                  Bookmaker
                </label>
                <select
                  value={newTransaction.bookmaker}
                  onChange={e => setNewTransaction(prev => ({ ...prev, bookmaker: e.target.value }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none rounded"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
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
                <label 
                  className="block text-xs uppercase tracking-wide mb-2"
                  style={{ color: 'var(--muted)' }}
                >
                  Type
                </label>
                <select
                  value={newTransaction.type}
                  onChange={e => setNewTransaction(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none rounded"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  className="block text-xs uppercase tracking-wide mb-2"
                  style={{ color: 'var(--muted)' }}
                >
                  Amount
                </label>
                <div className="relative">
                  <span 
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  >$</span>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 pl-7 font-mono text-sm focus:outline-none rounded"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
              </div>
              <div>
                <label 
                  className="block text-xs uppercase tracking-wide mb-2"
                  style={{ color: 'var(--muted)' }}
                >
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={newTransaction.note}
                  onChange={e => setNewTransaction(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. Sign up bonus"
                  className="w-full px-3 py-2 text-sm focus:outline-none rounded"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTransaction}
                disabled={!newTransaction.bookmaker || !newTransaction.amount}
                className="px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed rounded"
                style={{
                  backgroundColor: (!newTransaction.bookmaker || !newTransaction.amount) ? 'var(--surface-secondary)' : 'var(--foreground)',
                  color: (!newTransaction.bookmaker || !newTransaction.amount) ? 'var(--muted)' : 'var(--background)'
                }}
              >
                Add Transaction
              </button>
              <button
                onClick={() => setIsAddingTransaction(false)}
                className="px-4 py-2 text-sm border transition-colors rounded"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--muted)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Transaction List */}
        {transactions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No transactions yet. Add your first deposit to start tracking.
          </div>
        ) : (
          <div 
            className="divide-y max-h-80 overflow-y-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            {transactions.slice(0, 50).map(txn => (
              <div 
                key={txn.id} 
                className="px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)] group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-1.5 rounded"
                    style={{
                      backgroundColor: txn.type === 'deposit' 
                        ? 'color-mix(in srgb, var(--danger) 15%, transparent)' 
                        : txn.type === 'withdrawal'
                          ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                          : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                      color: txn.type === 'deposit'
                        ? 'var(--danger)'
                        : txn.type === 'withdrawal'
                          ? 'var(--success)'
                          : 'var(--warning)'
                    }}
                  >
                    {txn.type === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : txn.type === 'withdrawal' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <Gift className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      {BOOKMAKERS.find(b => b.key === txn.bookmaker)?.name || txn.bookmaker}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      {txn.note && ` • ${txn.note}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="font-mono text-right"
                    style={{
                      color: txn.type === 'deposit' ? 'var(--danger)' : 'var(--success)'
                    }}
                  >
                    {txn.type === 'deposit' ? '-' : '+'}${txn.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => onDeleteTransaction(txn.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: 'var(--muted)' }}
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
