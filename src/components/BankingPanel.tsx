import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Landmark, 
  TrendingUp, 
  RefreshCw, 
  FileText, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  User, 
  ArrowRight, 
  UploadCloud,
  ArrowLeft,
  Star,
  Zap
} from "lucide-react";
import { 
  auth, 
  getCurrentUid, 
  getDailyLogs, 
  saveDailyLog, 
  deleteDailyLog, 
  getScrapedPayouts, 
  saveScrapedPayouts, 
  DailyLog, 
  ScrapedPayout 
} from "../firebase";

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

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [scrapedPayouts, setScrapedPayouts] = useState<ScrapedPayout[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [htmlPaste, setHtmlPaste] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const currentUser = auth?.currentUser;
  const partnerName = currentUser?.displayName || currentUser?.email || "Partner";

  useEffect(() => {
    const saved = localStorage.getItem("uber_fleet_banking_entries");
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    loadDailyAndPayouts();
  }, []);

  const loadDailyAndPayouts = async () => {
    try {
      const logs = await getDailyLogs();
      const payouts = await getScrapedPayouts();
      setDailyLogs(logs);
      setScrapedPayouts(payouts);
    } catch (e) {
      console.error(e);
    }
  };

  const showLocalToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const getWeekNumber = (dateStr: string): string => {
    const d = new Date(dateStr);
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return `${date.getFullYear()}-W${Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7) + 1}`;
  };

  const runPayoutsSync = async () => {
    setSyncing(true);
    setSyncLogs(["Initializing connections...", "Fetching daily reports..."]);
    
    setTimeout(async () => {
      try {
        setSyncLogs(prev => [
          ...prev, 
          "Launching browser window...", 
          "Please log in to your Uber Fleet account in the opened window...", 
          "Waiting for you to reach the wallet.uber.com payouts page..."
        ]);
        
        const response = await fetch("/api/sync/payouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid: getCurrentUid(),
            dailyLogs
          })
        });

        if (!response.ok) throw new Error("Server sync error");

        const data = await response.json();
        const scraped: ScrapedPayout[] = data.payouts;
        
        setSyncLogs(prev => [...prev, `Received ${scraped.length} payout transactions from Uber Portal.`, "Running smart matchmaking..."]);

        const currentUid = getCurrentUid();
        const existingPayouts = await getScrapedPayouts();
        const payoutDict: Record<string, ScrapedPayout> = {};
        
        existingPayouts.forEach(p => {
          payoutDict[p.transactionId] = p;
        });

        let matchCount = 0;
        let totalCredited = 0;

        scraped.forEach(p => {
          if (payoutDict[p.transactionId]) {
            return;
          }

          const matchingLog = dailyLogs.find(log => {
            const samePlate = log.vehiclePlate === p.vehiclePlate;
            const sameWeek = getWeekNumber(log.date) === getWeekNumber(p.settlementDate);
            return samePlate && sameWeek;
          });

          if (matchingLog) {
            p.attributedTo = currentUid;
            p.status = 'claimed';
            p.matchedLogIds = [matchingLog.id];
            matchCount++;
            totalCredited += p.amount;
            setSyncLogs(prev => [
              ...prev, 
              `✓ MATCH FOUND: Vehicle ${p.vehiclePlate} (BDT ${p.amount}) attributed to your wallet.`
            ]);
            payoutDict[p.transactionId] = p;
          }
        });

        await saveScrapedPayouts(Object.values(payoutDict));
        await loadDailyAndPayouts();
        window.dispatchEvent(new Event("scraped_payouts_updated"));

        setSyncLogs(prev => [
          ...prev, 
          "Sync complete!", 
          `Processed ${matchCount} matches. BDT ${totalCredited} credited to your ledger balance.`
        ]);
        showLocalToast("success", "Payout sync completed successfully!");
      } catch (err: any) {
        setSyncLogs(prev => [...prev, `❌ Error running sync: ${err?.message || err}`]);
        showLocalToast("error", "Scraper sync failed.");
      } finally {
        setSyncing(false);
      }
    }, 2000);
  };

  const parseRawHtmlPayout = () => {
    if (!htmlPaste.trim()) return;

    setSyncLogs(["Starting manual parser...", "Analyzing paste content..."]);
    
    const regex = /(Promotion\s*-\s*Congratulations![\s\S]*?\[Payment\s*ID\]:\s*[a-f0-9]+)/gi;
    
    const parsed: ScrapedPayout[] = [];
    let match;
    const textContent = htmlPaste;

    while ((match = regex.exec(textContent)) !== null) {
      const matchStr = match[1].trim().replace(/\s+/g, ' ');
      const amountMatch = matchStr.match(/BDT\s*([0-9,.]+)/i);
      const plateMatch = matchStr.match(/\b([A-Z]{3}-[A-Z]{3}-\d{6})\b/);
      const idMatch = matchStr.match(/\[Payment\s*ID\]:\s*([a-f0-9]+)/i);

      if (idMatch) {
        const amountVal = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500.0;
        const vehiclePlate = plateMatch ? plateMatch[1].toUpperCase() : "UNKNOWN";
        const transactionId = idMatch[1];
        
        parsed.push({
          transactionId,
          settlementDate: new Date().toISOString().split('T')[0],
          vehiclePlate,
          amount: amountVal,
          status: 'unclaimed',
          attributedTo: null,
          matchedLogIds: [],
          description: matchStr
        });
      }
    }

    if (parsed.length === 0) {
      const loosePlateRegex = /\b([A-Z]{3}-[A-Z]{3}-\d{6})\b/g;
      const looseAmountRegex = /BDT\s*([0-9,.]+)/i;
      
      const plates = textContent.match(loosePlateRegex) || [];
      const amountMatch = textContent.match(looseAmountRegex);
      const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500.0;

      plates.forEach((plate, idx) => {
        parsed.push({
          transactionId: `txn_parsed_${plate}_${Date.now()}_${idx}`,
          settlementDate: new Date().toISOString().split('T')[0],
          vehiclePlate: plate,
          amount: parsedAmount,
          status: 'unclaimed',
          attributedTo: null,
          matchedLogIds: [],
          description: `Promotion - Congratulations!, You have been paid Referral Incentive of BDT ${parsedAmount.toLocaleString()} for onboarding Vehicle ${plate} [Payment ID]: txn_parsed_${plate}_${Date.now()}_${idx}`
        });
      });
    }

    if (parsed.length === 0) {
      setSyncLogs(prev => [...prev, "❌ Parse failed: No vehicle plates or BDT payment records found in content."]);
      showLocalToast("error", "No valid payout data found in paste.");
      return;
    }

    setSyncLogs(prev => [...prev, `Successfully parsed ${parsed.length} transactions. Matching logs...`]);

    const currentUid = getCurrentUid();
    const localPayouts: Record<string, ScrapedPayout> = {};
    scrapedPayouts.forEach(p => {
      localPayouts[p.transactionId] = p;
    });

    let matches = 0;
    let credited = 0;

    parsed.forEach(p => {
      if (localPayouts[p.transactionId]) return;

      const matchingLog = dailyLogs.find(log => {
        const samePlate = log.vehiclePlate === p.vehiclePlate;
        const sameWeek = getWeekNumber(log.date) === getWeekNumber(p.settlementDate);
        return samePlate && sameWeek;
      });

      if (matchingLog) {
        p.attributedTo = currentUid;
        p.status = 'claimed';
        p.matchedLogIds = [matchingLog.id];
        matches++;
        credited += p.amount;
        setSyncLogs(prev => [...prev, `✓ MATCH FOUND: Vehicle ${p.vehiclePlate} (BDT ${p.amount}) attributed to your wallet.`]);
        localPayouts[p.transactionId] = p;
      }
    });

    saveScrapedPayouts(Object.values(localPayouts)).then(() => {
      loadDailyAndPayouts();
      window.dispatchEvent(new Event("scraped_payouts_updated"));
      setHtmlPaste("");
      setShowPasteArea(false);
      setSyncLogs(prev => [...prev, "Processing complete!", `Matched ${matches} payouts. BDT ${credited} added to your balance.`]);
      showLocalToast("success", `Parsed and matched ${matches} payouts.`);
    });
  };

  const myUid = getCurrentUid();
  const myClaimedPayouts = scrapedPayouts.filter(p => p.attributedTo === myUid && p.status === 'claimed');
  const myTotalBalance = myClaimedPayouts.reduce((sum, p) => sum + p.amount, 0);

  const getNextMondayStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
    const nextMonday = new Date(d.setDate(diff));
    return nextMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 font-sans select-none animate-enter text-[var(--text-strong)]">
      {/* Toast Alert popup */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border animate-slide-up ${
          toast.type === "success" ? "bg-zinc-950 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-zinc-100" :
          toast.type === "error" ? "bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border-red-200 dark:border-red-900/50" :
          "bg-blue-50 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
        }`}>
          {toast.type === "success" ? <CheckCircle size={16} className="text-white dark:text-black" /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 2-Column layout: Left: Uber Wallet replica, Right: Scraper Options */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN: Uber Wallet Replica */}
        <div className="lg:col-span-3 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
          
          {/* Card Header matching screenshot */}
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-full transition text-black dark:text-white">
              <ArrowLeft size={20} className="stroke-[2.5]" />
            </button>
            <h2 className="text-lg font-black text-black dark:text-white tracking-tight">Uber Wallet</h2>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-extrabold text-xs uppercase select-none border border-zinc-250 dark:border-zinc-700">
                {partnerName.substring(0, 2)}
              </div>
            </div>
          </div>

          {/* Balance display matching screenshot */}
          <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150/50 dark:border-zinc-800/40 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-widest block">Balance</span>
              <span className="text-3xl font-black text-black dark:text-white tracking-tight block">
                BDT {myTotalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 block">
                Payout scheduled: {getNextMondayStr()}
              </span>
            </div>
            
            <button className="flex items-center gap-1.5 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-extrabold rounded-full text-xs transition cursor-pointer">
              <Zap size={14} fill="currentColor" className="stroke-[1.5]" />
              <span>Cash out</span>
            </button>
          </div>

          {/* Transactions list grouped by date matching screenshot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Transactions</h3>
              <span className="text-[10px] font-bold text-zinc-400">Attributed: {myClaimedPayouts.length}</span>
            </div>

            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-1 no-scrollbar">
              {myClaimedPayouts.length === 0 ? (
                <div className="text-center py-20 text-zinc-450 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold">
                  No payout transactions synced. Click "Scrape Uber Wallet" on the right to start.
                </div>
              ) : (
                Object.entries(
                  myClaimedPayouts.reduce((groups: Record<string, ScrapedPayout[]>, payout) => {
                    const date = new Date(payout.settlementDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(payout);
                    return groups;
                  }, {} as Record<string, ScrapedPayout[]>)
                ).map(([date, payouts]) => {
                  const typedPayouts = payouts as ScrapedPayout[];
                  return (
                    <div key={date} className="space-y-3">
                      <h4 className="text-xs font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">{date}</h4>
                      <div className="space-y-3">
                        {typedPayouts.map(p => (
                          <div key={p.transactionId} className="flex gap-4 items-start">
                            
                            {/* Gear/Star Badge Circle */}
                            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <div className="w-5.5 h-5.5 rounded-full bg-zinc-200 dark:bg-zinc-700/80 flex items-center justify-center">
                                <Star size={10} className="text-zinc-650 dark:text-zinc-300 fill-zinc-600 dark:fill-zinc-300 stroke-[2]" />
                              </div>
                            </div>

                            {/* Payout Description */}
                            <div className="flex-1 text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-semibold tracking-wide">
                              {p.description || `Promotion - Congratulations!, You have been paid Referral Incentive of BDT ${p.amount.toLocaleString()} For onboarding Vehicle ${p.vehiclePlate} [Payment ID]: ${p.transactionId}`}
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Scraper control panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sync Trigger Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-black dark:text-white tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Sync Controls
             </h3>
            
            <button
              onClick={runPayoutsSync}
              disabled={syncing}
              className="w-full py-2.5 button-primary disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-xs font-extrabold rounded-full transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.97] border border-transparent"
            >
              <RefreshCw size={14} className={`stroke-[2.5] ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Scraping Uber Portal..." : "Scrape Uber Wallet"}</span>
            </button>

            <button
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="w-full py-2.5 button-secondary text-xs font-extrabold rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UploadCloud size={14} />
              <span>Paste Payout HTML Source</span>
            </button>
          </div>

          {/* Sync execution log output */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col min-h-[250px]">
            <h3 className="text-sm font-extrabold text-black dark:text-white tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3">
              Sync Diagnostics
            </h3>
            
            {showPasteArea ? (
              <div className="space-y-3 flex-1 flex flex-col">
                <textarea
                  placeholder="Paste raw HTML source of wallet.uber.com/transactions/payouts here..."
                  rows={6}
                  value={htmlPaste}
                  onChange={(e) => setHtmlPaste(e.target.value)}
                  className="w-full text-input rounded-none p-3 font-mono text-[11px] outline-none resize-none flex-1"
                />
                <div className="flex justify-end gap-2 text-xs font-bold">
                  <button
                    onClick={() => setShowPasteArea(false)}
                    className="px-4 py-2 button-secondary rounded-full cursor-pointer transition text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={parseRawHtmlPayout}
                    className="px-4 py-2 button-primary rounded-full cursor-pointer transition text-xs font-medium border border-transparent"
                  >
                    Parse Payouts
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-955/40 p-4 rounded-xl border border-zinc-150/40 dark:border-zinc-800/40 font-mono text-[10px] text-zinc-650 dark:text-zinc-300 space-y-1.5 overflow-y-auto max-h-[220px] no-scrollbar">
                {syncLogs.length === 0 ? (
                  <span className="text-zinc-400 dark:text-zinc-500 italic block">No diagnostics run yet. Click 'Scrape Uber Wallet' to trace.</span>
                ) : (
                  syncLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith("✓") ? "text-black dark:text-white font-bold" : log.startsWith("❌") ? "text-red-500 font-bold" : ""}>
                      &gt; {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
