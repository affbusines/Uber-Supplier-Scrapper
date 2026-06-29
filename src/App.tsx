import { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import Dashboard from './components/Dashboard';
import logoImg from './assets/logo.png';
import LoginPage from './components/LoginPage';
import ImportHTML from './components/ImportHTML';
import SandboxSimulator from './components/SandboxSimulator';
import FirebaseSetupPanel from './components/FirebaseSetupPanel';
import SettingsPanel from './components/SettingsPanel';
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
  X
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
    { id: 'vehicles', label: 'Vehicles', icon: Car },
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
            <header className="px-6 py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Import HTML</h1>
              </div>
            </header>
            <div className="p-6 max-w-4xl w-full mx-auto">
              <ImportHTML onSuccess={() => setActiveTab('drivers')} />
            </div>
          </div>
        );
      case 'sandbox':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-6 py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Simulator</h1>
              </div>
            </header>
            <div className="p-6 w-full mx-auto">
              <SandboxSimulator />
            </div>
          </div>
        );
      case 'connection':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-6 py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Database Connection</h1>
              </div>
            </header>
            <div className="p-6 max-w-4xl w-full mx-auto">
              <FirebaseSetupPanel />
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar bg-white dark:bg-zinc-950">
            <header className="px-6 py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">Settings</h1>
              </div>
            </header>
            <div className="p-6 max-w-4xl w-full mx-auto">
              <SettingsPanel onShowToast={showToast} />
            </div>
          </div>
        );
      default:
        const activeItem = navigationItems.find(item => item.id === activeTab);
        return (
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
            <header className="px-6 py-5 flex items-center justify-between bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden interactive-button p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  <Menu size={24} className="text-black dark:text-white" />
                </button>
                <h1 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-none">{activeItem?.label || 'Screen'}</h1>
              </div>
            </header>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
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
        <div className="p-5 pt-6 pb-4 flex items-center gap-3 shrink-0 select-none border-b border-zinc-100 dark:border-zinc-900">
          <img 
            src={logoImg} 
            alt="Uber Fleet Sync Logo"
            className="w-8 h-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
          />
          <span className="font-black text-[15.5px] tracking-tight text-black dark:text-white">
            Uber Fleet Sync
          </span>
        </div>

        {/* Profile Info Block */}
        <div className="p-6 pt-5 pb-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" 
            alt="MD. SHAFIQUL ISLAM"
            className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-[14.5px] text-black dark:text-white tracking-tight leading-tight truncate">MD. SHAFIQUL ISLAM</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold tracking-wide uppercase mt-0.5">Fleet Owner</p>
          </div>
        </div>

        {/* Navigation links list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar">
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
                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-left text-[14.5px] font-bold transition-colors interactive-button ${
                  active 
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white' 
                    : 'text-zinc-800 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <Icon size={17} className={active ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 shrink-0 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={logOutUser}
            className="flex items-center gap-1.5 p-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition text-xs font-bold interactive-button"
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
          <div className="bg-amber-50 border-b border-amber-200 text-amber-950 p-2.5 px-6 text-xs font-semibold flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>Database Sync Status: Data is {Math.floor(hoursSince / 24)} days old. Please sync from portal.</span>
            </div>
            <button 
              onClick={() => setActiveTab('import')}
              className="bg-amber-950 text-white rounded p-1.5 px-3.5 hover:opacity-85 text-[11px] interactive-button font-bold"
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
              className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 ${
                toast.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                  : toast.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : 'bg-zinc-950 text-white border-zinc-800'
              }`}
            >
              <span className="text-base shrink-0 font-bold">
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
