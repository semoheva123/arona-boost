import React from 'react';
import { Home, TrendingUp, Compass, Users, User } from 'lucide-react';
import { useI18n } from '../i18n';

const NAV_ITEMS = [
  { id: 'home', key: 'nav_home', fallback: 'الرئيسية', icon: Home },
  { id: 'earnings', key: 'nav_earnings', fallback: 'الأرباح', icon: TrendingUp },
  { id: 'tasks', key: 'nav_tasks', fallback: 'السفر', icon: Compass },
  { id: 'team', key: 'nav_team', fallback: 'الفريق', icon: Users },
  { id: 'account', key: 'nav_account', fallback: 'حسابي', icon: User }
];

export default function BottomNav({ activeTab, onSelectTab, remainingTasks = 0 }) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] bg-white/96 backdrop-blur-xl border-t border-slate-200/90 px-2.5 py-2 pointer-events-auto shadow-[0_-12px_34px_rgba(6,21,39,0.10)] relative">
        <div
          className="pointer-events-none absolute top-0 inset-x-8 h-[1px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(215,165,59,0.45) 50%, transparent 100%)'
          }}
        />
        <div className="grid grid-cols-5 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#07182B] text-white shadow-[0_8px_18px_-4px_rgba(7,24,43,0.34)]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/75'
                }`}
              >
                {isActive && (
                  <span className="absolute top-1 w-4 h-[2px] rounded-full bg-[#F5D076]" />
                )}
                <div className="relative">
                  <Icon
                    className={`w-[19px] h-[19px] transition-transform ${
                      isActive
                        ? 'scale-105 stroke-[2.25] text-[#F5D076]'
                        : 'stroke-[1.9]'
                    }`}
                  />
                  {item.id === 'tasks' && remainingTasks > 0 && (
                    <span className="ltr-num tabular-nums absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0D7A72] text-white text-[9px] font-extrabold flex items-center justify-center shadow-2xs ring-2 ring-white">
                      {remainingTasks}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10.5px] font-extrabold leading-none ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {t(item.key, item.fallback)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
