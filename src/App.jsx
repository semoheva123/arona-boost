import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Wifi,
  BatteryFull
} from 'lucide-react';
import { apiRequest, assetUrl, getStoredToken, setStoredToken } from './api';
import { LanguageSwitcherPill, useI18n } from './i18n';
import BrandLogo from './components/BrandLogo';
import AuthScreen from './components/AuthScreen';
import HomeTab from './components/HomeTab';
import EarningsTab from './components/EarningsTab';
import TasksTab from './components/TasksTab';
import TeamTab from './components/TeamTab';
import AccountTab from './components/AccountTab';
import BottomNav from './components/BottomNav';
import DepositSheet from './components/DepositSheet';
import WithdrawSheet from './components/WithdrawSheet';
import AdminSheet from './components/AdminSheet';
import NotificationsSheet from './components/NotificationsSheet';
import VaultSheet from './components/VaultSheet';
import LuckyWheelSheet from './components/LuckyWheelSheet';
import StatementLedgerSheet from './components/StatementLedgerSheet';
import CorporateCharterSheet from './components/CorporateCharterSheet';
import ConciergeSheet from './components/ConciergeSheet';
import WelcomeNoticePopup from './components/WelcomeNoticePopup';
import RedEnvelopeSheet from './components/RedEnvelopeSheet';
import PointShopSheet from './components/PointShopSheet';

