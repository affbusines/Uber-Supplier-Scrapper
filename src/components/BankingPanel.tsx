import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Landmark, TrendingUp } from "lucide-react";

interface BankingEntry {
  id: string;
  weekStart: string;
  amount: number;
}

export default function BankingPanel() {
  const [entries, setEntries] = useState<BankingEntry[]>([]);
  const [weekStart, setWeekStart] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const saved = localStorage.getItem("uber_fleet_banking_entries");
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveEntries = (newEntries: BankingEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("uber_fleet_banking_entries", JSON.stringify(newEntries));
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStart || !amount || isNaN(Number(amount))) return;

    const newEntry: BankingEntry = {
      id: `bank_${Date.now()}`,
      weekStart,
      amount: parseFloat(amount),
    };

    const updated = [newEntry, ...entries].sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    saveEntries(updated);
    setWeekStart("");
    setAmount("");
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this weekly entry?")) {
      saveEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  // Group stats by month
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.weekStart);
    const entryMonthStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
    return entryMonthStr === selectedMonth;
  });

  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const averageWeekly = filteredEntries.length > 0 ? totalAmount / filteredEntries.length : 0;

  // Month selector options based on existing logs or default to current year months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const y = new Date().getFullYear();
    const m = String(i + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  return (
    <div className="space-y-6 font-sans select-none animate-enter text-[var(--text-strong)]">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#06C167] flex items-center justify-center shrink-0">
            <Landmark size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Total Month Payout</span>
            <span className="text-xl font-black text-black dark:text-white font-mono">
              BDT {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-650 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Weekly Average</span>
            <span className="text-xl font-black text-black dark:text-white font-mono">
              BDT {averageWeekly.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Selected Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none p-0 text-base font-extrabold text-black dark:text-white focus:ring-0 cursor-pointer outline-none block mt-0.5"
            >
              {monthOptions.map((opt) => {
                const date = new Date(opt + "-02");
                const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                return (
                  <option key={opt} value={opt} className="bg-white dark:bg-zinc-900 text-black dark:text-white">
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form Column */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-[16px] font-extrabold text-black dark:text-white tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
            Log Weekly Payout
          </h3>
          <form onSubmit={handleAddEntry} className="space-y-4 text-xs font-bold">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Week Start Date:
              </label>
              <input
                type="date"
                required
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-bold text-black dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Payout Amount (BDT):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500 font-bold">
                  BDT
                </span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 pl-11 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-mono font-bold text-black dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#06C167] hover:bg-[#05a858] text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Add Weekly Entry</span>
            </button>
          </form>
        </div>

        {/* Entries Log List Column */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-[16px] font-extrabold text-black dark:text-white tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
            Weekly Payout Entries ({filteredEntries.length})
          </h3>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-zinc-450 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold">
                No entries logged for this month yet.
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const date = new Date(entry.weekStart);
                const endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-black dark:text-white block">
                        Week: {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                        {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Logged on: {new Date(parseInt(entry.id.split("_")[1])).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-black dark:text-white">
                        BDT {entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
