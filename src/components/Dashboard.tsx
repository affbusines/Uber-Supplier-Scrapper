import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Driver } from "../types";
import Avatar from "./Avatar";
import {
  listenToDrivers,
  editDriver,
  deleteDriver,
  restoreDriver,
  dismissChangeFlag,
  startRewardTracking,
  resetReward,
  bulkDeleteDrivers,
  bulkStartRewardTracking,
  bulkResetReward,
  getGlobalSettings,
  getNotificationSettings,
  dismissRewardMilestone,
  getDailyLogs,
  saveDailyLog,
  deleteDailyLog,
  DailyLog,
  getCurrentUid,
  getScrapedPayouts,
  ScrapedPayout,
} from "../firebase";
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Eye,
  User,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  DollarSign,
  Briefcase,
  UserPlus,
  Menu,
  Car,
  Download,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface DashboardProps {
  activeSubView?: 'home' | 'drivers' | 'vehicles' | 'performance';
  onNavigate?: (tab: any) => void;
  onOpenMenu?: () => void;
}

export default function Dashboard({ activeSubView = 'home', onNavigate, onOpenMenu }: DashboardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    | "all"
    | "active"
    | "inactive"
    | "changed"
    | "rewards"
    | "milestones"
    | "most_trips"
    | "f10"
    | "f50"
    | "status_active"
    | "status_rejected"
    | "status_applied"
  >("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<"trips_desc" | "trips_asc" | "name_asc" | "newest_desc">("trips_desc");
  
  // Sub-tabs state
  const [driversSubTab, setDriversSubTab] = useState<'drivers' | 'invites'>('drivers');
  const [performanceSubTab, setPerformanceSubTab] = useState<'drivers' | 'vehicles'>('drivers');
  
  // Driver Details State
  const [currentDriverDetail, setCurrentDriverDetail] = useState<Driver | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'rewards'>('info');

  // Modals & Action States
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);

  // States for Reward Tracking
  const [rewardTrackingDriver, setRewardTrackingDriver] = useState<Driver | null>(null);
  const [rewardCycleInput, setRewardCycleInput] = useState<number>(52);
  const [resetConfirmationDriver, setResetConfirmationDriver] = useState<Driver | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkResetModal, setShowBulkResetModal] = useState(false);
  const [showBulkStartModal, setShowBulkStartModal] = useState(false);
  const [bulkStartCycleSize, setBulkStartCycleSize] = useState(52);

  // Active Dropdown Menu index on drivers list
  const [activeMenuDriverId, setActiveMenuDriverId] = useState<string | null>(null);

  // Download dropdown state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Vehicles search state
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [vehiclesFilterMode, setVehiclesFilterMode] = useState<"all" | "active">("all");

  // Daily reports state
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [dailyPlate, setDailyPlate] = useState("");
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');
  const [bulkPlates, setBulkPlates] = useState("");
  const [scrapedPayouts, setScrapedPayouts] = useState<ScrapedPayout[]>([]);

  // ── INCOGNITO PRIVACY SHIELD STATE & HELPERS ──
  const [privacyShield, setPrivacyShield] = useState<boolean>(
    localStorage.getItem('privacy_shield') === 'true'
  );
  
  const togglePrivacyShield = () => {
    const nextVal = !privacyShield;
    setPrivacyShield(nextVal);
    localStorage.setItem('privacy_shield', String(nextVal));
  };
  
  const shieldClass = (base = "") => 
    privacyShield 
      ? `${base} filter blur-[4.5px] select-none hover:blur-none transition-all duration-200 cursor-help` 
      : base;

  const renderIncognitoButton = () => {
    return (
      <button
        onClick={togglePrivacyShield}
        className={`interactive-button p-1.5 rounded-md transition-all duration-300 flex items-center justify-center ${
          privacyShield 
            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 ring-2 ring-amber-300 dark:ring-amber-800' 
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white'
        }`}
        title={privacyShield ? "Disable Privacy Shield" : "Enable Privacy Shield (Blur Personal Data)"}
      >
        {privacyShield ? (
          <ShieldAlert size={22} className="stroke-[2.5]" />
        ) : (
          <ShieldCheck size={22} className="stroke-[2.5]" />
        )}
      </button>
    );
  };

  // Mock Vehicles list data matching Screenshot 1
  const [vehicles, setVehicles] = useState([
    {
      id: "veh-1",
      name: "2013 Toyota Corolla Axio",
      photo: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      plate: "DHK-GA-39-7674",
      assignment: "Unassigned",
    },
    {
      id: "veh-2",
      name: "2015 Toyota Prius Hybrid",
      photo: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      plate: "DHK-GA-42-8109",
      assignment: "MD. SHAFIQUL ISLAM",
    }
  ]);

  // Selected checkboxes on tables
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Functional pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Vehicles pagination state
  const [vehiclesCurrentPage, setVehiclesCurrentPage] = useState(1);
  const [vehiclesRowsPerPage, setVehiclesRowsPerPage] = useState(10);

  useEffect(() => {
    const unsub = listenToDrivers((list) => {
      setDrivers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadDailyLogs = async () => {
    try {
      const logs = await getDailyLogs();
      setDailyLogs(logs);
      const payouts = await getScrapedPayouts();
      setScrapedPayouts(payouts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDailyLogs();
    window.addEventListener("daily_logs_updated", loadDailyLogs);
    window.addEventListener("scraped_payouts_updated", loadDailyLogs);
    return () => {
      window.removeEventListener("daily_logs_updated", loadDailyLogs);
      window.removeEventListener("scraped_payouts_updated", loadDailyLogs);
    };
  }, []);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, sortBy, showDeleted]);

  const showToast = (type: "success" | "info" | "error", msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // stats calculations
  const activeDrivers = drivers.filter((d) => !d.deleted);
  const onlineCount = activeDrivers.length;
  
  // added today count
  const addedTodayCount = drivers.filter(d => 
    !d.deleted && d.first_seen && new Date(d.first_seen).toDateString() === new Date().toDateString()
  ).length;

  // active rewards count
  const activeRewardsCount = drivers.filter(d => !d.deleted && d.reward?.active).length;

  // milestones reached count
  const milestonesCount = drivers.filter(d => {
    if (d.deleted || !d.reward?.active) return false;
    const currentCycleTrips = d.tip_count - d.reward.start_tip_count;
    const hasF10 = currentCycleTrips >= 10 && !d.reward.f10_done;
    const hasF50 = currentCycleTrips >= 50 && !d.reward.f50_done;
    return hasF10 || hasF50;
  }).length;

  // contact changes count
  const contactChangesCount = drivers.filter(d => !d.deleted && d.has_contact_change).length;

  // Filter & Search Logic for Drivers
  const filteredDrivers = drivers.filter((drv) => {
    if (!showDeleted && drv.deleted) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ? true : (
      drv.name.toLowerCase().includes(q) ||
      drv.uuid.toLowerCase().includes(q) ||
      drv.phone.includes(q) ||
      drv.email.toLowerCase().includes(q) ||
      (drv.old_phone && drv.old_phone.includes(q)) ||
      (drv.old_email && drv.old_email.toLowerCase().includes(q))
    );

    if (filterMode === "changed") return matchesQuery && drv.has_contact_change && !drv.deleted;
    if (filterMode === "status_active") return matchesQuery && (drv.status === 'Active' || !drv.status) && !drv.deleted;
    if (filterMode === "status_rejected") return matchesQuery && drv.status === 'Rejected' && !drv.deleted;
    if (filterMode === "status_applied") return matchesQuery && drv.status === 'Applied' && !drv.deleted;
    if (filterMode === "rewards") return matchesQuery && drv.reward?.active && !drv.deleted;
    if (filterMode === "milestones") {
      if (drv.deleted || !drv.reward?.active) return false;
      const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
      const hasF10 = currentCycleTrips >= 10 && !drv.reward.f10_done;
      const hasF50 = currentCycleTrips >= 50 && !drv.reward.f50_done;
      return matchesQuery && (hasF10 || hasF50);
    }
    if (filterMode === "f10") {
      if (drv.deleted || !drv.reward?.active) return false;
      const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
      return matchesQuery && currentCycleTrips >= 10;
    }
    if (filterMode === "f50") {
      if (drv.deleted || !drv.reward?.active) return false;
      const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
      return matchesQuery && currentCycleTrips >= 50;
    }
    if (filterMode === "most_trips") return matchesQuery && drv.tip_count >= 150 && !drv.deleted;
    if (filterMode === "active") return matchesQuery && !drv.deleted;
    if (filterMode === "inactive") return matchesQuery && drv.deleted;
    return matchesQuery && !drv.deleted;
  });

  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "trips_asc") return a.tip_count - b.tip_count;
    if (sortBy === "newest_desc") return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
    return b.tip_count - a.tip_count; // default: trips_desc
  });

  const paginatedDrivers = sortedDrivers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(sortedDrivers.length / rowsPerPage));

  // Vehicles filtered & paginated list
  const filteredVehicles = vehicles.filter(v => {
    const q = vehicleSearchQuery.toLowerCase().trim();
    return !q ? true : (
      v.name.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q)
    );
  });
  const paginatedVehicles = filteredVehicles.slice((vehiclesCurrentPage - 1) * vehiclesRowsPerPage, vehiclesCurrentPage * vehiclesRowsPerPage);
  const vehiclesTotalPages = Math.max(1, Math.ceil(filteredVehicles.length / vehiclesRowsPerPage));

  // HTML Report Export (Driver Cards with profile images)
  const handleHTMLReportExport = (driversToExport: Driver[]) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const fileDate = today.toISOString().slice(0, 10);

    // Calculate top counts for filter stats
    const totalCount = driversToExport.length;
    const f10Count = driversToExport.filter(d => d.reward?.active && (d.reward.f10_done || (d.tip_count - d.reward.start_tip_count) >= 10)).length;
    const f50Count = driversToExport.filter(d => d.reward?.active && (d.reward.f50_done || (d.tip_count - d.reward.start_tip_count) >= 50)).length;
    const contactChangeCount = driversToExport.filter(d => d.has_contact_change || d.old_email || d.old_phone).length;

    const cardsHTML = driversToExport.map(d => {
      const currentCycleTrips = d.reward?.active ? (d.tip_count - d.reward.start_tip_count) : 0;
      const isF10 = d.reward?.active && (d.reward.f10_done || currentCycleTrips >= 10);
      const isF50 = d.reward?.active && (d.reward.f50_done || currentCycleTrips >= 50);
      const isChanged = d.has_contact_change || d.old_email || d.old_phone;

      const f10Status = !d.reward?.active
        ? "N/A"
        : isF10
        ? "✅ Completed"
        : `${currentCycleTrips}/10 Trips`;
      const f50Status = !d.reward?.active
        ? "N/A"
        : isF50
        ? "✅ Completed"
        : `${currentCycleTrips}/50 Trips`;
      const rewardBadge = !d.reward?.active
        ? `<span style='color:#9ca3af'>Inactive</span>`
        : d.reward.completed
        ? `<span style='color:#06C167;font-weight:800'>🎉 Complete</span>`
        : `<span style='color:#6366f1;font-weight:800'>Active</span>`;

      const photoHTML = d.photo_url
        ? `<img src="${d.photo_url}" alt="${d.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
           <div class="no-photo" style="display:none">${(d.name || '?')[0]}</div>`
        : `<div class="no-photo">${(d.name || '?')[0]}</div>`;

      return `
        <div class="card" data-f10="${isF10 ? 'true' : 'false'}" data-f50="${isF50 ? 'true' : 'false'}" data-changed="${isChanged ? 'true' : 'false'}">
          <div class="card-photo">${photoHTML}</div>
          <div class="card-body">
            <div class="driver-name">${d.name || 'UNNAMED DRIVER'}</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">🔑 UUID</span><span class="value">${d.uuid || '—'}</span></div>
              <div class="detail-item" ${d.old_phone ? 'style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 2px 6px;"' : ''}><span class="label">📞 Phone</span><span class="value">${d.phone || '—'}</span></div>
              <div class="detail-item" ${d.old_email ? 'style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 2px 6px;"' : ''}><span class="label">✉️ Email</span><span class="value">${d.email || '—'}</span></div>
              ${d.old_phone ? `<div class="detail-item"><span class="label" style="color: #d97706">⚠️ Old Phone</span><span class="value" style="color: #b45309; text-decoration: line-through;">${d.old_phone}</span></div>` : ''}${d.old_email ? `<div class="detail-item"><span class="label" style="color: #d97706">⚠️ Old Email</span><span class="value" style="color: #b45309; text-decoration: line-through;">${d.old_email}</span></div>` : ''}
              <div class="detail-item"><span class="label">🚗 Total Trips</span><span class="value trips">${d.tip_count}</span></div>
              <div class="detail-item"><span class="label">🎁 Reward</span><span class="value">${rewardBadge}</span></div>
              <div class="detail-item"><span class="label">🏅 F10 Status</span><span class="value">${f10Status}</span></div>
              <div class="detail-item"><span class="label">🏆 F50 Status</span><span class="value">${f50Status}</span></div>
              <div class="detail-item"><span class="label">📅 First Seen</span><span class="value">${d.first_seen ? new Date(d.first_seen).toLocaleDateString('en-GB') : 'N/A'}</span></div>
              <div class="detail-item"><span class="label">🔄 Last Updated</span><span class="value">${d.last_updated ? new Date(d.last_updated).toLocaleDateString('en-GB') : 'N/A'}</span></div>
            </div>
          </div>
        </div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fleet Drivers Report — ${dateStr}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; padding: 32px 24px; }
  .report-header { text-align: center; margin-bottom: 28px; }
  .report-header h1 { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .report-header p { font-size: 14px; color: #64748b; margin-top: 6px; }
  .report-header .badge { display:inline-block; margin-top:10px; background:#6366f1; color:#fff; padding:4px 14px; border-radius:999px; font-size:12px; font-weight:700; }
  
  /* Filter Container and Cards */
  .filter-container { display: flex; justify-content: center; gap: 14px; max-width: 1200px; margin: 0 auto 32px auto; flex-wrap: wrap; }
  .filter-card { background: #fff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 12px 18px; min-width: 160px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 180ms cubic-bezier(0.23, 1, 0.32, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.03); user-select: none; }
  .filter-card:hover { border-color: #cbd5e1; transform: translateY(-1.5px); }
  .filter-card:active { transform: scale(0.97); }
  .filter-card.active { border-color: #6366f1; background: #f5f3ff; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12); }
  .filter-card.active .filter-title { color: #4f46e5; }
  .filter-card.active .filter-count { color: #4f46e5; }
  .filter-title { font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .filter-count { font-size: 22px; font-weight: 800; color: #1e293b; }

  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
  .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); display: flex; gap: 20px; padding: 20px; page-break-inside: avoid; border: 1px solid #e2e8f0; }
  .card-photo { flex-shrink: 0; }
  .card-photo img { width: 100px; height: 100px; border-radius: 12px; object-fit: cover; border: 3px solid #e2e8f0; }
  .no-photo { width: 100px; height: 100px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 38px; font-weight: 800; color: #fff; }
  .card-body { flex: 1; min-width: 0; }
  .driver-name { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
  .detail-item { display: flex; flex-direction: column; }
  .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 13px; font-weight: 600; color: #334155; margin-top: 1px; word-break: break-all; }
  .trips { font-size: 16px; font-weight: 800; color: #6366f1; }
  .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
  @media print {
    body { background: white; padding: 16px; }
    .card { box-shadow: none; border: 1px solid #e2e8f0; }
    .filter-container { display: none; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <h1>🚗 Fleet Drivers Report</h1>
    <p>Generated on ${dateStr}</p>
  </div>
  
  <div class="filter-container">
    <div class="filter-card active" onclick="filterDrivers('all', this)">
      <span class="filter-title">👥 All Drivers</span>
      <span class="filter-count">${totalCount}</span>
    </div>
    <div class="filter-card" onclick="filterDrivers('f10', this)">
      <span class="filter-title">🏅 10 Trips Completed</span>
      <span class="filter-count">${f10Count}</span>
    </div>
    <div class="filter-card" onclick="filterDrivers('f50', this)">
      <span class="filter-title">🏆 50 Trips Completed</span>
      <span class="filter-count">${f50Count}</span>
    </div>
    <div class="filter-card" onclick="filterDrivers('changed', this)">
      <span class="filter-title">⚠️ Mail Change</span>
      <span class="filter-count">${contactChangeCount}</span>
    </div>
  </div>

  <div class="cards-grid">
${cardsHTML}
  </div>
  <div class="footer">Fleet Management System &mdash; Generated ${new Date().toLocaleString()}</div>

  <script>
    function filterDrivers(type, element) {
      // Update active class on filter cards
      const cards = document.querySelectorAll('.filter-card');
      cards.forEach(c => c.classList.remove('active'));
      element.classList.add('active');

      // Filter driver cards
      const driverCards = document.querySelectorAll('.card');
      driverCards.forEach(card => {
        if (type === 'all') {
          card.style.display = 'flex';
        } else if (type === 'f10') {
          card.style.display = card.getAttribute('data-f10') === 'true' ? 'flex' : 'none';
        } else if (type === 'f50') {
          card.style.display = card.getAttribute('data-f50') === 'true' ? 'flex' : 'none';
        } else if (type === 'changed') {
          card.style.display = card.getAttribute('data-changed') === 'true' ? 'flex' : 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet_drivers_report_${fileDate}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', `Exported ${driversToExport.length} driver cards to HTML report.`);
  };

  // CSV Export utility
  const handleCSVExport = (driversToExport: Driver[]) => {
    let csvContent = "UUID,Name,Phone,Email,Old Phone,Old Email,Trip Count,F10 Status,F50 Status,First Seen,Last Updated,Source\n";
    driversToExport.forEach(d => {
      const currentCycleTrips = d.reward?.active ? (d.tip_count - d.reward.start_tip_count) : 0;
      const f10Status = !d.reward?.active 
        ? "N/A" 
        : d.reward.f10_done 
        ? "Done" 
        : currentCycleTrips >= 10 
        ? "Pending" 
        : `${currentCycleTrips}/10 Trips`;

      const f50Status = !d.reward?.active 
        ? "N/A" 
        : d.reward.f50_done 
        ? "Done" 
        : currentCycleTrips >= 50 
        ? "Pending" 
        : `${currentCycleTrips}/50 Trips`;

      const row = [
        d.uuid,
        d.name,
        d.phone,
        d.email,
        d.old_phone || "",
        d.old_email || "",
        d.tip_count,
        f10Status,
        f50Status,
        d.first_seen ? new Date(d.first_seen).toISOString() : "",
        d.last_updated ? new Date(d.last_updated).toISOString() : "",
        d.source || "auto_sync"
      ].map(v => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`).join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const formattedDate = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `fleet_drivers_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", `Exported ${driversToExport.length} records to CSV.`);
  };

  const handleSelectAll = (visibleDrivers: Driver[]) => {
    const allSelected = visibleDrivers.every(d => selectedIds.has(d.uuid));
    const next = new Set(selectedIds);
    if (allSelected) {
      visibleDrivers.forEach(d => next.delete(d.uuid));
    } else {
      visibleDrivers.forEach(d => next.add(d.uuid));
    }
    setSelectedIds(next);
  };

  const handleToggleRow = (uuid: string) => {
    const next = new Set(selectedIds);
    if (next.has(uuid)) {
      next.delete(uuid);
    } else {
      next.add(uuid);
    }
    setSelectedIds(next);
  };

  // ────────────────────────────────────────────────────────
  // 1. HOME VIEW (SCREENSHOT 1 & ORIGINAL TABLE DASHBOARD RESTORED)
  // ────────────────────────────────────────────────────────
  const renderHomeView = () => {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
        {/* Header */}
        <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onOpenMenu} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <Menu size={24} className="text-black dark:text-white" />
            </button>
            <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Drivers Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {renderIncognitoButton()}
            {/* Download Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowDownloadMenu(prev => !prev)}
                className="interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white"
                title="Download Options"
              >
                <Download size={22} className="stroke-[2.5]" />
              </button>
              {showDownloadMenu && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Download Options</span>
                    </div>
                    <button
                      onClick={() => {
                        handleCSVExport(sortedDrivers);
                        setShowDownloadMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                    >
                      <span className="text-lg">📊</span>
                      <div>
                        <div className="text-sm font-bold text-black dark:text-white">Export CSV</div>
                        <div className="text-[11px] text-zinc-400">Spreadsheet format</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleHTMLReportExport(sortedDrivers);
                        setShowDownloadMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <span className="text-lg">🪪</span>
                      <div>
                        <div className="text-sm font-bold text-black dark:text-white">HTML Report (with Photos)</div>
                        <div className="text-[11px] text-zinc-400">Detailed report with photos</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 space-y-7 pb-24 pt-6 w-full mx-auto">
          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Drivers Card */}
            <div
              onClick={() => {
                setFilterMode('all');
                document.getElementById('drivers-list-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-[96px] interactive-button ${
                filterMode === 'all' || filterMode === 'active'
                  ? 'border-black bg-zinc-50 dark:border-white dark:bg-zinc-900'
                  : 'border-zinc-150 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950'
              }`}
            >
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Drivers</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-black dark:text-white font-mono">{onlineCount}</span>
                {addedTodayCount > 0 && (
                  <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                    +{addedTodayCount} today
                  </span>
                )}
              </div>
            </div>

            {/* Active Rewards Card */}
            <div
              onClick={() => {
                setFilterMode('rewards');
                document.getElementById('drivers-list-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-[96px] interactive-button ${
                filterMode === 'rewards'
                  ? 'border-black bg-zinc-50 dark:border-white dark:bg-zinc-900'
                  : 'border-zinc-150 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950'
              }`}
            >
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Rewards</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-black dark:text-white font-mono">{activeRewardsCount}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-650 animate-pulse"></span>
              </div>
            </div>

            {/* Milestones Reached Card */}
            <div
              onClick={() => {
                setFilterMode('milestones');
                document.getElementById('drivers-list-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-[96px] interactive-button ${
                filterMode === 'milestones'
                  ? 'border-black bg-zinc-50 dark:border-white dark:bg-zinc-900'
                  : 'border-zinc-150 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950'
              }`}
            >
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Milestones Reached</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-black dark:text-white font-mono">{milestonesCount}</span>
                {milestonesCount > 0 && (
                  <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full animate-bounce">
                    Action Required
                  </span>
                )}
              </div>
            </div>

            {/* Contact Changes Card */}
            <div
              onClick={() => {
                setFilterMode('changed');
                document.getElementById('drivers-list-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-[96px] interactive-button ${
                filterMode === 'changed'
                  ? 'border-black bg-zinc-50 dark:border-white dark:bg-zinc-900'
                  : 'border-zinc-150 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950'
              }`}
            >
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Changes</span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-3xl font-black text-black dark:text-white">{contactChangesCount}</span>
                {contactChangesCount > 0 && (
                  <span className="text-[10px] text-red-650 font-extrabold bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                    Review
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div id="drivers-list-section" className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Search bar */}
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search drivers by name, UUID, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl p-2.5 pl-9.5 text-xs font-semibold focus:ring-1 focus:ring-black dark:focus:ring-white outline-none text-black dark:text-white"
                />
              </div>
            </div>

            {/* Filter pills & Sort options */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full shrink-0">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filterMode === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterMode('f10')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filterMode === 'f10'
                      ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  F10
                </button>
                <button
                  onClick={() => setFilterMode('f50')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filterMode === 'f50'
                      ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  F50
                </button>
              </div>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border-none rounded-xl p-2.5 px-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none cursor-pointer"
              >
                <option value="trips_desc">Sort: High Trips</option>
                <option value="trips_asc">Sort: Low Trips</option>
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="newest_desc">Sort: Newest Synced</option>
              </select>
            </div>
          </div>

          {/* High Density Drivers Data Table */}
          <div className="hidden md:block overflow-x-auto border border-zinc-150 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-xs">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider select-none">
                  <th className="w-10 text-center py-3.5">
                    <input
                      type="checkbox"
                      checked={paginatedDrivers.length > 0 && paginatedDrivers.every(d => selectedIds.has(d.uuid))}
                      onChange={() => handleSelectAll(paginatedDrivers)}
                      className="w-4 h-4 rounded border-zinc-300 text-black accent-black cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 font-bold">Driver Info</th>
                  <th className="py-3.5 font-bold">Trips</th>
                  <th className="py-3.5 font-bold">Contact Info</th>
                  <th className="py-3.5 font-bold">Reward Cycles Status</th>
                  <th className="py-3.5 font-bold">Milestone Payout Approval</th>
                  <th className="py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <RefreshCw className="animate-spin text-zinc-500 mx-auto mb-2" size={24} />
                      <span>Loading drivers database...</span>
                    </td>
                  </tr>
                ) : paginatedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <p className="text-sm font-bold text-black dark:text-white">No Drivers Found</p>
                      <p className="text-xs text-zinc-500 mt-1">Try resetting filters or sync your Uber supplier portal.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDrivers.map((drv) => {
                    const isSelected = selectedIds.has(drv.uuid);
                    return (
                      <tr 
                        key={drv.uuid} 
                        className={`hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition ${
                          drv.deleted ? 'bg-red-50/10 dark:bg-red-950/5' : ''
                        } ${isSelected ? 'bg-zinc-50/60 dark:bg-zinc-900/10' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="text-center py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(drv.uuid)}
                            className="w-4 h-4 rounded border-zinc-300 text-black accent-black cursor-pointer"
                          />
                        </td>

                        {/* Driver Info */}
                        <td className="py-4">
                          <div 
                            onClick={() => {
                              setCurrentDriverDetail(drv);
                              setDetailTab('info');
                              onNavigate('drivers');
                            }}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <Avatar 
                              photoUrl={drv.photo_url} 
                              name={drv.name} 
                              size={40} 
                              className="rounded-full border border-zinc-200 object-cover bg-zinc-100 shadow-xs shrink-0 group-hover:border-zinc-400 transition" 
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-extrabold text-[14px] text-black dark:text-white uppercase tracking-tight leading-tight group-hover:underline">
                                {drv.name || "UNNAMED DRIVER"}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={shieldClass("text-[9.5px] text-zinc-400 font-mono tracking-wider truncate max-w-[145px]")}>
                                  {drv.uuid}
                                </span>
                                {drv.status && (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase select-none ${
                                    drv.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' :
                                    drv.status === 'Applied' ? 'text-blue-500 dark:text-blue-400' :
                                    drv.status === 'Waitlisted' ? 'text-amber-500 dark:text-amber-400' :
                                    'text-red-500 dark:text-red-400'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      drv.status === 'Active' ? 'bg-emerald-500 animate-pulse' :
                                      drv.status === 'Applied' ? 'bg-blue-500' :
                                      drv.status === 'Waitlisted' ? 'bg-amber-500' :
                                      'bg-red-500'
                                    }`} />
                                    {drv.status}
                                  </span>
                                )}
                                {drv.flow && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase select-none bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/80">
                                    {drv.flow}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Trips */}
                        <td className="py-4 font-mono font-bold text-black dark:text-white">
                          {drv.tip_count}
                        </td>

                        {/* Contact Info */}
                        <td className="py-4">
                          <div className="flex flex-col gap-2">
                            {/* Phone */}
                            <div>
                              {drv.old_phone && drv.old_phone !== drv.phone ? (
                                <div className="flex flex-col">
                                  <span className={shieldClass("bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded p-0.5 px-1.5 font-mono text-[11.5px] font-bold inline-flex items-center gap-1 select-all w-max")}>
                                    <AlertTriangle size={10} className="text-amber-600 shrink-0" />
                                    {drv.phone}
                                  </span>
                                  <span className={shieldClass("line-through text-zinc-400 dark:text-zinc-650 text-[10.5px] font-mono font-medium block mt-0.5 pl-1.5")}>
                                    Old: {drv.old_phone}
                                  </span>
                                </div>
                              ) : (
                                <span className={shieldClass("text-[12px] font-mono font-bold text-zinc-800 dark:text-zinc-200 select-all")}>
                                  {drv.phone || "—"}
                                </span>
                              )}
                            </div>

                            {/* Email */}
                            <div>
                              {drv.old_email && drv.old_email !== drv.email ? (
                                <div className="flex flex-col">
                                  <span className={shieldClass("bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded p-0.5 px-1.5 text-[11.5px] font-bold inline-flex items-center gap-1 select-all max-w-[180px] truncate w-max")}>
                                    <AlertTriangle size={10} className="text-amber-600 shrink-0" />
                                    {drv.email}
                                  </span>
                                  <span className={shieldClass("line-through text-zinc-400 dark:text-zinc-500 text-[10.5px] font-medium block mt-0.5 pl-1.5 truncate max-w-[180px]")}>
                                    Old: {drv.old_email}
                                  </span>
                                </div>
                              ) : (
                                <span className={shieldClass("text-[12px] font-medium text-zinc-600 dark:text-zinc-400 select-all truncate max-w-[180px] block")}>
                                  {drv.email || "—"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Reward Cycles Status */}
                        <td className="py-4">
                          {!drv.reward || !drv.reward.active ? (
                            <button
                              onClick={() => {
                                setRewardTrackingDriver(drv);
                                setRewardCycleInput(52);
                              }}
                              className="interactive-button px-3 py-1.5 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer select-none w-max"
                            >
                              <span>▶ Start Reward</span>
                            </button>
                          ) : drv.reward.completed ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#06C167] border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max select-none">
                              <span>🎉 Reward Complete!</span>
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 select-none">
                              {drv.reward.trips_remaining <= 5 ? (
                                <span className="bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[11.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max animate-pulse">
                                  <span>⚡ {drv.reward.trips_remaining} trips left</span>
                                </span>
                              ) : drv.reward.trips_remaining <= 20 ? (
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[11.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max">
                                  <span>🔥 {drv.reward.trips_remaining} trips left</span>
                                </span>
                              ) : (
                                <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 border border-transparent text-[11.5px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 w-max">
                                  <span>⏳ {drv.reward.trips_remaining} trips left</span>
                                </span>
                              )}
                              <span className="text-[9px] text-zinc-400 font-bold pl-1 uppercase font-mono tracking-wider">
                                target: {drv.reward.next_reward_at} trips
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Milestone Payout Action */}
                        <td className="py-4">
                          {(() => {
                            if (!drv.reward || !drv.reward.active) return <span className="text-zinc-400 font-bold">—</span>;
                            const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
                            const hasF10 = currentCycleTrips >= 10 && !drv.reward.f10_done;
                            const hasF50 = currentCycleTrips >= 50 && !drv.reward.f50_done;

                            if (!hasF10 && !hasF50) return <span className="text-zinc-400 font-bold">—</span>;

                            return (
                              <div className="flex flex-col gap-1.5 select-none">
                                {hasF10 && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await dismissRewardMilestone(drv.uuid, 'f10');
                                        showToast("success", `F10 Milestone payout approved for ${drv.name}`);
                                      } catch (err) {
                                        showToast("error", "Milestone payout approval failed.");
                                      }
                                    }}
                                    className="interactive-button px-2.5 py-1 bg-[#06C167] hover:bg-[#05a858] text-white text-[10px] font-black rounded-md shadow-xs cursor-pointer flex items-center gap-0.5 justify-center w-max uppercase tracking-wider"
                                  >
                                    <span>Done F10</span>
                                  </button>
                                )}
                                {hasF50 && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await dismissRewardMilestone(drv.uuid, 'f50');
                                        showToast("success", `F50 Milestone payout approved for ${drv.name}`);
                                      } catch (err) {
                                        showToast("error", "Milestone payout approval failed.");
                                      }
                                    }}
                                    className="interactive-button px-2.5 py-1 bg-[#06C167] hover:bg-[#05a858] text-white text-[10px] font-black rounded-md shadow-xs cursor-pointer flex items-center gap-0.5 justify-center w-max uppercase tracking-wider"
                                  >
                                    <span>Done F50</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {/* Dismiss Contact Warning */}
                            {drv.has_contact_change && (
                              <button
                                onClick={async () => {
                                  try {
                                    await dismissChangeFlag(drv.uuid);
                                    showToast("success", `Approved contact changes for ${drv.name}`);
                                  } catch (_) {
                                    showToast("error", "Failed approving contact changes.");
                                  }
                                }}
                                className="interactive-button w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center cursor-pointer"
                                title="Approve Contact Change"
                              >
                                <Check size={14} className="stroke-[2.5]" />
                              </button>
                            )}

                            {/* Reset active reward */}
                            {drv.reward && drv.reward.active && (
                              <button
                                onClick={() => setResetConfirmationDriver(drv)}
                                className="interactive-button w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 flex items-center justify-center cursor-pointer"
                                title="Reset Reward tracking"
                              >
                                <RefreshCw size={14} className="stroke-[2.5]" />
                              </button>
                            )}

                            {/* Edit Details */}
                            <button
                              onClick={() => setEditingDriver(drv)}
                              className="interactive-button w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 flex items-center justify-center cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit2 size={14} className="stroke-[2.5]" />
                            </button>

                            {/* Delete Details */}
                            <button
                              onClick={() => setDeletingDriver(drv)}
                              className={`interactive-button w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                                drv.deleted 
                                  ? 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-300 hover:bg-red-100' 
                                  : 'bg-zinc-100 hover:bg-red-50 hover:text-red-750 dark:bg-zinc-900 dark:hover:bg-red-950/20 dark:text-zinc-300'
                              }`}
                              title={drv.deleted ? "Deleted (Click to hard delete)" : "Delete Driver"}
                            >
                              <Trash2 size={14} className="stroke-[2.5]" />
                            </button>

                            {/* If soft-deleted, show restore button */}
                            {drv.deleted && (
                              <button
                                onClick={async () => {
                                  try {
                                    await restoreDriver(drv.uuid);
                                    showToast("success", `Restored ${drv.name} from soft deletion.`);
                                  } catch (_) {
                                    showToast("error", "Failed restoring driver.");
                                  }
                                }}
                                className="interactive-button px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Restore Driver"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Driver Cards List */}
          <div className="block md:hidden space-y-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-2">
                <RefreshCw className="animate-spin text-zinc-500 mx-auto mb-2" size={24} />
                <span>Loading drivers database...</span>
              </div>
            ) : paginatedDrivers.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-sm font-bold text-black dark:text-white">No Drivers Found</p>
                <p className="text-xs text-zinc-500 max-w-[220px] mx-auto">Try clearing search filters or add a new driver profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginatedDrivers.map((drv) => {
                  const isSelected = selectedIds.has(drv.uuid);
                  return (
                    <div 
                      key={drv.uuid}
                      onClick={() => {
                        setCurrentDriverDetail(drv);
                        setDetailTab('info');
                        onNavigate('drivers');
                      }}
                      className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-xs transition-all cursor-pointer relative interactive-button flex flex-col gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 ${
                        drv.has_contact_change ? 'border-amber-200 bg-amber-50/10 dark:bg-amber-950/10' : 'border-zinc-150 dark:border-zinc-800'
                      } ${isSelected ? 'ring-1 ring-black dark:ring-white bg-zinc-50/40 dark:bg-zinc-900/10' : ''}`}
                    >
                      {/* Avatar, Selection Checkbox, Name Header */}
                      <div className="flex items-center gap-3.5 justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(drv.uuid)}
                              className="w-4 h-4 rounded border-zinc-300 text-black accent-black cursor-pointer"
                            />
                          </div>
                          <Avatar 
                            photoUrl={drv.photo_url} 
                            name={drv.name} 
                            size={44}
                            className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 object-cover rounded-full"
                          />
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-[15px] text-black dark:text-white tracking-tight leading-tight truncate uppercase">
                              {drv.name || "UNNAMED DRIVER"}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={shieldClass("text-[9.5px] text-zinc-400 font-mono tracking-wider truncate block max-w-[130px]")}>
                                {drv.uuid}
                              </span>
                              {drv.status && (
                                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase select-none ${
                                  drv.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' :
                                  drv.status === 'Applied' ? 'text-blue-500 dark:text-blue-400' :
                                  drv.status === 'Waitlisted' ? 'text-amber-500 dark:text-amber-400' :
                                  'text-red-500 dark:text-red-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    drv.status === 'Active' ? 'bg-emerald-500 animate-pulse' :
                                    drv.status === 'Applied' ? 'bg-blue-500' :
                                    drv.status === 'Waitlisted' ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`} />
                                  {drv.status}
                                </span>
                              )}
                              {drv.flow && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase select-none bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/80">
                                  {drv.flow}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3.5 text-xs">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Contact</span>
                          <div className="space-y-1">
                            {drv.old_phone && drv.old_phone !== drv.phone ? (
                              <div className="flex flex-col">
                                <span className={shieldClass("bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded p-0.5 px-1.5 font-mono text-[11px] font-bold w-max")}>
                                  {drv.phone}
                                </span>
                                <span className={shieldClass("line-through text-zinc-400 text-[9.5px] font-mono mt-0.5 pl-0.5")}>
                                  Old: {drv.old_phone}
                                </span>
                              </div>
                            ) : (
                              <div className={shieldClass("text-[12px] font-mono font-bold text-zinc-800 dark:text-zinc-200 select-all")}>
                                {drv.phone || "—"}
                              </div>
                            )}

                            {drv.old_email && drv.old_email !== drv.email ? (
                              <div className="flex flex-col">
                                <span className={shieldClass("bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded p-0.5 px-1.5 text-[11px] font-bold truncate max-w-[120px] w-max")}>
                                  {drv.email}
                                </span>
                                <span className={shieldClass("line-through text-zinc-400 text-[9.5px] mt-0.5 pl-0.5 truncate max-w-[120px]")}>
                                  Old: {drv.old_email}
                                </span>
                              </div>
                            ) : (
                              <div className={shieldClass("text-[11.5px] font-medium text-zinc-600 dark:text-zinc-400 select-all truncate max-w-[120px]")}>
                                {drv.email || "—"}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Trips */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Total Trips</span>
                            <span className="text-[13px] font-mono font-bold text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 rounded p-0.5 px-1.5">
                              {drv.tip_count}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reward Cycle Status & Milestone Payout Approval */}
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs" onClick={(e) => e.stopPropagation()}>
                        {/* Reward Cycle Status */}
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Reward Cycle</span>
                          {!drv.reward || !drv.reward.active ? (
                            <button
                              onClick={() => {
                                setRewardTrackingDriver(drv);
                                setRewardCycleInput(52);
                              }}
                              className="interactive-button px-2.5 py-1 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer select-none"
                            >
                              <span>▶ Start</span>
                            </button>
                          ) : drv.reward.completed ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#06C167] border border-emerald-200 dark:border-emerald-900/40 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-max">
                              <span>🎉 Complete!</span>
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {drv.reward.trips_remaining <= 5 ? (
                                <span className="bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[10.5px] font-black px-2 py-0.5 rounded-lg w-max animate-pulse">
                                  {drv.reward.trips_remaining} left
                                </span>
                              ) : drv.reward.trips_remaining <= 20 ? (
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10.5px] font-black px-2 py-0.5 rounded-lg w-max">
                                  {drv.reward.trips_remaining} left
                                </span>
                              ) : (
                                <span className="bg-zinc-150 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-transparent text-[10.5px] font-bold px-2 py-0.5 rounded-lg w-max">
                                  {drv.reward.trips_remaining} left
                                </span>
                              )}
                              <span className="text-[8px] text-zinc-400 font-bold font-mono tracking-wider pl-0.5">
                                TARGET: {drv.reward.next_reward_at}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Milestone Payout Approval */}
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Milestones</span>
                          {(() => {
                            if (!drv.reward || !drv.reward.active) return <span className="text-zinc-400">—</span>;
                            const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
                            const hasF10 = currentCycleTrips >= 10 && !drv.reward.f10_done;
                            const hasF50 = currentCycleTrips >= 50 && !drv.reward.f50_done;

                            if (!hasF10 && !hasF50) return <span className="text-zinc-400">—</span>;

                            return (
                              <div className="flex flex-col gap-1">
                                {hasF10 && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await dismissRewardMilestone(drv.uuid, 'f10');
                                        showToast("success", `F10 Milestone payout approved for ${drv.name}`);
                                      } catch (err) {
                                        showToast("error", "Milestone payout approval failed.");
                                      }
                                    }}
                                    className="interactive-button px-2 py-0.5 bg-[#06C167] hover:bg-[#05a858] text-white text-[9px] font-black rounded flex items-center justify-center w-max uppercase tracking-wider"
                                  >
                                    Done F10
                                  </button>
                                )}
                                {hasF50 && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await dismissRewardMilestone(drv.uuid, 'f50');
                                        showToast("success", `F50 Milestone payout approved for ${drv.name}`);
                                      } catch (err) {
                                        showToast("error", "Milestone payout approval failed.");
                                      }
                                    }}
                                    className="interactive-button px-2 py-0.5 bg-[#06C167] hover:bg-[#05a858] text-white text-[9px] font-black rounded flex items-center justify-center w-max uppercase tracking-wider"
                                  >
                                    Done F50
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Actions</span>
                        <div className="flex items-center gap-1.5">
                          {/* Dismiss Contact Warning */}
                          {drv.has_contact_change && (
                            <button
                              onClick={async () => {
                                try {
                                  await dismissChangeFlag(drv.uuid);
                                  showToast("success", `Approved contact changes for ${drv.name}`);
                                } catch (_) {
                                  showToast("error", "Failed approving contact changes.");
                                }
                              }}
                              className="interactive-button w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center cursor-pointer"
                              title="Approve Contact Change"
                            >
                              <Check size={14} className="stroke-[2.5]" />
                            </button>
                          )}

                          {/* Reset active reward */}
                          {drv.reward && drv.reward.active && (
                            <button
                              onClick={() => setResetConfirmationDriver(drv)}
                              className="interactive-button w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                              title="Reset Reward tracking"
                            >
                              <RefreshCw size={14} className="stroke-[2.5]" />
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingDriver(drv)}
                            className="interactive-button w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-350 flex items-center justify-center cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 size={14} className="stroke-[2.5]" />
                          </button>

                          {/* Delete Details */}
                          <button
                            onClick={() => setDeletingDriver(drv)}
                            className={`interactive-button w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                              drv.deleted 
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-350 hover:bg-red-100' 
                                : 'bg-zinc-100 hover:bg-red-50 hover:text-red-700 dark:bg-zinc-800 dark:hover:bg-red-950/20 dark:text-zinc-300'
                            }`}
                            title={drv.deleted ? "Deleted (Click to hard delete)" : "Delete Driver"}
                          >
                            <Trash2 size={14} className="stroke-[2.5]" />
                          </button>

                          {/* If soft-deleted, show restore button */}
                          {drv.deleted && (
                            <button
                              onClick={async () => {
                                try {
                                  await restoreDriver(drv.uuid);
                                  showToast("success", `Restored ${drv.name} from soft deletion.`);
                                } catch (_) {
                                  showToast("error", "Failed restoring driver.");
                                }
                              }}
                              className="interactive-button px-2.5 py-1 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              title="Restore Driver"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table Pagination */}
          {renderTablePagination()}
        </div>

        {/* Floating Bulk Operations Bar */}
        {renderBulkOperationsBar()}
      </div>
    );
  };

  // Helper renderers for Home view to keep it clean and structured
  const renderTablePagination = () => {
    return (
      <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4.5 flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 select-none shrink-0">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-2 px-3 cursor-pointer">
          <span>Show:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value) || 10);
              setCurrentPage(1);
            }}
            className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer text-black dark:text-white"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            « First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            {"< Prev"}
          </button>
          <span className="font-mono text-zinc-500 font-bold px-1 select-none">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            {"Next >"}
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            Last »
          </button>
        </div>
      </div>
    );
  };

  const renderVehiclesTablePagination = (totalItems: number) => {
    const totalVehiclesPages = Math.max(1, Math.ceil(totalItems / vehiclesRowsPerPage));
    return (
      <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4.5 flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 select-none shrink-0">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-2 px-3 cursor-pointer">
          <span>Show:</span>
          <select
            value={vehiclesRowsPerPage}
            onChange={(e) => {
              setVehiclesRowsPerPage(parseInt(e.target.value) || 10);
              setVehiclesCurrentPage(1);
            }}
            className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer text-black dark:text-white"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVehiclesCurrentPage(1)}
            disabled={vehiclesCurrentPage === 1}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            « First
          </button>
          <button
            onClick={() => setVehiclesCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={vehiclesCurrentPage === 1}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            {"< Prev"}
          </button>
          <span className="font-mono text-zinc-500 font-bold px-1 select-none">
            Page {vehiclesCurrentPage} of {totalVehiclesPages}
          </span>
          <button
            onClick={() => setVehiclesCurrentPage(prev => Math.min(totalVehiclesPages, prev + 1))}
            disabled={vehiclesCurrentPage === totalVehiclesPages}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            {"Next >"}
          </button>
          <button
            onClick={() => setVehiclesCurrentPage(totalVehiclesPages)}
            disabled={vehiclesCurrentPage === totalVehiclesPages}
            className="p-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition select-none cursor-pointer text-black dark:text-white"
          >
            Last »
          </button>
        </div>
      </div>
    );
  };

  const renderBulkOperationsBar = () => {
    if (selectedIds.size === 0) return null;
    return (
      <div className="fixed bottom-0 left-0 right-0 w-full md:bottom-6 md:left-1/2 md:transform md:-translate-x-1/2 md:right-auto md:max-w-max bg-zinc-900/95 dark:bg-zinc-950/95 text-white px-4 py-3.5 pb-6 md:pb-4 md:px-6 rounded-t-2xl md:rounded-2xl shadow-2xl border-t md:border border-zinc-800 dark:border-zinc-700 flex flex-col md:flex-row md:items-center gap-3.5 md:gap-5 z-40 animate-slide-up select-none">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06C167] animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider font-mono">
              {selectedIds.size} {selectedIds.size === 1 ? 'Driver' : 'Drivers'} Selected
            </span>
          </div>
          
          <button
            onClick={() => setSelectedIds(new Set())}
            className="md:hidden text-zinc-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
          >
            Clear
          </button>
        </div>
        
        <div className="hidden md:block h-4 w-px bg-zinc-800 dark:bg-zinc-700"></div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1 -mb-1 md:pb-0 md:mb-0 w-full md:w-auto shrink-0">
          {/* Bulk Start Reward */}
          <button
            onClick={() => setShowBulkStartModal(true)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 dark:border-zinc-800 rounded-xl text-[11px] font-extrabold transition cursor-pointer select-none text-white shrink-0 flex items-center gap-1.5"
          >
            🏆 Start Reward
          </button>

          {/* Bulk Reset Reward */}
          <button
            onClick={() => setShowBulkResetModal(true)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 dark:border-zinc-800 rounded-xl text-[11px] font-extrabold transition cursor-pointer select-none text-white shrink-0 flex items-center gap-1.5"
          >
            🔄 Reset Reward
          </button>

          {/* Bulk Delete */}
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-[11px] font-extrabold transition cursor-pointer select-none shrink-0"
          >
            Delete Selected
          </button>

          {/* Export to CSV */}
          <button
            onClick={() => {
              const selectedDrivers = drivers.filter(d => selectedIds.has(d.uuid));
              handleCSVExport(selectedDrivers);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-extrabold transition cursor-pointer select-none shrink-0 flex items-center gap-1"
          >
            📥 Export CSV
          </button>

          {/* Export Driver Cards (HTML) */}
          <button
            onClick={() => {
              const selectedDrivers = drivers.filter(d => selectedIds.has(d.uuid));
              handleHTMLReportExport(selectedDrivers);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-extrabold transition cursor-pointer select-none shrink-0 flex items-center gap-1"
          >
            🪪 HTML Report
          </button>
        </div>

        <button
          onClick={() => setSelectedIds(new Set())}
          className="hidden md:block text-zinc-450 hover:text-white font-extrabold text-lg leading-none cursor-pointer pl-2"
        >
          &times;
        </button>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────
  // 2. DRIVERS LIST VIEW (SCREENSHOT 3)
  // ────────────────────────────────────────────────────────
  const renderDriversListView = () => {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
          <button onClick={onOpenMenu} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
            <Menu size={24} className="text-black dark:text-white" />
          </button>
          <div className="flex items-center gap-3">
            {renderIncognitoButton()}
            {/* Download Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowDownloadMenu(prev => !prev)}
                className="interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white"
                title="Download Options"
              >
                <Download size={22} className="stroke-[2.5]" />
              </button>
              {showDownloadMenu && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Download Options</span>
                    </div>
                    <button
                      onClick={() => {
                        handleCSVExport(sortedDrivers);
                        setShowDownloadMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                    >
                      <span className="text-lg">📊</span>
                      <div>
                        <div className="text-sm font-bold text-black dark:text-white">Export CSV</div>
                        <div className="text-[11px] text-zinc-400">Spreadsheet format</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleHTMLReportExport(sortedDrivers);
                        setShowDownloadMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <span className="text-lg">🪪</span>
                      <div>
                        <div className="text-sm font-bold text-black dark:text-white">HTML Report (with Photos)</div>
                        <div className="text-[11px] text-zinc-400">Detailed report with photos</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 space-y-5 pb-8 flex-1 flex flex-col w-full mx-auto">
          <h1 className="text-4xl font-extrabold text-black dark:text-white tracking-tight leading-none">Drivers</h1>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Filter pills row */}
              <div className={`flex items-center gap-1.5 py-1 shrink-0 select-none ${showStatusDropdown ? 'overflow-visible' : 'overflow-x-auto no-scrollbar'}`}>
                <button 
                  onClick={() => setFilterMode('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all interactive-button shrink-0 border ${
                    filterMode === 'all' 
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  All
                </button>
                <div className="relative shrink-0">
                  <button 
                    onClick={() => setShowStatusDropdown(prev => !prev)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all interactive-button shrink-0 border flex items-center gap-1 active:scale-[0.97] ${
                      ['status_active', 'status_rejected', 'status_applied', 'changed'].includes(filterMode)
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>
                      {filterMode === 'status_active' ? 'Status: Active' :
                       filterMode === 'status_rejected' ? 'Status: Rejected' :
                       filterMode === 'status_applied' ? 'Status: Applied' :
                       filterMode === 'changed' ? 'Status: Contact Change' :
                       'Status'}
                    </span>
                    <ChevronRight size={10} className={`stroke-[3] transition-transform duration-200 ${showStatusDropdown ? 'rotate-270' : 'rotate-90'}`} />
                  </button>
                  <AnimatePresence>
                    {showStatusDropdown && (
                      <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                        {/* Dropdown */}
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                          className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
                          style={{ transformOrigin: 'top left' }}
                        >
                          <button
                            onClick={() => {
                              setFilterMode('status_active');
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left text-xs font-bold ${
                              filterMode === 'status_active' ? 'text-[#06C167] bg-emerald-50/10' : 'text-black dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </div>
                            {filterMode === 'status_active' && <Check size={14} className="stroke-[3]" />}
                          </button>
                          <button
                            onClick={() => {
                              setFilterMode('status_applied');
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left text-xs font-bold border-t border-zinc-100 dark:border-zinc-800 ${
                              filterMode === 'status_applied' ? 'text-blue-500 bg-blue-50/10' : 'text-black dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>Applied</span>
                            </div>
                            {filterMode === 'status_applied' && <Check size={14} className="stroke-[3]" />}
                          </button>
                          <button
                            onClick={() => {
                              setFilterMode('status_rejected');
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left text-xs font-bold border-t border-zinc-100 dark:border-zinc-800 ${
                              filterMode === 'status_rejected' ? 'text-red-500 bg-red-50/10' : 'text-black dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              <span>Rejected</span>
                            </div>
                            {filterMode === 'status_rejected' && <Check size={14} className="stroke-[3]" />}
                          </button>
                          <button
                            onClick={() => {
                              setFilterMode('changed');
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left text-xs font-bold border-t border-zinc-100 dark:border-zinc-800 ${
                              filterMode === 'changed' ? 'text-amber-500 bg-amber-50/10' : 'text-black dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Contact Change</span>
                            </div>
                            {filterMode === 'changed' && <Check size={14} className="stroke-[3]" />}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <button className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all shrink-0 flex items-center gap-1">
                  <span>Assignment</span>
                  <ChevronRight size={10} className="rotate-90 stroke-[3]" />
                </button>
                <button className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all shrink-0 flex items-center gap-1">
                  <span>Documents</span>
                  <ChevronRight size={10} className="rotate-90 stroke-[3]" />
                </button>
              </div>

              {/* Dynamic search inside view */}
              <div className="relative shrink-0 select-none">
                <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search driver by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl p-3 pl-9.5 text-xs font-semibold focus:ring-1 focus:ring-black dark:focus:ring-white outline-none text-black dark:text-white"
                />
              </div>

              {/* Driver list container */}
              <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar py-1">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-2">
                    <RefreshCw className="animate-spin text-zinc-500" size={24} />
                    <span className="text-xs">Loading database...</span>
                  </div>
                ) : sortedDrivers.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-sm font-bold text-black dark:text-white">No Drivers Found</p>
                    <p className="text-xs text-zinc-500 max-w-[220px] mx-auto">Try clearing search filters or add a new driver profile.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedDrivers.map((drv) => {
                      return (
                        <div 
                          key={drv.uuid}
                          onClick={() => {
                            setCurrentDriverDetail(drv);
                            setDetailTab('info');
                          }}
                          className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-xs transition-all cursor-pointer relative interactive-button flex flex-col gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 ${
                            drv.has_contact_change ? 'border-amber-200 bg-amber-50/10 dark:bg-amber-950/10' : 'border-zinc-150 dark:border-zinc-800'
                          }`}
                        >
                          {/* Avatar & Name Header */}
                          <div className="flex items-center gap-3.5 justify-between">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <Avatar 
                                photoUrl={drv.photo_url} 
                                name={drv.name} 
                                size={48}
                                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 object-cover"
                              />
                              <div className="min-w-0">
                                <h3 className="font-extrabold text-[17px] text-black dark:text-white tracking-tight leading-tight truncate uppercase">
                                  {drv.name || "UNNAMED DRIVER"}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 select-none ${
                                    drv.status === 'Active' ? 'bg-[#e6f9f0] dark:bg-emerald-950/30 text-[#06C167] dark:text-emerald-400' :
                                    drv.status === 'Applied' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-550 dark:text-blue-400' :
                                    drv.status === 'Waitlisted' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-550 dark:text-amber-400' :
                                    'bg-red-50 dark:bg-red-950/30 text-red-550 dark:text-red-400'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${
                                      drv.status === 'Active' ? 'bg-[#06C167] animate-pulse' :
                                      drv.status === 'Applied' ? 'bg-blue-500' :
                                      drv.status === 'Waitlisted' ? 'bg-amber-500' :
                                      'bg-red-500'
                                    }`}></span>
                                    {drv.status || 'Active'}
                                  </span>
                                  <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">
                                    • {drv.flow || "Unverified"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3.5 text-xs">
                            {/* Left Column: Contact & Trips */}
                            <div className="space-y-3">
                              {/* Contact */}
                              <div>
                                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Contact</span>
                                <div className={shieldClass("text-[14px] font-bold text-black dark:text-white leading-tight font-mono select-all")}>
                                  {drv.phone || "—"}
                                </div>
                                <div className={shieldClass("text-[12.5px] font-medium text-zinc-600 dark:text-zinc-400 leading-tight truncate mt-0.5 select-all")} title={drv.email}>
                                  {drv.email || "—"}
                                </div>
                                {drv.old_phone && drv.old_phone !== drv.phone && (
                                  <div className={shieldClass("flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 mt-1 bg-amber-50/50 dark:bg-amber-950/20 p-0.5 px-1.5 rounded w-max border border-amber-100 dark:border-amber-900/50 font-mono")}>
                                    <span className="line-through text-zinc-500">{drv.old_phone}</span>
                                  </div>
                                )}
                              </div>

                              {/* Trips */}
                              <div>
                                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Trips</span>
                                <span className="text-[14px] font-mono font-bold text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                                  {drv.tip_count}
                                </span>
                              </div>
                            </div>

                            {/* Right Column: Reward Status & Milestone */}
                            <div className="space-y-3">
                              {/* Reward Cycle Status */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Reward Cycle Status</span>
                                {!drv.reward || !drv.reward.active ? (
                                  <button
                                    onClick={() => {
                                      setRewardTrackingDriver(drv);
                                      setRewardCycleInput(52);
                                    }}
                                    className="interactive-button px-2.5 py-1 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[10.5px] font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer select-none w-max"
                                  >
                                    <span>▶ Start Reward</span>
                                  </button>
                                ) : drv.reward.completed ? (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#06C167] border border-emerald-200 dark:border-emerald-900/40 text-[10.5px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-max select-none">
                                    <span>🎉 Complete!</span>
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-0.5 select-none">
                                    {drv.reward.trips_remaining <= 5 ? (
                                      <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-max animate-pulse">
                                        <span>⚡ {drv.reward.trips_remaining} left</span>
                                      </span>
                                    ) : drv.reward.trips_remaining <= 20 ? (
                                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-max">
                                        <span>🔥 {drv.reward.trips_remaining} left</span>
                                      </span>
                                    ) : (
                                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-transparent text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 w-max">
                                        <span>⏳ {drv.reward.trips_remaining} left</span>
                                      </span>
                                    )}
                                    <span className="text-[9px] text-zinc-400 font-bold pl-0.5 uppercase font-mono tracking-wider">
                                      target: {drv.reward.next_reward_at}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Milestone Payout Approval */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Milestone Payout Approval</span>
                                {(() => {
                                  if (!drv.reward || !drv.reward.active) return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
                                  const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
                                  const hasF10 = currentCycleTrips >= 10 && !drv.reward.f10_done;
                                  const hasF50 = currentCycleTrips >= 50 && !drv.reward.f50_done;

                                  if (!hasF10 && !hasF50) return <span className="text-zinc-400 dark:text-zinc-500">—</span>;

                                  return (
                                    <div className="flex flex-col gap-1 select-none">
                                      {hasF10 && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              await dismissRewardMilestone(drv.uuid, 'f10');
                                              showToast("success", `F10 Payout approved for ${drv.name}`);
                                            } catch (err) {
                                              showToast("error", "Milestone payout approval failed.");
                                            }
                                          }}
                                          className="interactive-button px-2 py-0.5 bg-[#06C167] hover:bg-[#05a858] text-white text-[9.5px] font-black rounded shadow-xs cursor-pointer flex items-center justify-center w-max uppercase tracking-wider"
                                        >
                                          <span>Done F10</span>
                                        </button>
                                      )}
                                      {hasF50 && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              await dismissRewardMilestone(drv.uuid, 'f50');
                                              showToast("success", `F50 Payout approved for ${drv.name}`);
                                            } catch (err) {
                                              showToast("error", "Milestone payout approval failed.");
                                            }
                                          }}
                                          className="interactive-button px-2 py-0.5 bg-[#06C167] hover:bg-[#05a858] text-white text-[9.5px] font-black rounded shadow-xs cursor-pointer flex items-center justify-center w-max uppercase tracking-wider"
                                        >
                                          <span>Done F50</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Actions Footer */}
                          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Actions</span>
                            <div className="flex items-center gap-1.5">
                              {/* Dismiss Contact Warning / Check */}
                              {drv.has_contact_change && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await dismissChangeFlag(drv.uuid);
                                      showToast("success", `Approved contact changes for ${drv.name}`);
                                    } catch (_) {
                                      showToast("error", "Failed approving contact changes.");
                                    }
                                  }}
                                  className="interactive-button w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center cursor-pointer"
                                  title="Approve Contact Change"
                                >
                                  <Check size={14} className="stroke-[2.5]" />
                                </button>
                              )}

                              {/* Reset Reward */}
                              {drv.reward && drv.reward.active && (
                                <button
                                  onClick={() => setResetConfirmationDriver(drv)}
                                  className="interactive-button w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                                  title="Reset Reward tracking"
                                >
                                  <RefreshCw size={14} className="stroke-[2.5]" />
                                </button>
                              )}

                              {/* Edit Details */}
                              <button
                                onClick={() => setEditingDriver(drv)}
                                className="interactive-button w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                                title="Edit Details"
                              >
                                <Edit2 size={14} className="stroke-[2.5]" />
                              </button>

                              {/* Delete Details */}
                              <button
                                onClick={() => setDeletingDriver(drv)}
                                className={`interactive-button w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                                  drv.deleted 
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-350 hover:bg-red-100' 
                                    : 'bg-zinc-100 hover:bg-red-50 hover:text-red-700 dark:bg-zinc-800 dark:hover:bg-red-950/20 dark:text-zinc-300'
                                }`}
                                title={drv.deleted ? "Deleted (Click to hard delete)" : "Delete Driver"}
                              >
                                <Trash2 size={14} className="stroke-[2.5]" />
                              </button>

                              {/* Restore soft-deleted */}
                              {drv.deleted && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await restoreDriver(drv.uuid);
                                      showToast("success", `Restored ${drv.name} from soft deletion.`);
                                    } catch (_) {
                                      showToast("error", "Failed restoring driver.");
                                    }
                                  }}
                                  className="interactive-button px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                  title="Restore Driver"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Functional Pagination footer */}
              {renderTablePagination()}

            </div>
          </div>
        </div>
      );
    };

    // ────────────────────────────────────────────────────────
    // 3. VEHICLES VIEW (SCREENSHOT 1)
    // ────────────────────────────────────────────────────────
    const renderVehiclesView = () => {
      const myUid = getCurrentUid();
      const myLogs = dailyLogs.filter(l => l.partnerId === myUid);

      const getWeekNumber = (dateStr: string): string => {
        const d = new Date(dateStr);
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return `${date.getFullYear()}-W${Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7) + 1}`;
      };

      const handleAddDailyLog = async (e: React.FormEvent) => {
      e.preventDefault();
      if (entryMode === 'single') {
        if (!dailyPlate || !dailyDate) return;
        const cleanPlate = dailyPlate.trim().toUpperCase();
        const newLog: DailyLog = {
          id: `log_${Date.now()}`,
          date: dailyDate,
          partnerId: myUid,
          vehiclePlate: cleanPlate,
          submittedAt: new Date().toISOString()
        };
        try {
          await saveDailyLog(newLog);
          setDailyPlate("");
          const logs = await getDailyLogs();
          setDailyLogs(logs);
          showToast("success", `Vehicle ${cleanPlate} added to your daily log.`);
        } catch (err) {
          showToast("error", "Failed to save daily log.");
        }
      } else {
        if (!bulkPlates.trim() || !dailyDate) return;
        const platesArray = bulkPlates
          .split(/[\s,;\n]+/)
          .map(p => p.trim().toUpperCase())
          .filter(p => p.length > 0);

        if (platesArray.length === 0) {
          showToast("error", "No valid vehicle plates found in input.");
          return;
        }

        try {
          let count = 0;
          await Promise.all(
            platesArray.map(async (plate, idx) => {
              const newLog: DailyLog = {
                id: `log_${Date.now()}_${idx}`,
                date: dailyDate,
                partnerId: myUid,
                vehiclePlate: plate,
                submittedAt: new Date().toISOString()
              };
              await saveDailyLog(newLog);
              count++;
            })
          );
          setBulkPlates("");
          const logs = await getDailyLogs();
          setDailyLogs(logs);
          showToast("success", `Successfully added ${count} vehicle logs.`);
        } catch (err) {
          showToast("error", "Failed to save some daily logs.");
        }
      }
    };

    const handleDeleteDailyLog = async (id: string) => {
      if (confirm("Remove this vehicle log?")) {
        try {
          await deleteDailyLog(id);
          const logs = await getDailyLogs();
          setDailyLogs(logs);
          showToast("info", "Vehicle log removed.");
        } catch (err) {
          showToast("error", "Failed to delete daily log.");
        }
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
        {/* Header */}
        <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
          <button onClick={onOpenMenu} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
            <Menu size={24} className="text-black dark:text-white" />
          </button>
          <div className="flex items-center gap-3">
            {renderIncognitoButton()}
          </div>
        </header>

        <div className="px-4 sm:px-6 space-y-6 pb-8 pt-5 max-w-4xl w-full mx-auto select-none">
          <div className="flex items-center justify-between shrink-0">
            <h1 className="text-4xl font-extrabold text-black dark:text-white tracking-tight leading-none">Daily Reports</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form Column */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4 h-max">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="text-[16px] font-extrabold text-black dark:text-white tracking-tight">
                  Report Vehicle Operation
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800/80 rounded-lg p-0.5 w-full">
                <button
                  type="button"
                  onClick={() => setEntryMode('single')}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    entryMode === 'single'
                      ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
                  }`}
                >
                  Single Entry
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('bulk')}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    entryMode === 'bulk'
                      ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
                  }`}
                >
                  Bulk Entry
                </button>
              </div>

              <form onSubmit={handleAddDailyLog} className="space-y-4 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Operation Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-bold text-black dark:text-white"
                  />
                </div>

                {entryMode === 'single' ? (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Vehicle License Plate:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DHM-GHA-392604"
                      value={dailyPlate}
                      onChange={(e) => setDailyPlate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-bold text-black dark:text-white uppercase placeholder-zinc-400 dark:placeholder-zinc-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Vehicle License Plates (Bulk):
                    </label>
                    <textarea
                      required
                      placeholder="Enter plates separated by commas, spaces, or newlines (e.g. DHM-GHA-392604, DHM-GHA-392605)"
                      rows={5}
                      value={bulkPlates}
                      onChange={(e) => setBulkPlates(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-semibold text-black dark:text-white uppercase placeholder-zinc-400 dark:placeholder-zinc-500 resize-none font-mono"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-black hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.97]"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>{entryMode === 'single' ? 'Add Vehicle Log' : 'Bulk Add Vehicles'}</span>
                </button>
              </form>
            </div>

            {/* Entries Log List Column */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-[16px] font-extrabold text-black dark:text-white tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
                <span>My Daily Vehicle Logs ({myLogs.length})</span>
                <span className="text-[10px] font-mono font-bold text-zinc-400">Total System Logs: {dailyLogs.length}</span>
              </h3>
              
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                {myLogs.length === 0 ? (
                  <div className="text-center py-20 text-zinc-450 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold">
                    You haven't reported driving any vehicles yet. Submit the form on the left to start.
                  </div>
                ) : (
                  myLogs.map((log) => {
                    const date = new Date(log.date);
                    const weekNum = getWeekNumber(log.date);
                    
                    // Match with a claimed payout for this user
                    const matchingPayout = scrapedPayouts.find(p => 
                      p.status === 'claimed' &&
                      p.attributedTo === myUid &&
                      p.vehiclePlate === log.vehiclePlate &&
                      getWeekNumber(p.settlementDate) === weekNum
                    );

                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-955/20 border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-black dark:text-white text-sm tracking-wide uppercase">
                              {log.vehiclePlate}
                            </span>
                            {matchingPayout ? (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-[#06C167] border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#06C167] rounded-full"></span>
                                Payout Done BDT {matchingPayout.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500 px-1.5 py-0.5 rounded font-extrabold">
                                Pending Payout
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-1">
                            Date: {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDeleteDailyLog(log.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition cursor-pointer"
                            title="Delete vehicle log"
                          >
                            <Trash2 size={14} />
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
      </div>
    );
  };

  const renderPerformanceTableView = () => {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
        {/* Header */}
        <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
          <button onClick={onOpenMenu} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
            <Menu size={24} className="text-black dark:text-white" />
          </button>
          <div className="flex items-center gap-3">
            {renderIncognitoButton()}
          </div>
        </header>

        <div className="px-4 sm:px-6 space-y-5 pb-8 flex-1 flex flex-col w-full mx-auto select-none">
          <div className="flex items-center justify-between shrink-0">
            <h1 className="text-4xl font-extrabold text-black dark:text-white tracking-tight leading-none">Performance</h1>
            <button 
              onClick={() => showToast("success", "Performance report downloaded!")}
              className="interactive-button bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-black dark:text-white rounded-lg p-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          </div>

          {/* Sub-tabs: Drivers / Vehicles */}
          <div className="flex border-b border-zinc-150 dark:border-zinc-800 relative shrink-0">
            <button
              onClick={() => setPerformanceSubTab('drivers')}
              className={`flex-1 py-3.5 text-center text-[15.5px] font-bold transition-colors select-none ${
                performanceSubTab === 'drivers' ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Drivers
            </button>
            <button
              onClick={() => setPerformanceSubTab('vehicles')}
              className={`flex-1 py-3.5 text-center text-[15.5px] font-bold transition-colors select-none ${
                performanceSubTab === 'vehicles' ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Vehicles
            </button>
            <div 
              className="absolute bottom-0 h-[2.5px] bg-black dark:bg-white transition-all duration-300"
              style={{
                width: '50%',
                left: performanceSubTab === 'drivers' ? '0%' : '50%'
              }}
            />
          </div>

          {/* Filters, search, and date selectors (Screenshots 4 & 5) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 pt-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Search"
                  className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg p-2 pl-8 text-xs font-semibold outline-none focus:ring-1 focus:ring-black dark:focus:ring-white w-40 text-black dark:text-white"
                />
              </div>
              <button className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg p-2 text-xs font-bold text-black dark:text-white flex items-center gap-1.5 border border-transparent">
                <SlidersHorizontal size={13} />
                <span>Filter</span>
              </button>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-2 px-3.5 text-xs font-bold text-black dark:text-white flex items-center gap-2 cursor-pointer hover:bg-zinc-150 dark:hover:bg-zinc-800">
              <Calendar size={13} />
              <span>2026/06/14 - 2026/06/14</span>
            </div>
          </div>

          {/* Grids / Tables */}
          <div className="hidden md:block flex-1 overflow-x-auto border border-zinc-150 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs">
            {performanceSubTab === 'drivers' ? (
              // Drivers Performance Table (Screenshot 5)
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800 text-[11px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="font-bold py-3">Name</th>
                    <th className="font-bold text-right py-3">Total Earnings</th>
                    <th className="font-bold text-right py-3">Earnings / hr</th>
                    <th className="font-bold text-right py-3">Cash Earnings</th>
                    <th className="font-bold text-right py-3">Trips / hr</th>
                    <th className="font-bold text-right py-3">Hours Online</th>
                    <th className="font-bold text-right py-3">Trips Taken</th>
                    <th className="font-bold text-right py-3">Acceptance</th>
                    <th className="font-bold text-right py-3">Cancellation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[13.5px] font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {paginatedDrivers.map((drv) => {
                    const totalEarnings = drv.tip_count * 450 + 50;
                    const earningsPerHr = 280 + (drv.tip_count % 5) * 5;
                    const cashEarnings = drv.tip_count * 120 + 20;
                    const tripsPerHr = 0.5 + (drv.tip_count % 3) * 0.1;
                    const hoursOnline = drv.tip_count * 1.5 + 3.2;
                    const tripsTaken = drv.tip_count;
                    const acceptance = 85 + (drv.tip_count % 10) * 1.5;
                    const cancellation = 2 + (drv.tip_count % 8) * 0.5;

                    return (
                      <tr key={drv.uuid} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition">
                        <td className="py-4 font-sans font-extrabold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <Avatar 
                              photoUrl={drv.photo_url} 
                              name={drv.name}
                              size={32}
                              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 object-cover shrink-0" 
                            />
                            <span className="truncate max-w-[120px] uppercase">{drv.name || "UNNAMED DRIVER"}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">BDT {totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">BDT {earningsPerHr.toFixed(2)}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">BDT {cashEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{tripsPerHr.toFixed(2)}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{hoursOnline.toFixed(2)}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{tripsTaken}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{acceptance.toFixed(2)}%</td>
                        <td className="py-4 text-right text-red-650 dark:text-red-400 border-b border-zinc-100 dark:border-zinc-800">{cancellation.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              // Vehicles Performance Table (Screenshot 4)
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800 text-[11px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="font-bold py-3">Name</th>
                    <th className="font-bold text-right py-3">Total Earnings</th>
                    <th className="font-bold text-right py-3">Earnings / hr</th>
                    <th className="font-bold text-right py-3">Utilization</th>
                    <th className="font-bold text-right py-3">Trips / hr</th>
                    <th className="font-bold text-right py-3">Hours Online</th>
                    <th className="font-bold text-right py-3">Hours on Trip</th>
                    <th className="font-bold text-right py-3">Trips Taken</th>
                    <th className="font-bold text-right py-3">Acceptance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[13.5px] font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {paginatedVehicles.map((v, index) => {
                    const totalEarnings = 2300 + (index % 3) * 150;
                    const earningsPerHr = 280 + (index % 5) * 5;
                    const utilization = 73.71 + (index % 4) * 2.5;
                    const tripsPerHr = 0.62 + (index % 3) * 0.05;
                    const hoursOnline = 8.12 + (index % 2) * 1.2;
                    const hoursOnTrip = 4.78 + (index % 2) * 0.8;
                    const tripsTaken = 5 + (index % 3) * 2;
                    const acceptance = 88.2 + (index % 5) * 1.5;

                    return (
                      <tr key={v.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition">
                        <td className="py-4 font-sans font-extrabold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <img 
                              src={v.photo} 
                              alt={v.name} 
                              className="w-10 h-7 rounded object-cover bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0" 
                            />
                            <div>
                              <span className="block truncate max-w-[150px] leading-tight font-sans text-xs">{v.name}</span>
                              <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 leading-none">{v.plate}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">BDT {totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">BDT {earningsPerHr.toFixed(2)}</td>
                        <td className="py-4 text-right text-emerald-700 dark:text-emerald-400 border-b border-zinc-100 dark:border-zinc-800">{utilization.toFixed(2)}%</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{tripsPerHr.toFixed(2)}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{hoursOnline.toFixed(2)}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{hoursOnTrip.toFixed(2)}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{tripsTaken}</td>
                        <td className="py-4 text-right border-b border-zinc-100 dark:border-zinc-800">{acceptance.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Performance Cards List */}
          <div className="block md:hidden space-y-4">
            {performanceSubTab === 'drivers' ? (
              <div className="grid grid-cols-1 gap-4">
                {paginatedDrivers.map((drv) => {
                  const totalEarnings = drv.tip_count * 450 + 50;
                  const earningsPerHr = 280 + (drv.tip_count % 5) * 5;
                  const cashEarnings = drv.tip_count * 120 + 20;
                  const tripsPerHr = 0.5 + (drv.tip_count % 3) * 0.1;
                  const hoursOnline = drv.tip_count * 1.5 + 3.2;
                  const tripsTaken = drv.tip_count;
                  const acceptance = 85 + (drv.tip_count % 10) * 1.5;
                  const cancellation = 2 + (drv.tip_count % 8) * 0.5;

                  return (
                    <div 
                      key={drv.uuid} 
                      className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4"
                    >
                      {/* Name & Avatar */}
                      <div className="flex items-center gap-3">
                        <Avatar 
                          photoUrl={drv.photo_url} 
                          name={drv.name}
                          size={36}
                          className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 object-cover rounded-full" 
                        />
                        <span className="font-extrabold text-[15px] text-black dark:text-white uppercase truncate">{drv.name || "UNNAMED DRIVER"}</span>
                      </div>

                      {/* Performance stats grid */}
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3.5 text-xs font-semibold">
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Total Earnings</span>
                          <span className="font-mono text-black dark:text-white">BDT {totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Earnings / hr</span>
                          <span className="font-mono text-black dark:text-white">BDT {earningsPerHr.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Cash Earnings</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">BDT {cashEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Hours Online</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{hoursOnline.toFixed(2)} hrs</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Trips Taken</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{tripsTaken} trips</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Trips / hr</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{tripsPerHr.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Acceptance</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{acceptance.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Cancellation</span>
                          <span className="font-mono text-red-650 dark:text-red-400">{cancellation.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginatedVehicles.map((v, index) => {
                  const totalEarnings = 2300 + (index % 3) * 150;
                  const earningsPerHr = 280 + (index % 5) * 5;
                  const utilization = 73.71 + (index % 4) * 2.5;
                  const tripsPerHr = 0.62 + (index % 3) * 0.05;
                  const hoursOnline = 8.12 + (index % 2) * 1.2;
                  const hoursOnTrip = 4.78 + (index % 2) * 0.8;
                  const tripsTaken = 5 + (index % 3) * 2;
                  const acceptance = 88.2 + (index % 5) * 1.5;

                  return (
                    <div 
                      key={v.id} 
                      className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4"
                    >
                      {/* Name & Photo */}
                      <div className="flex items-center gap-3">
                        <img 
                          src={v.photo} 
                          alt={v.name} 
                          className="w-12 h-9 rounded object-cover bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0" 
                        />
                        <div className="min-w-0">
                          <span className="block font-extrabold text-[14px] text-black dark:text-white leading-tight truncate">{v.name}</span>
                          <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 leading-none">{v.plate}</span>
                        </div>
                      </div>

                      {/* Performance stats grid */}
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3.5 text-xs font-semibold">
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Total Earnings</span>
                          <span className="font-mono text-black dark:text-white">BDT {totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Earnings / hr</span>
                          <span className="font-mono text-black dark:text-white">BDT {earningsPerHr.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Utilization</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{utilization.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Hours Online</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{hoursOnline.toFixed(2)} hrs</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Hours on Trip</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{hoursOnTrip.toFixed(2)} hrs</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Trips Taken</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{tripsTaken} trips</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Trips / hr</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{tripsPerHr.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Acceptance</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{acceptance.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Pagination */}
          {performanceSubTab === 'drivers' 
            ? renderTablePagination() 
            : renderVehiclesTablePagination(vehicles.length)}
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────
  // 5. DRIVER PROFILE DETAIL & PERFORMANCE CHART (SCREENSHOT 2)
  // ────────────────────────────────────────────────────────
  const renderDriverProfileView = (drv: Driver) => {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto no-scrollbar">
        {/* Header Breadcrumbs */}
        <header className="px-4 py-3 sm:px-6 sm:py-5 flex flex-col bg-white dark:bg-zinc-950 z-10 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDriverDetail(null)} 
                className="interactive-button p-1 rounded-md hover:bg-zinc-150 dark:hover:bg-zinc-900 text-black dark:text-white flex items-center justify-center"
              >
                <ChevronRight size={22} className="rotate-180 stroke-[2.5]" />
              </button>
              <span className="font-extrabold text-[19px] text-black dark:text-white tracking-tight">Drivers</span>
            </div>
            <div className="flex items-center gap-3">
              {renderIncognitoButton()}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 pl-1 mt-1 font-bold">
            <span className="hover:underline cursor-pointer" onClick={() => setCurrentDriverDetail(null)}>Drivers</span>
            <ChevronRight size={11} className="stroke-[2.5]" />
            <span className="text-zinc-650 dark:text-zinc-350">Driver Profile</span>
          </div>
        </header>

        <div className="px-4 sm:px-6 space-y-6 pb-8 pt-5 max-w-4xl w-full mx-auto">
          {/* Driver header details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar 
                photoUrl={drv.photo_url} 
                name={drv.name} 
                size={60} 
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-[23px] text-black dark:text-white tracking-tight leading-none uppercase truncate">
                    {drv.name || "UNNAMED DRIVER"}
                  </h2>
                  <button className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-blue-600 shrink-0">
                    <Phone size={15} className="fill-current" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap select-none text-[12px] font-bold">
                  <span className={`px-2 py-0.5 rounded flex items-center gap-1.5 uppercase select-none ${
                    drv.status === 'Active' ? 'bg-[#e6f9f0] dark:bg-emerald-950/30 text-[#06C167] dark:text-emerald-400' :
                    drv.status === 'Applied' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-550 dark:text-blue-400' :
                    drv.status === 'Waitlisted' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-550 dark:text-amber-400' :
                    'bg-red-50 dark:bg-red-950/30 text-red-550 dark:text-red-400'
                  }`}>
                    {drv.status === 'Active' ? '✓ Active' :
                     drv.status === 'Applied' ? '• Applied' :
                     drv.status === 'Waitlisted' ? '• Waitlisted' :
                     '✗ Rejected'}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    • Offline
                  </span>
                </div>
              </div>
            </div>

            {/* Top right message icons */}
            <div className="flex items-center gap-1.5 shrink-0 select-none self-start sm:self-auto">
              <button 
                onClick={() => showToast("info", `Opening mail to ${drv.email}`)}
                className="interactive-button w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300"
              >
                <Mail size={17} />
              </button>
              <button 
                onClick={() => showToast("info", "Opening chat window...")}
                className="interactive-button w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300"
              >
                <MessageSquare size={17} />
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs: Info, Rewards */}
          <div className="flex border-b border-zinc-150 dark:border-zinc-800 relative shrink-0">
            {[
              { id: 'info', label: 'General Info' },
              { id: 'rewards', label: 'Rewards Tracker' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as any)}
                className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold transition-colors select-none ${
                  detailTab === tab.id ? 'text-black dark:text-white' : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div 
              className="absolute bottom-0 h-[2.5px] bg-black dark:bg-white transition-all duration-300"
              style={{
                width: '50%',
                left: detailTab === 'info' ? '0%' : '50%'
              }}
            />
          </div>

          {/* Render Detail Tab Content */}
          {detailTab === 'info' && (
            <div className="space-y-6 animate-enter">
              {/* Account info card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="text-[17px] font-extrabold text-black dark:text-white tracking-tight leading-none mb-1">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Full Name</span>
                      <span className="text-[13.5px] font-bold text-black dark:text-white uppercase">{drv.name || "Unnamed Driver"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Phone Number</span>
                      <span className={shieldClass("text-[13.5px] font-mono font-bold text-black dark:text-white select-all")}>{drv.phone || "—"}</span>
                      {drv.old_phone && drv.old_phone !== drv.phone && (
                        <span className={shieldClass("block text-[10.5px] text-zinc-400 dark:text-zinc-500 line-through mt-0.5")}>Old: {drv.old_phone}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Email Address</span>
                      <span className={shieldClass("text-[13.5px] font-bold text-black dark:text-white select-all")}>{drv.email || "—"}</span>
                      {drv.old_email && drv.old_email !== drv.email && (
                        <span className={shieldClass("block text-[10.5px] text-zinc-400 dark:text-zinc-500 line-through mt-0.5")}>Old: {drv.old_email}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Driver UUID</span>
                      <span className={shieldClass("text-[12px] font-mono font-bold text-zinc-600 dark:text-zinc-400 select-all")}>{drv.uuid}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">First Synced</span>
                      <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">
                        {drv.first_seen ? new Date(drv.first_seen).toLocaleString() : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Last Updated</span>
                      <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">
                        {drv.last_updated ? new Date(drv.last_updated).toLocaleString() : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Vehicle Assignment Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
                <h3 className="text-[17px] font-extrabold text-black dark:text-white tracking-tight leading-none">Assigned Vehicle</h3>
                {(() => {
                  const assignedVehicle = vehicles.find(v => v.assignment === drv.name);
                  if (assignedVehicle) {
                    return (
                      <div className="flex items-center gap-4 pt-1">
                        <img 
                          src={assignedVehicle.photo} 
                          alt={assignedVehicle.name} 
                          className="w-16 h-12 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
                        />
                        <div>
                          <h4 className="font-extrabold text-[14.5px] text-black dark:text-white">{assignedVehicle.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                              {assignedVehicle.plate}
                            </span>
                            <span className="text-[10.5px] text-[#06C167] font-black uppercase">Active</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center py-5">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold max-w-sm mx-auto leading-normal">
                          No vehicle currently assigned. You can manage assignments inside the Vehicles tab.
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Remarks/Bio Input */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
                <h3 className="text-[17px] font-extrabold text-black dark:text-white tracking-tight leading-none">Internal Remarks</h3>
                <textarea 
                  placeholder="Type any fleet notes here about this driver (e.g. shift times, warning status, payout preferences)..." 
                  rows={3}
                  className="w-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3 text-black dark:text-white focus:ring-1 focus:ring-black outline-none resize-none"
                />
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => showToast("success", "Remarks saved locally.")}
                    className="text-[11.5px] font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-85 p-2 px-4 rounded-xl transition interactive-button"
                  >
                    Save Remarks
                  </button>
                </div>
              </div>
            </div>
          )}



          {detailTab === 'rewards' && (
            <div className="space-y-6 animate-enter">
              {drv.reward && drv.reward.active ? (
                <div className="space-y-6">
                  {/* Current Active Reward Status Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                      <h3 className="text-[17px] font-extrabold text-black dark:text-white tracking-tight leading-none">Active Reward Tracking</h3>
                      {drv.reward.completed ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[#06C167] border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-black px-2.5 py-0.5 rounded-lg">
                          🎉 Cycle Complete
                        </span>
                      ) : (
                        <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-650 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 text-[11px] font-black px-2.5 py-0.5 rounded-lg animate-pulse">
                          ⚡ In Progress
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const completedTrips = drv.tip_count - drv.reward.start_tip_count;
                      const cycleSize = drv.reward.reward_cycle_size || 52;
                      const percent = Math.min(100, Math.max(0, (completedTrips / cycleSize) * 100));
                      return (
                        <div className="space-y-2 select-none">
                          <div className="flex justify-between text-xs font-bold text-zinc-650 dark:text-zinc-350">
                            <span>Progress: {completedTrips} / {cycleSize} Trips</span>
                            <span>{Math.floor(percent)}% Completed</span>
                          </div>
                          <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            <div 
                              className="h-full bg-[#06C167] rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Start Trip Count</span>
                        <span className="text-[14px] font-mono font-bold text-black dark:text-white">{drv.reward.start_tip_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Current Trip Count</span>
                        <span className="text-[14px] font-mono font-bold text-black dark:text-white">{drv.tip_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Target Reward At</span>
                        <span className="text-[14px] font-mono font-bold text-black dark:text-white">{drv.reward.next_reward_at}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Trips Remaining</span>
                        <span className="text-[14px] font-mono font-bold text-black dark:text-white">{drv.reward.trips_remaining}</span>
                      </div>
                    </div>

                    {/* AI Milestone Projection Card */}
                    <div className="bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl p-5 space-y-4 shadow-xs relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none"></div>
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm uppercase tracking-wider">
                        <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                        <span>AI Trip Milestone Projection</span>
                      </div>
                      
                      {(() => {
                        const currentTrips = drv.tip_count;
                        const nextMilestone = Math.ceil((currentTrips + 1) / 50) * 50;
                        const remainingTrips = nextMilestone - currentTrips;
                        
                        const startDate = drv.reward?.started_at ? new Date(drv.reward.started_at).getTime() : Date.now();
                        const daysElapsed = Math.max(0.5, (Date.now() - startDate) / (1000 * 60 * 60 * 24));
                        const tripsGained = Math.max(0, currentTrips - (drv.reward?.start_tip_count || 0));
                        const tripsPerDay = tripsGained / daysElapsed;
                        
                        const firstSeenDate = drv.first_seen ? new Date(drv.first_seen).getTime() : startDate;
                        const totalDaysElapsed = Math.max(1, (Date.now() - firstSeenDate) / (1000 * 60 * 60 * 24));
                        const overallTripsPerDay = currentTrips / totalDaysElapsed;
                        
                        const finalTripsPerDay = tripsPerDay > 0 ? tripsPerDay : (overallTripsPerDay > 0 ? overallTripsPerDay : 4.8);
                        
                        const remainingDays = remainingTrips / finalTripsPerDay;
                        const projectedTime = Date.now() + (remainingDays * 24 * 60 * 60 * 1000);
                        const projectedDate = new Date(projectedTime);
                        const confidence = Math.min(98, Math.max(65, Math.floor(70 + (daysElapsed * 2.2))));
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-zinc-650 dark:text-zinc-300">
                            <div className="bg-white/60 dark:bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-150/40 dark:border-zinc-800/50">
                              <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Next Milestone</span>
                              <span className="text-base text-black dark:text-white font-black">{nextMilestone} Trips</span>
                              <span className="block text-[10px] text-zinc-450 mt-0.5">{remainingTrips} trips remaining</span>
                            </div>
                            
                            <div className="bg-white/60 dark:bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-150/40 dark:border-zinc-800/50">
                              <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Projected Date</span>
                              <span className="text-base text-emerald-600 dark:text-emerald-400 font-black">
                                {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="block text-[10px] text-zinc-450 mt-0.5">Est. in {Math.ceil(remainingDays)} days</span>
                            </div>
                            
                            <div className="bg-white/60 dark:bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-150/40 dark:border-zinc-800/50">
                              <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">AI Confidence Index</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-base text-teal-600 dark:text-teal-400 font-black">{confidence}%</span>
                                <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${confidence}%` }}></div>
                                </div>
                              </div>
                              <span className="block text-[10px] text-zinc-450 mt-1">Based on {finalTripsPerDay.toFixed(1)} trips/day pace</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2">
                      <button 
                        onClick={() => setResetConfirmationDriver(drv)}
                        className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-300 p-2 px-4 rounded-xl transition interactive-button flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        <span>Reset Reward Tracker</span>
                      </button>
                    </div>
                  </div>

                  {/* Milestone Payouts Section */}
                  {(() => {
                    const currentCycleTrips = drv.tip_count - drv.reward.start_tip_count;
                    const hasF10 = currentCycleTrips >= 10;
                    const hasF50 = currentCycleTrips >= 50;

                    return (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
                        <h3 className="text-[17px] font-extrabold text-black dark:text-white tracking-tight leading-none mb-1">Milestones & Payout Approvals</h3>
                        
                        <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                          {/* F10 Milestone */}
                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <span className="font-bold text-[14px] text-black dark:text-white block">F10 Milestone (10 Trips)</span>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">BDT 1,500.00 Payout</span>
                            </div>
                            <div>
                              {!hasF10 ? (
                                <span className="text-zinc-450 dark:text-zinc-500 font-bold">Locked ({10 - currentCycleTrips} trips left)</span>
                              ) : drv.reward.f10_done ? (
                                <span className="text-[#06C167] font-black flex items-center gap-1">✓ Paid</span>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await dismissRewardMilestone(drv.uuid, 'f10');
                                      showToast("success", `F10 Milestone approved for ${drv.name}`);
                                    } catch (_) {
                                      showToast("error", "Milestone approval failed.");
                                    }
                                  }}
                                  className="bg-[#06C167] text-white font-bold p-1.5 px-3 rounded-lg hover:opacity-85 transition interactive-button"
                                >
                                  Approve Payout
                                </button>
                              )}
                            </div>
                          </div>

                          {/* F50 Milestone */}
                          <div className="flex justify-between items-center pt-3.5">
                            <div>
                              <span className="font-bold text-[14px] text-black dark:text-white block">F50 Milestone (50 Trips)</span>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">BDT 5,000.00 Payout</span>
                            </div>
                            <div>
                              {!hasF50 ? (
                                <span className="text-zinc-450 dark:text-zinc-500 font-bold">Locked ({50 - currentCycleTrips} trips left)</span>
                              ) : drv.reward.f50_done ? (
                                <span className="text-[#06C167] font-black flex items-center gap-1">✓ Paid</span>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await dismissRewardMilestone(drv.uuid, 'f50');
                                      showToast("success", `F50 Milestone approved for ${drv.name}`);
                                    } catch (_) {
                                      showToast("error", "Milestone approval failed.");
                                    }
                                  }}
                                  className="bg-[#06C167] text-white font-bold p-1.5 px-3 rounded-lg hover:opacity-85 transition interactive-button"
                                >
                                  Approve Payout
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* No reward cycle active placeholder */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 mx-auto text-lg">
                    🏆
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[15.5px] text-black dark:text-white">No Active Reward Cycle</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-455 max-w-sm mx-auto leading-relaxed">
                      Reward tracking is not currently active for this driver. Start tracking to calculate trip milestones and handle payouts automatically.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setRewardTrackingDriver(drv);
                      setRewardCycleInput(52);
                    }}
                    className="interactive-button px-4 py-2 bg-black hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[12px] font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer select-none mx-auto"
                  >
                    <span>▶ Start Reward Tracking</span>
                  </button>
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    );
  };

  const renderActiveSubViewContent = () => {
    if (activeSubView === 'home') {
      return renderHomeView();
    }
    if (activeSubView === 'vehicles') {
      return renderVehiclesView();
    }
    if (activeSubView === 'performance') {
      return renderPerformanceTableView();
    }
    
    // activeSubView === 'drivers'
    if (currentDriverDetail) {
      return renderDriverProfileView(currentDriverDetail);
    } else {
      return renderDriversListView();
    }
  };

  return (
    <div id="drivers-dashboard-panel" className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 relative">
      
      {renderActiveSubViewContent()}

      {/* ────────────────────────────────────────────────────────
          STANDARD COMPLIANCE MODALS (RETAINED FROM ORIGINAL)
         ──────────────────────────────────────────────────────── */}

      {/* EDIT DRIVER MODAL */}
      {editingDriver && (
        <div
          id="driver-edit-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setEditingDriver(null)}
        >
          <div
            className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3.5">
              <h3 className="font-bold text-base text-black flex items-center gap-2">
                <Edit2 size={16} className="text-[#06C167]" />
                <span>Edit Details</span>
              </h3>
              <button
                onClick={() => setEditingDriver(null)}
                className="text-zinc-400 hover:text-black font-bold text-lg leading-none p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={editingDriver.name}
                  onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  className="w-full bg-zinc-100 border-none rounded-lg p-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1">Phone</label>
                <input
                  type="text"
                  value={editingDriver.phone}
                  onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                  className="w-full bg-zinc-100 border-none rounded-lg p-2 text-xs font-mono font-semibold focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1">Email</label>
                <input
                  type="text"
                  value={editingDriver.email}
                  onChange={(e) => setEditingDriver({ ...editingDriver, email: e.target.value })}
                  className="w-full bg-zinc-100 border-none rounded-lg p-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1">Status</label>
                <select
                  value={editingDriver.status || "Active"}
                  onChange={(e) => setEditingDriver({ ...editingDriver, status: e.target.value as any })}
                  className="w-full bg-zinc-100 border-none rounded-lg p-2 text-xs font-semibold focus:ring-1 focus:ring-black outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Applied">Applied</option>
                  <option value="Waitlisted">Waitlisted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setEditingDriver(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-150 text-black text-xs font-bold rounded-lg cursor-pointer transition select-none"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editingDriver.name.trim() || !editingDriver.phone.trim() || !editingDriver.email.trim()) {
                    showToast("error", "Please fill all required fields!");
                    return;
                  }
                  try {
                    await editDriver(editingDriver.uuid, {
                      name: editingDriver.name.trim(),
                      email: editingDriver.email.trim(),
                      phone: editingDriver.phone.trim(),
                      status: editingDriver.status || "Active",
                    });
                    showToast("success", `Updated ${editingDriver.name} successfully!`);
                    setEditingDriver(null);
                    if (currentDriverDetail && currentDriverDetail.uuid === editingDriver.uuid) {
                      setCurrentDriverDetail({
                        ...currentDriverDetail,
                        name: editingDriver.name.trim(),
                        email: editingDriver.email.trim(),
                        phone: editingDriver.phone.trim(),
                        status: editingDriver.status || "Active",
                      });
                    }
                  } catch (e) {
                    showToast("error", "Error saving details.");
                  }
                }}
                className="px-4 py-2 bg-[#06C167] text-white text-xs font-bold rounded-lg cursor-pointer transition select-none"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDriver && (
        <div
          id="driver-delete-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setDeletingDriver(null)}
        >
          <div
            className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-650 border-b border-zinc-100 pb-3">
              <Trash2 size={18} className="text-red-505" />
              <h3 className="font-bold text-base text-black">Delete Driver?</h3>
            </div>

            <div className="text-xs text-zinc-650">
              <p>
                Are you sure you want to remove <strong className="text-black">{deletingDriver.name}</strong> from database?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={async () => {
                  try {
                    await deleteDriver(deletingDriver.uuid, false);
                    showToast("success", `Soft deleted ${deletingDriver.name}.`);
                    setDeletingDriver(null);
                    if (currentDriverDetail && currentDriverDetail.uuid === deletingDriver.uuid) {
                      setCurrentDriverDetail(null);
                    }
                  } catch (_) {
                    showToast("error", "Delete failed.");
                  }
                }}
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl cursor-pointer transition text-center"
              >
                Soft Delete (Hide)
              </button>

              <button
                onClick={async () => {
                  try {
                    await deleteDriver(deletingDriver.uuid, true);
                    showToast("success", `Hard deleted ${deletingDriver.name} permanently.`);
                    setDeletingDriver(null);
                    if (currentDriverDetail && currentDriverDetail.uuid === deletingDriver.uuid) {
                      setCurrentDriverDetail(null);
                    }
                  } catch (_) {
                    showToast("error", "Permanent delete failed.");
                  }
                }}
                className="py-2.5 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-xl cursor-pointer transition text-center"
              >
                Hard Delete Permanently
              </button>

              <button
                onClick={() => setDeletingDriver(null)}
                className="py-2.5 bg-zinc-100 hover:bg-zinc-155 text-black text-xs font-bold rounded-xl cursor-pointer transition text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REWARD TRACKING CONFIGURATION MODAL */}
      {rewardTrackingDriver && (
        <div
          id="reward-tracking-start-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setRewardTrackingDriver(null)}
        >
          <div
            className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-3xl block">🏆</span>
            <h3 className="font-bold text-black text-base">Start Reward Tracking</h3>
            <p className="text-xs text-zinc-500">{rewardTrackingDriver.name}</p>

            <div className="flex items-center justify-center gap-3 py-2">
              <label className="text-xs font-bold text-zinc-700">Cycle size (trips):</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={rewardCycleInput}
                onChange={(e) => setRewardCycleInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center bg-zinc-100 border-none rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-black outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRewardTrackingDriver(null)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await startRewardTracking(rewardTrackingDriver.uuid, rewardTrackingDriver.tip_count, rewardCycleInput);
                    showToast("success", `Reward tracking started for ${rewardTrackingDriver.name}`);
                    setRewardTrackingDriver(null);
                  } catch (_) {
                    showToast("error", "Failed starting reward tracking.");
                  }
                }}
                className="flex-1 py-2 bg-black text-white hover:bg-zinc-850 text-xs font-bold rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {resetConfirmationDriver && (
        <div
          id="reward-tracking-reset-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setResetConfirmationDriver(null)}
        >
          <div
            className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-3xl block">🔄</span>
            <h3 className="font-bold text-black text-base">Reset Reward Tracking?</h3>
            <p className="text-xs text-zinc-500">{resetConfirmationDriver.name}</p>

            <div className="flex gap-2">
              <button
                onClick={() => setResetConfirmationDriver(null)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await resetReward(resetConfirmationDriver.uuid);
                    showToast("success", `Reset rewards for ${resetConfirmationDriver.name}`);
                    setResetConfirmationDriver(null);
                  } catch (_) {
                    showToast("error", "Reset failed.");
                  }
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-lg"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && (
        <div
          id="bulk-delete-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setShowBulkDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-650 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <Trash2 size={18} className="text-red-500" />
              <h3 className="font-bold text-base text-black dark:text-white">Bulk Delete Drivers</h3>
            </div>

            <div className="text-xs text-zinc-650 dark:text-zinc-400">
              <p>
                Are you sure you want to delete <strong className="text-black dark:text-white">{selectedIds.size}</strong> selected drivers?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={async () => {
                  try {
                    await bulkDeleteDrivers(Array.from(selectedIds), false);
                    setSelectedIds(new Set());
                    showToast("success", `Soft deleted ${selectedIds.size} drivers.`);
                    setShowBulkDeleteModal(false);
                  } catch (_) {
                    showToast("error", "Bulk soft delete failed.");
                  }
                }}
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl cursor-pointer transition text-center"
              >
                Soft Delete (Hide)
              </button>

              <button
                onClick={async () => {
                  try {
                    await bulkDeleteDrivers(Array.from(selectedIds), true);
                    setSelectedIds(new Set());
                    showToast("success", `Permanently deleted ${selectedIds.size} drivers.`);
                    setShowBulkDeleteModal(false);
                  } catch (_) {
                    showToast("error", "Bulk permanent delete failed.");
                  }
                }}
                className="py-2.5 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-xl cursor-pointer transition text-center"
              >
                Hard Delete Permanently
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="py-2.5 bg-zinc-100 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-bold rounded-xl cursor-pointer transition text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK RESET REWARD MODAL */}
      {showBulkResetModal && (
        <div
          id="bulk-reset-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setShowBulkResetModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-3xl block">🔄</span>
            <h3 className="font-bold text-black dark:text-white text-base">Bulk Reset Rewards</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Are you sure you want to reset reward cycle progress for all <strong className="text-black dark:text-white">{selectedIds.size}</strong> selected drivers?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkResetModal(false)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await bulkResetReward(Array.from(selectedIds));
                    setSelectedIds(new Set());
                    showToast("success", `Reset progress for ${selectedIds.size} drivers.`);
                    setShowBulkResetModal(false);
                  } catch (_) {
                    showToast("error", "Bulk reset failed.");
                  }
                }}
                className="flex-1 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK START REWARD MODAL */}
      {showBulkStartModal && (
        <div
          id="bulk-start-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setShowBulkStartModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 text-[#06C167]">
              <span className="text-lg">🏆</span>
              <h3 className="font-bold text-base text-black dark:text-white">Start Bulk Reward Tracking</h3>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <p className="text-zinc-650 dark:text-zinc-400">
                You are starting reward tracking for <strong className="text-black dark:text-white">{selectedIds.size}</strong> selected drivers.
              </p>
              
              <div className="space-y-1.5">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider">
                  Target Cycle Size (Trips):
                </label>
                <input
                  type="number"
                  value={bulkStartCycleSize}
                  onChange={(e) => setBulkStartCycleSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-bold text-black dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowBulkStartModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await bulkStartRewardTracking(Array.from(selectedIds), bulkStartCycleSize);
                    setSelectedIds(new Set());
                    showToast("success", `Started reward tracking for ${selectedIds.size} drivers.`);
                    setShowBulkStartModal(false);
                  } catch (_) {
                    showToast("error", "Bulk start failed.");
                  }
                }}
                className="flex-1 py-2.5 bg-[#06C167] hover:bg-[#05a858] text-white font-extrabold rounded-xl transition shadow-sm cursor-pointer"
              >
                Start Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-950 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-zinc-800 animate-slide-up">
          <CheckCircle size={14} className="text-[#06C167]" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
