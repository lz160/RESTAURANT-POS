import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavView } from '../layout/AppSidebar';
import { ROLE_PRESETS, getRoleDefaultView } from '../../utils/rbac';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2, Lock, User } from 'lucide-react';

interface AccessDeniedViewProps {
  attemptedView: NavView;
  attemptedTab?: string;
  onNavigateHome: (view: NavView, tab?: any) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedView,
  attemptedTab,
  onNavigateHome,
}) => {
  const { currentStaffUser, logout } = useApp();

  const roleInfo = ROLE_PRESETS.find((r) => r.role === currentStaffUser.role) || ROLE_PRESETS[0];
  const defaultHome = getRoleDefaultView(currentStaffUser.role);

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-zinc-50/70 dark:bg-zinc-950 overflow-y-auto select-none">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono">
                403 FORBIDDEN
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                当前账号无权访问此页面
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              您当前登录的身份权限范围受限，无法进入所请求的管理或终端模块。
            </p>
          </div>
        </div>

        {/* Current Account Profile Info */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/70 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>当前登录账号信息</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-sm">
                {currentStaffUser.name.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {currentStaffUser.name}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  用户名: {currentStaffUser.username}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/50 dark:border-zinc-700">
                {roleInfo.roleName}
              </span>
            </div>
          </div>
        </div>

        {/* What this role can access */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>【{roleInfo.roleName}】允许访问的功能模块清单:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
            {roleInfo.accessiblePages.map((page, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigateHome(page.view, page.tab)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition text-left group"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                    {page.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{page.desc}</div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 rotate-180 shrink-0 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出登录 / 切换其他账号</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateHome(defaultHome.view, defaultHome.tab)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold shadow-2xs transition"
          >
            <span>返回该账号的工作台</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