function getClockText() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [vipLevels, setVipLevels] = useState([]);
  const [platformConfig, setPlatformConfig] = useState(null);
  const [publicConfig, setPublicConfig] = useState(null);
  const [clockText, setClockText] = useState(getClockText);
  const [pwaPrompt, setPwaPrompt] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [earningsSubTab, setEarningsSubTab] = useState('guide');
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  // Modals / Sheets
  const [depositSheet, setDepositSheet] = useState({
    open: false,
    amount: null,
    tier: null
  });
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [redEnvelopeOpen, setRedEnvelopeOpen] = useState(false);
  const [pointShopOpen, setPointShopOpen] = useState(false);
  const [charterSheet, setCharterSheet] = useState({ open: false, section: 'charter' });
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [recordsSheet, setRecordsSheet] = useState({ open: false, tab: 'daily' });
  const { t } = useI18n();

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Desktop iPhone bezel clock updater
  useEffect(() => {
    const timer = setInterval(() => setClockText(getClockText()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Capture Android/Chrome native PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerPwaInstall = useCallback(async () => {
    if (!pwaPrompt) return;
    try {
      pwaPrompt.prompt();
      await pwaPrompt.userChoice;
    } catch {
      // ignore cancelled prompt
    } finally {
      setPwaPrompt(null);
    }
  }, [pwaPrompt]);

  // Register PWA service worker safely with subpath-aware URL
  useEffect(() => {
    try {
      const inIframe = window.self !== window.top;
      if (!inIframe && 'serviceWorker' in navigator && navigator.serviceWorker) {
        navigator.serviceWorker.register(assetUrl('/sw.js')).catch(() => {});
      }
    } catch {
      // ignore iframe storage/SW restrictions
    }
  }, []);

  // Hard fail-safe so booting spinner can NEVER block UI rendering
  useEffect(() => {
    const guard = setTimeout(() => setBooting(false), 2500);
    return () => clearTimeout(guard);
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const pub = await apiRequest('/api/public-config');
      setPublicConfig(pub);
      if (pub.vipLevels) setVipLevels(pub.vipLevels);
    } catch {
      // ignore offline
    }

    const token = getStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    try {
      const data = await apiRequest('/api/me');
      setUser(data.user);
      setTodayStats(data.todayStats);
      setVipLevels(data.vipLevels || []);
      setPlatformConfig(data);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Background poll for new broadcast/private notifications & balance updates
  useEffect(() => {
    if (!user?.id) return;
    const poll = setInterval(async () => {
      try {
        const data = await apiRequest('/api/me');
        if (data?.user) setUser(data.user);
        if (data?.todayStats) setTodayStats(data.todayStats);
        setPlatformConfig(data);
      } catch {
        // ignore transient offline
      }
    }, 20000);
    return () => clearInterval(poll);
  }, [user?.id]);

  const handleUserUpdated = useCallback((nextUser, nextStats) => {
    if (nextUser) setUser(nextUser);
    if (nextStats) setTodayStats(nextStats);
  }, []);

  const handleAuthSuccess = (authData) => {
    if (authData?.token) {
      setStoredToken(authData.token);
    }
    if (authData?.user) {
      setUser(authData.user);
    }
    if (authData?.todayStats) {
      setTodayStats(authData.todayStats);
    }
    if (authData?.vipLevels) {
      setVipLevels(authData.vipLevels);
    }
    setPlatformConfig(authData);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setActiveTab('home');
    showToast('تم تسجيل خروجك من Arona Boost بنجاح');
  };

  const handleOpenDeposit = (amount = null, tier = null) => {
    setDepositSheet({ open: true, amount, tier });
  };

  const handleOpenCharter = (section = 'charter') => {
    setCharterSheet({
      open: true,
      section: typeof section === 'string' ? section : 'charter'
    });
  };

  const handleTransactionCompleted = (res) => {
    if (res?.message) {
      showToast(res.message);
    }
    if (res?.user) {
      setUser(res.user);
    } else if (res?.id) {
      setUser(res);
    }
    if (res?.todayStats) {
      setTodayStats(res.todayStats);
    }
    setTxRefreshKey((k) => k + 1);
    fetchSession();
  };

  if (booting) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#061424]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#F5D076] border border-[#F5D076]/40 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #07182B 0%, #0D6E66 100%)'
            }}
          >
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <p className="font-display text-sm font-bold text-[#F5D076]">Arona Boost</p>
        </div>
      </div>
    );
  }

  const activeConfig = platformConfig || publicConfig || {};
  const whatsappNumber = activeConfig.whatsappNumber || '963990000000';
  const unreadCount = user?.unreadNotifications ?? 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#071525] via-[#0B2038] to-[#071525] flex justify-center lg:py-4">
      {/* Mobile Fullscreen / Desktop iPhone Titanium Bezel Frame (matching tashare8 PC view in Royal Colors) */}
      <div className="w-full max-w-[430px] min-h-dvh lg:min-h-[860px] bg-[#EFF3F8] relative shadow-[0_24px_80px_rgba(0,0,0,0.48)] lg:rounded-[44px] lg:border-[7px] lg:border-[#10253E] lg:ring-1 lg:ring-[#F5D076]/35 flex flex-col overflow-x-clip">
        {/* Desktop-only iPhone Status Bar & Dynamic Island */}
        <div
          className="hidden lg:flex items-center justify-between px-6 pt-2 pb-1 text-[11px] font-extrabold text-slate-200 select-none"
          style={{ background: '#051322' }}
          dir="ltr"
        >
          <span className="tabular-nums">{clockText}</span>
          <div className="w-24 h-4 rounded-full bg-black/80 border border-white/10" />
          <div className="flex items-center gap-1.5 text-slate-200">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryFull className="w-4 h-4 text-[#F5D076]" />
          </div>
        </div>

        {/* Global Floating Toast */}
        {toast && (
          <div className="fixed top-4 inset-x-0 z-[140] flex justify-center px-4 pointer-events-none">
            <div
              className={`max-w-[390px] w-full rounded-2xl px-4 py-3 shadow-xl border flex items-center gap-2.5 pointer-events-auto animate-tab ${
                toast.type === 'error'
                  ? 'bg-rose-950/95 border-rose-700/80 text-white'
                  : 'bg-[#061628]/96 border-[#F5D076]/35 text-white'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#F5D076] shrink-0" />
              )}
              <p className="text-xs font-bold leading-relaxed">{toast.message}</p>
            </div>
          </div>
        )}

        {!user ? (
          <AuthScreen
            onAuthSuccess={handleAuthSuccess}
            showToast={showToast}
            whatsappNumber={whatsappNumber}
          />
        ) : (
          <>
            {/* 3-Zone Symmetric Top Header Bar (matching tashare8 layout in Arona Royal Colors) */}
            <header
              className="sticky top-0 z-30 border-b border-[#F5D076]/25 px-3.5 py-2.5 grid grid-cols-3 items-center shadow-[0_10px_28px_rgba(5,19,34,0.22)] relative"
              style={{
                background:
                  'linear-gradient(145deg, #051322 0%, #081F37 62%, #0B3A4E 100%)'
              }}
            >
              <div
                className="pointer-events-none absolute bottom-0 inset-x-0 h-[1px]"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(245,208,118,0.06) 0%, rgba(245,208,118,0.55) 50%, rgba(245,208,118,0.06) 100%)'
                }}
              />

              {/* Zone 1: Official Messages / Notifications Envelope with Red Badge */}
              <div className="flex items-center justify-start gap-1.5">
                <button
                  type="button"
                  onClick={() => setNotifOpen(true)}
                  title="صندوق الرسائل والإشعارات"
                  className="relative w-9 h-9 rounded-xl bg-white/10 border border-[#F5D076]/30 text-[#F5D076] flex items-center justify-center hover:bg-white/18 transition-colors cursor-pointer"
                >
                  <Mail className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="ltr-num tabular-nums absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9.5px] font-extrabold flex items-center justify-center shadow-xs ring-2 ring-[#071A2E]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {user.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setAdminOpen(true)}
                    title={t('admin_btn', 'الإدارة')}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/12 hover:bg-white/20 border border-[#F5D076]/35 text-white px-2 py-1.5 text-[10px] font-extrabold cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F5D076]" />
                    <span>{t('admin_btn', 'الإدارة')}</span>
                  </button>
                )}
              </div>

              {/* Zone 2: Centered Brand Crest */}
              <div className="flex items-center justify-center">
                <BrandLogo size="sm" variant="light" />
              </div>

              {/* Zone 3: Language & Country Switcher Pill */}
              <div className="flex items-center justify-end">
                <LanguageSwitcherPill compact={true} />
              </div>
            </header>

            {/* Startup Employee Notice Popup (with "عدم التذكير اليوم") */}
            <WelcomeNoticePopup
              welcomePopup={activeConfig.welcomePopup}
              userId={user.id}
              onOpenRedEnvelope={() => setRedEnvelopeOpen(true)}
            />

            {/* Active Tab View */}
            <main className="flex-1 px-4 pt-3.5 pb-28">
              {activeTab === 'home' && (
                <HomeTab
                  user={user}
                  todayStats={todayStats}
                  vipLevels={vipLevels}
                  announcements={activeConfig.announcements}
                  liveTickerEnabled={activeConfig.liveTickerEnabled !== false}
                  pwaPrompt={pwaPrompt}
                  onTriggerPwaInstall={handleTriggerPwaInstall}
                  onOpenDeposit={handleOpenDeposit}
                  onOpenWithdraw={() => setWithdrawOpen(true)}
                  onOpenVault={() => setVaultOpen(true)}
                  onOpenRedEnvelope={() => setRedEnvelopeOpen(true)}
                  onOpenPointShop={() => setPointShopOpen(true)}
                  onOpenWheel={() => setWheelOpen(true)}
                  onOpenCharter={handleOpenCharter}
                  onOpenEarnings={(sub = 'guide') => {
                    setEarningsSubTab(sub);
                    setActiveTab('earnings');
                  }}
                  onNavigateTab={setActiveTab}
                  onUserUpdated={handleUserUpdated}
                  showToast={showToast}
                />
              )}

              {activeTab === 'earnings' && (
                <EarningsTab
                  user={user}
                  vipLevels={vipLevels}
                  platformConfig={activeConfig}
                  initialSubTab={earningsSubTab}
                  onOpenDeposit={handleOpenDeposit}
                  onOpenCharter={() => handleOpenCharter('charter')}
                  onNavigateTab={setActiveTab}
                  onUserUpdated={handleUserUpdated}
                  showToast={showToast}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksTab
                  user={user}
                  onUserUpdated={(u, stats) => {
                    handleUserUpdated(u, stats);
                    fetchSession();
                  }}
                  onOpenGrades={() => {
                    setEarningsSubTab('grades');
                    setActiveTab('earnings');
                  }}
                  onNavigateTab={setActiveTab}
                  onNavigateHome={() => setActiveTab('home')}
                  showToast={showToast}
                />
              )}

              {activeTab === 'team' && (
                <TeamTab
                  user={user}
                  onUserUpdated={handleUserUpdated}
                  showToast={showToast}
                />
              )}

              {activeTab === 'account' && (
                <AccountTab
                  user={user}
                  whatsappNumber={whatsappNumber}
                  guaranteeDurationDays={activeConfig.guaranteeDurationDays || 365}
                  refreshKey={txRefreshKey}
                  onOpenDeposit={() => handleOpenDeposit()}
                  onOpenWithdraw={() => setWithdrawOpen(true)}
                  onOpenRecords={(tab = 'daily') => setRecordsSheet({ open: true, tab })}
                  onOpenWheel={() => setWheelOpen(true)}
                  onOpenRedEnvelope={() => setRedEnvelopeOpen(true)}
                  onOpenPointShop={() => setPointShopOpen(true)}
                  onOpenCharter={handleOpenCharter}
                  onOpenConcierge={() => setConciergeOpen(true)}
                  onOpenAdmin={() => setAdminOpen(true)}
                  onUserUpdated={handleUserUpdated}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
              )}
            </main>

            {/* Fixed Bottom Navigation */}
            <BottomNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              remainingTasks={Math.max(
                0,
                (todayStats?.dailyTasksLimit ?? 1) - (todayStats?.todayCompletedCount ?? 0)
              )}
            />

            {/* Deposit Bottom Sheet */}
            <DepositSheet
              isOpen={depositSheet.open}
              initialAmount={depositSheet.amount}
              targetTier={depositSheet.tier}
              onClose={() => setDepositSheet({ open: false, amount: null, tier: null })}
              onSuccess={handleTransactionCompleted}
              showToast={showToast}
            />

            {/* Withdraw Bottom Sheet */}
            <WithdrawSheet
              isOpen={withdrawOpen}
              user={user}
              platformConfig={activeConfig}
              onClose={() => setWithdrawOpen(false)}
              onOpenRecords={(tab = 'ledger') => setRecordsSheet({ open: true, tab })}
              onSuccess={handleTransactionCompleted}
              onUserUpdated={handleUserUpdated}
              showToast={showToast}
            />

            {/* Daily Statement & Full Financial Ledger Sheet */}
            <StatementLedgerSheet
              isOpen={recordsSheet.open}
              initialTab={recordsSheet.tab}
              onClose={() => setRecordsSheet((r) => ({ ...r, open: false }))}
              showToast={showToast}
            />

            {/* Official Corporate Documents & Charter Sheet */}
            <CorporateCharterSheet
              isOpen={charterSheet.open}
              initialSection={charterSheet.section}
              onClose={() => setCharterSheet((s) => ({ ...s, open: false }))}
              onGoToEarnings={() => {
                setEarningsSubTab('grades');
                setActiveTab('earnings');
              }}
            />

            {/* Red Envelope Cash Gift Code Sheet */}
            <RedEnvelopeSheet
              isOpen={redEnvelopeOpen}
              onClose={() => setRedEnvelopeOpen(false)}
              onUserUpdated={handleUserUpdated}
              showToast={showToast}
            />

            {/* Point Shop Sheet */}
            <PointShopSheet
              isOpen={pointShopOpen}
              user={user}
              onClose={() => setPointShopOpen(false)}
              onUserUpdated={handleUserUpdated}
              showToast={showToast}
            />

            {/* In-App Executive VIP Concierge Desk */}
            <ConciergeSheet
              isOpen={conciergeOpen}
              onClose={() => setConciergeOpen(false)}
              user={user}
              showToast={showToast}
            />

            {/* In-App Notifications Sheet */}
            <NotificationsSheet
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              onUserUpdated={handleUserUpdated}
              showToast={showToast}
            />

            {/* Invest with Arona Sheet */}
            <VaultSheet
              isOpen={vaultOpen}
              onClose={() => setVaultOpen(false)}
              user={user}
              onUserUpdated={handleUserUpdated}
              showToast={showToast}
            />

            {/* Deposit-Linked Lucky Wheel Sheet */}
            <LuckyWheelSheet
              isOpen={wheelOpen}
              onClose={() => setWheelOpen(false)}
              user={user}
              onUserUpdated={handleUserUpdated}
              onOpenDeposit={handleOpenDeposit}
              showToast={showToast}
            />

            {/* Admin Management Sheet (only for admin accounts) */}
            {user.isAdmin && (
              <AdminSheet
                isOpen={adminOpen}
                onClose={() => setAdminOpen(false)}
                showToast={showToast}
                onRefreshUser={fetchSession}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
