import { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import ImportHTML from './components/ImportHTML';
import SandboxSimulator from './components/SandboxSimulator';
import FirebaseSetupPanel from './components/FirebaseSetupPanel';
import SettingsPanel from './components/SettingsPanel';
import BankingPanel from './components/BankingPanel';
import AccountPanel from './components/AccountPanel';
import { listenToAuth, getNotificationSettings, getLastSyncTime, logOutUser } from './firebase';
import { 
  Home,
  Mail,
  FileText,
  Users,
  Car,
  TrendingUp,
  DollarSign,
  MapPin,
  Tag,
  User as UserIcon,
  Download,
  Database,
  Settings,
  Laptop,
  ClipboardList,
  Menu,
  Sun,
  Moon,
  LogOut,
  AlertTriangle,
  FileSpreadsheet,
  Briefcase,
  BookOpen,
  Info,
  ChevronRight,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Sync warning state
  const [hoursSince, setHoursSince] = useState<number>(0);
  const [reminderHours, setReminderHours] = useState<number>(72);

  // Initialize and track theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark';
    const init = saved || 'light';
    document.documentElement.setAttribute('data-theme', init);
    if (init === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return init;
  });

  useEffect(() => {
    const unsub = listenToAuth((usr) => {
      setUser(usr);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem("displayName_" + user.uid);
      setDisplayName(saved || user.displayName || user.email?.split("@")[0] || "Manager");
    }
  }, [user]);

  useEffect(() => {
    const handleUpdate = () => {
      if (user) {
        const saved = localStorage.getItem("displayName_" + user.uid);
        setDisplayName(saved || user.displayName || user.email?.split("@")[0] || "Manager");
      }
    };
    window.addEventListener("user_profile_updated", handleUpdate);
    return () => window.removeEventListener("user_profile_updated", handleUpdate);
  }, [user]);

  const checkSyncAge = () => {
    const lastSyncStr = getLastSyncTime();
    if (lastSyncStr) {
      const ms = Date.now() - new Date(lastSyncStr).getTime();
      setHoursSince(ms / (1000 * 60 * 60));
    } else {
      setHoursSince(0);
    }

    const uid = user?.uid || 'default';
    const notif = getNotificationSettings(uid);
    setReminderHours(notif.sync_reminder ? (notif.sync_reminder_hours || 72) : 999999);
  };

  useEffect(() => {
    checkSyncAge();
    window.addEventListener('driver_db_updated', checkSyncAge);
    window.addEventListener('notif_settings_updated', checkSyncAge);
    
    const syncTheme = () => {
      const current = (localStorage.getItem('theme') || 'light') as 'light' | 'dark';
      setTheme(current);
    };
    window.addEventListener('theme_changed', syncTheme);

    return () => {
      window.removeEventListener('driver_db_updated', checkSyncAge);
      window.removeEventListener('notif_settings_updated', checkSyncAge);
      window.removeEventListener('theme_changed', syncTheme);
    };
  }, [user]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', next);
    setTheme(next);
    window.dispatchEvent(new Event('theme_changed'));
  };

  const showToast = (type: 'success' | 'info' | 'error', msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'vehicles', label: 'Daily Reports', icon: ClipboardList },
    { id: 'banking', label: 'Banking', icon: Briefcase },
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'import', label: 'Import HTML', icon: ClipboardList },
    { id: 'sandbox', label: 'Simulator', icon: Laptop },
    { id: 'connection', label: 'Database Connection', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard activeSubView="home" onNavigate={setActiveTab} onOpenMenu={() => setMobileMenuOpen(true)} />;
      case 'drivers':
        return <Dashboard activeSubView="drivers" onNavigate={setActiveTab} onOpenMenu={() => setMobileMenuOpen(true)} />;
      case 'vehicles':
        return <Dashboard activeSubView="vehicles" onNavigate={setActiveTab} onOpenMenu={() => setMobileMenuOpen(true)} />;
      case 'import':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Import HTML</h1>
              </div>
            </header>
            <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto">
              <ImportHTML onSuccess={() => setActiveTab('drivers')} />
            </div>
          </div>
        );
      case 'sandbox':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Simulator</h1>
              </div>
            </header>
            <div className="p-4 sm:p-6 w-full mx-auto">
              <SandboxSimulator />
            </div>
          </div>
        );
      case 'connection':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Database Connection</h1>
              </div>
            </header>
            <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto">
              <FirebaseSetupPanel />
            </div>
          </div>
        );
      case 'banking':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Banking Logs</h1>
              </div>
            </header>
            <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto">
              <BankingPanel />
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">My Account</h1>
              </div>
            </header>
            <div className="p-4 sm:p-6 w-full mx-auto">
              <AccountPanel user={user} />
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Settings</h1>
              </div>
            </header>
            <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto">
              <SettingsPanel onShowToast={showToast} />
            </div>
          </div>
        );
      default:
        const activeItem = navigationItems.find(item => item.id === activeTab);
        return (
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
            <header className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">{activeItem?.label || 'Screen'}</h1>
              </div>
            </header>
            <div className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 flex items-center justify-center">
                {activeItem && <activeItem.icon size={28} className="text-zinc-400" />}
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white">{activeItem?.label} Content</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-normal">
                This section represents the {activeItem?.label?.toLowerCase() || 'selected'} screen from your fleet partner interface.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderSidebarContent = (isDrawer: boolean = false) => {
    return (
      <div className="h-full flex flex-col justify-between bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 font-sans">
        {/* App Branding Block */}
        <div className="p-5 pt-6 pb-4 flex items-center gap-3 shrink-0 select-none border-b border-zinc-150 dark:border-zinc-900">
          <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-sm shrink-0">
            <RefreshCw size={14} />
          </div>
          <span className="font-display font-extrabold text-[17px] tracking-tight text-black dark:text-white">
            Uber Fleet Sync
          </span>
        </div>

        {/* Profile Info Block */}
        <div className="p-6 pt-5 pb-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
          <div className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm uppercase shrink-0">
            {displayName ? displayName.charAt(0) : user?.email?.charAt(0) || "M"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[14.5px] text-black dark:text-white tracking-tight leading-tight truncate">
              {displayName || user?.email?.split("@")[0] || "Manager"}
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold tracking-wide uppercase mt-0.5">Manager</p>
          </div>
        </div>

        {/* Navigation links list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 no-scrollbar">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isDrawer) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-md text-left text-[14px] font-medium transition-colors interactive-button relative ${
                  active 
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white pl-6' 
                    : 'text-zinc-750 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-black dark:bg-white rounded-r" />
                )}
                <Icon size={16} className={active ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-450'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 shrink-0 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-400 transition"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={logOutUser}
            className="flex items-center gap-1.5 p-2 px-3.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition text-xs font-bold interactive-button border border-transparent hover:border-red-200 dark:hover:border-transparent"
          >
            <LogOut size={13} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-base)] flex text-[var(--text-base)] relative overflow-hidden">
      
      {/* 1. PERSISTENT SIDEBAR FOR DESKTOP VIEWPORTS (>= md: 768px) */}
      <aside className="hidden md:block w-[260px] h-full border-r border-zinc-200 dark:border-zinc-900 shrink-0 z-20">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        
        {/* Sync Age Warning Banner */}
        {hoursSince >= reminderHours && activeTab !== 'import' && (
          <div className="bg-amber-50 dark:bg-amber-950/25 border-b border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 p-2.5 px-6 text-xs font-semibold flex justify-between items-center z-10 shrink-0 animate-enter">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 dark:text-amber-500 shrink-0" />
              <span>Database Sync Status: Data is {Math.floor(hoursSince / 24)} days old. Please sync from portal.</span>
            </div>
            <button 
              onClick={() => setActiveTab('import')}
              className="bg-amber-900 dark:bg-amber-400 text-white dark:text-black rounded-full p-1.5 px-4 hover:opacity-90 text-[11px] interactive-button font-bold"
            >
              Sync Now
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {renderActiveScreen()}
        </div>

        {/* Global Toast Alert Banner */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed bottom-6 right-6 z-50 p-3.5 px-5 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl flex items-center gap-3"
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                toast.type === 'success' ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' :
                toast.type === 'error' ? 'bg-red-50 text-red-650 dark:bg-red-950/45 dark:text-red-400' :
                'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
              }`}>
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
              </span>
              <p className="text-sm font-semibold tracking-tight">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. MOBILE SIDEBAR DRAWER OVERLAY (< md: 768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-start md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="w-[290px] h-full flex flex-col bg-white shadow-2xl relative border-r border-zinc-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Close Button */}
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 text-zinc-500 z-30"
              >
                <X size={20} />
              </button>

              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
