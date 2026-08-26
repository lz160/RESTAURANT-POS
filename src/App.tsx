import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppSidebar, NavView } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { CommandPalette } from './components/layout/CommandPalette';
import { LoginView } from './components/auth/LoginView';
import { AccessDeniedView } from './components/auth/AccessDeniedView';
import { CustomerH5View } from './components/client/CustomerH5View';
import { KDSView } from './components/kds/KDSView';
import { ExpoPackView } from './components/kds/ExpoPackView';
import { CallingScreen } from './components/calling/CallingScreen';
import { CounterScanView } from './components/counter/CounterScanView';
import { SaaSAdminDashboard, AdminTab } from './components/admin/SaaSAdminDashboard';
import { UnifiedMenuWorkshop } from './components/admin/UnifiedMenuWorkshop';
import { ArchitectureSpecView } from './components/docs/ArchitectureSpecView';
import { canAccessView, getRoleDefaultView } from './utils/rbac';
import {
  Smartphone,
  ChefHat,
  Tv,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    currentStore,
    currentStaffUser,
    isAuthenticated,
    simulateTraffic,
    theme,
    t,
  } = useApp();

  const [currentView, setCurrentView] = useState<NavView>('SAAS_ADMIN');
  const [adminTab, setAdminTab] = useState<AdminTab>('FLEET_HUB');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync Dark/Light class to root HTML element for shadcn styling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Adjust view when user switches role or when unauthorized
  useEffect(() => {
    if (!isAuthenticated) return;
    const isAllowed = canAccessView(
      currentStaffUser.role,
      currentView,
      currentView === 'SAAS_ADMIN' ? adminTab : undefined
    );
    if (!isAllowed) {
      const defaultHome = getRoleDefaultView(currentStaffUser.role);
      setCurrentView(defaultHome.view);
      if (defaultHome.tab) {
        setAdminTab(defaultHome.tab as AdminTab);
      }
    }
  }, [currentStaffUser.id, currentStaffUser.role, isAuthenticated]);

  // Global Keyboard Shortcut: ⌘K for Command Palette, ⌘B to toggle Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarHidden((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Check if current view is permitted for this role
  const isViewPermitted = canAccessView(
    currentStaffUser.role,
    currentView,
    currentView === 'SAAS_ADMIN' ? adminTab : undefined
  );

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden select-none font-sans bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* 1. Full-Width Top App Header (Placed on top of the sidebar) */}
      <AppHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        adminTab={adminTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isSidebarHidden={isSidebarHidden}
        onToggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)}
      />

      {/* 2. Main Content & Sidebar Layout Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Hideable / Collapsible Sidebar */}
        {!isSidebarHidden && (
          <AppSidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            adminTab={adminTab}
            setAdminTab={(tab) => setAdminTab(tab as AdminTab)}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            onHide={() => setIsSidebarHidden(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
        )}

        {/* Dynamic Main Viewport Canvas */}
        <main className="flex-1 overflow-hidden relative bg-zinc-100/60 dark:bg-zinc-950">
          {!isViewPermitted ? (
            <AccessDeniedView
              attemptedView={currentView}
              attemptedTab={adminTab}
              onNavigateHome={(view, tab) => {
                setCurrentView(view);
                if (tab) setAdminTab(tab);
              }}
            />
          ) : (
            <>
              {/* VIEW 0: SaaS Admin Dashboard */}
              {currentView === 'SAAS_ADMIN' && (
                <div className="w-full h-full overflow-hidden">
                  <SaaSAdminDashboard
                    externalActiveTab={adminTab}
                    onTabChange={(tab) => setAdminTab(tab)}
                  />
                </div>
              )}

              {/* VIEW: Menu & Recipe BOM Workshop */}
              {currentView === 'MENU_WORKSHOP' && (
                <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-950">
                  <div className="max-w-7xl mx-auto">
                    <UnifiedMenuWorkshop />
                  </div>
                </div>
              )}

              {/* VIEW 1: Split Sandbox Mode */}
              {currentView === 'SPLIT_SANDBOX' && (
                <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800 bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
                  {/* Customer H5 Simulator */}
                  <div className="w-full lg:w-96 shrink-0 h-1/2 lg:h-full flex flex-col p-2 sm:p-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 text-xs font-bold text-zinc-500">
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Smartphone className="w-4 h-4" />
                        📱 {t('customerH5')}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{currentStore.currency} 结账</span>
                    </div>
                    <div className="flex-1 border border-zinc-300 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm relative bg-white dark:bg-zinc-900">
                      <CustomerH5View />
                    </div>
                  </div>

                  {/* KDS Kitchen */}
                  <div className="flex-1 h-1/2 lg:h-full flex flex-col p-2 sm:p-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 text-xs font-bold text-zinc-500">
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <ChefHat className="w-4 h-4" />
                        🍳 {t('kdsStations')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => simulateTraffic(1)}
                          className="text-[11px] bg-zinc-200 dark:bg-zinc-800 hover:bg-amber-500 hover:text-stone-950 font-bold px-2 py-0.5 rounded-lg transition"
                        >
                          +注入1单测试
                        </button>
                        <span className="text-[10px] text-zinc-400">水吧 / 炸台 / Expo</span>
                      </div>
                    </div>
                    <div className="flex-1 border border-zinc-300 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                      <KDSView />
                    </div>
                  </div>

                  {/* Calling Screen TV */}
                  <div className="hidden xl:flex w-96 shrink-0 h-full flex-col p-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 text-xs font-bold text-zinc-500">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Tv className="w-4 h-4" />
                        📢 {t('callingTv')}
                      </span>
                      <span className="text-[10px] text-zinc-400">取餐大屏</span>
                    </div>
                    <div className="flex-1 border border-zinc-300 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                      <CallingScreen />
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: Customer H5 Standalone */}
              {currentView === 'CUSTOMER_H5' && (
                <div className="w-full h-full flex items-center justify-center p-0 sm:p-4 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  <div className="w-full h-full max-w-md max-h-[96vh] sm:border sm:border-zinc-300 dark:sm:border-zinc-800 sm:rounded-3xl sm:shadow-lg overflow-hidden bg-white dark:bg-zinc-900">
                    <CustomerH5View />
                  </div>
                </div>
              )}

              {/* VIEW 3: KDS Stations */}
              {currentView === 'KDS_STATIONS' && (
                <div className="w-full h-full overflow-hidden">
                  <KDSView />
                </div>
              )}

              {/* VIEW 4: Expo Pack */}
              {currentView === 'EXPO_PACK' && (
                <div className="w-full h-full overflow-hidden">
                  <ExpoPackView />
                </div>
              )}

              {/* VIEW 5: Calling TV Screen */}
              {currentView === 'CALLING_TV' && (
                <div className="w-full h-full overflow-hidden">
                  <CallingScreen />
                </div>
              )}

              {/* VIEW 6: Counter Scanner & POS Cashier */}
              {currentView === 'COUNTER_SCAN' && (
                <div className="w-full h-full overflow-hidden">
                  <CounterScanView />
                </div>
              )}

              {/* VIEW 7: Architecture Spec & AI Master Prompt */}
              {currentView === 'ARCHITECTURE_SPEC' && (
                <div className="w-full h-full overflow-hidden">
                  <ArchitectureSpecView />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Command Palette (⌘K) Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(view) => setCurrentView(view)}
        onSelectTab={(tab) => {
          setAdminTab(tab as AdminTab);
          setCurrentView('SAAS_ADMIN');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
