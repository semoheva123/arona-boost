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
      <div className="w-full max-w-[430px] bg-white border-t border-slate-200/80 px-2 py-1.5 pointer-events-auto shadow-[0_-4px_18px_rgba(7,24,43,0.05)]">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className="relative flex flex-col items-center justify-center gap-1 py-1.5 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Icon
                    className={`w-[21px] h-[21px] transition-colors ${
                      isActive
                        ? 'stroke-[2.4] text-[#0D7A72]'
                        : 'stroke-[1.9] text-[#8FA2B7]'
                    }`}
                  />
                  {item.id === 'tasks' && remainingTasks > 0 && (
                    <span className="ltr-num tabular-nums absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                      {remainingTasks}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold leading-none ${
                    isActive ? 'text-[#07182B]' : 'text-[#8FA2B7]'
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
