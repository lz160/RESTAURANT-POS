import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MerchantAccount, SaaSPlanType, SAAS_PLANS, getSaaSPlanInfo } from '../../types';
import {
  Building2,
  ArrowLeft,
  Save,
  CheckCircle2,
  Scale,
  MapPin,
  Mail,
  Phone,
  Globe,
  Award,
  ShieldCheck,
  FileCheck2,
  Layers,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface MerchantContractEditViewProps {
  merchantId: string | null; // null for creating a new merchant account
  onBack: () => void;
  onSaved: (merchant: MerchantAccount) => void;
}

export const MerchantContractEditView: React.FC<MerchantContractEditViewProps> = ({
  merchantId,
  onBack,
  onSaved,
}) => {
  const { merchants, stores, createMerchantAccount, updateMerchantAccount } = useApp();

  const isEditing = Boolean(merchantId);
  const existingMerchant = merchants.find((m) => m.id === merchantId);

  const [formData, setFormData] = useState({
    name: existingMerchant?.name || '',
    legalCompanyName: existingMerchant?.legalCompanyName || '',
    ico: existingMerchant?.ico || '',
    dic: existingMerchant?.dic || '',
    registeredAddress: existingMerchant?.registeredAddress || '',
    courtRegistry: existingMerchant?.courtRegistry || '',
    contactPerson: existingMerchant?.contactPerson || '',
    email: existingMerchant?.email || '',
    phone: existingMerchant?.phone || '',
    customDomain: existingMerchant?.customDomain || '',
    plan: (existingMerchant?.plan as SaaSPlanType) || 'SINGLE',
    status: (existingMerchant?.status as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE',
    notes: existingMerchant?.notes || '',
    assignedStoreIds: existingMerchant?.assignedStoreIds ? [...existingMerchant.assignedStoreIds] : [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'BASE' | 'LEGAL' | 'PLAN'>('BASE');

  const assignedStores = stores.filter(
    (s) => formData.assignedStoreIds.includes(s.id) || s.merchantId === existingMerchant?.id
  );

  const planInfo = getSaaSPlanInfo(formData.plan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请填写集团/品牌名称');
      return;
    }
    if (!formData.legalCompanyName.trim()) {
      alert('请填写法定企业全称 (Legal Entity Name)');
      return;
    }
    if (!formData.contactPerson.trim()) {
      alert('请填写主要联系人');
      return;
    }
    if (!formData.email.trim()) {
      alert('请填写登录与通知邮箱');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && merchantId) {
        const updated = await updateMerchantAccount(merchantId, formData);
        setSaveSuccess(true);
        setTimeout(() => {
          onSaved(updated);
        }, 600);
      } else {
        const created = await createMerchantAccount(formData);
        setSaveSuccess(true);
        setTimeout(() => {
          onSaved(created);
        }, 600);
      }
    } catch (err: any) {
      alert(err.message || '保存签约资料失败');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50/70 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回商家列表</span>
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isEditing ? `编辑商家集团签约 · ${formData.name || '未命名'}` : '新增商家账户签约'}
                </h2>
                {isEditing && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      formData.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{formData.status === 'ACTIVE' ? '已激活' : '已停用'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                独立页面表单 · 登记企业法定资质、财税 IČO/DIČ、SaaS 订阅版本及配额管理
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-98 ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>保存成功，正在返回...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '正在提交...' : '保存签约信息'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('BASE')}
          className={`py-2.5 font-bold border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'BASE'
              ? 'border-amber-500 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>基础资料与联系人</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEGAL')}
          className={`py-2.5 font-bold border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'LEGAL'
              ? 'border-amber-500 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>法定企业主体 & 税控资质</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PLAN')}
          className={`py-2.5 font-bold border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'PLAN'
              ? 'border-amber-500 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>SaaS 方案与配额状态</span>
        </button>
      </div>

      {/* Form Content Body */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-5xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* TAB 1: Base Info */}
          {activeTab === 'BASE' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">商家集团与品牌标识</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      集团/品牌对外名称 (Brand Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如: 多瑙国际餐饮集团 / Danube Dining Group"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      用于在后台与前台点餐页面统一展示的集团或品牌商号
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      专属独立前端域名 (Custom Domain / 可选)
                    </label>
                    <input
                      type="text"
                      value={formData.customDomain}
                      onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                      placeholder="例如: order.danubefoods.eu"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      如配置了自定义 CNAME 域名，该商户旗下点餐端将自动适配此域名
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacts Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">主要联系人与认证信息</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      主要联系人姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="例如: 王浩 (总经理)"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      联系与主账号邮箱 (Email) *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="merchant@danubefoods.eu"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      联系电话 (Phone)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+420 777 123 456"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    签约内部备忘录 / 特殊服务条款 (Notes)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="例如: 客户约定提供专属 API 对接支持，合同按年预付..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Legal & Fiscal Info */}
          {activeTab === 'LEGAL' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">欧洲财税法务实体</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      法定企业注册全称 (Legal Entity Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.legalCompanyName}
                      onChange={(e) => setFormData({ ...formData, legalCompanyName: e.target.value })}
                      placeholder="例如: Danube Hospitality Europe s.r.o."
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      须与商事登记法院 (Commercial Court) 登记的营业执照名称完全一致
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      统一企业工商登记号 (IČO / Company Reg. No.)
                    </label>
                    <input
                      type="text"
                      value={formData.ico}
                      onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                      placeholder="例如: 29482019"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      增值税税号 (DIČ / VAT ID)
                    </label>
                    <input
                      type="text"
                      value={formData.dic}
                      onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                      placeholder="例如: CZ29482019"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      法定注册地址 (Registered Legal Seat)
                    </label>
                    <input
                      type="text"
                      value={formData.registeredAddress}
                      onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                      placeholder="例如: Václavské náměstí 846/1, 110 00 Praha 1, Česká republika"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      商业法院登记卷号 (Court Registry & File No.)
                    </label>
                    <input
                      type="text"
                      value={formData.courtRegistry}
                      onChange={(e) => setFormData({ ...formData, courtRegistry: e.target.value })}
                      placeholder="例如: Spisová značka: C 19382 vedená u Městského soudu v Praze"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong>财税合规声明：</strong>
                    依据欧盟与捷克商业法（Obchodní rejstřík）及 EET 2.0 国家税控法案，在此登记的企业法务资料将在旗下各门店打印正式发票收据（Účtenka）时作为母公司主体备案。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SaaS Plan & Allocation */}
          {activeTab === 'PLAN' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">SaaS 版本选择与门店配额</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {(['SINGLE', 'CHAIN', 'FLAGSHIP'] as const).map((planCode) => {
                    const p = SAAS_PLANS[planCode];
                    const isSelected = formData.plan === p.code || (formData.plan === 'STANDARD' && p.code === 'SINGLE') || (formData.plan === 'PRO' && p.code === 'CHAIN') || (formData.plan === 'ENTERPRISE' && p.code === 'FLAGSHIP');
                    return (
                      <div
                        key={p.code}
                        onClick={() => setFormData({ ...formData, plan: p.code })}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-850/40'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.tagClass}`}>
                              {p.badge}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">{p.name}</h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400">允许开通门店：</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                            {p.maxStores === Infinity ? '无上限 (∞)' : `最多 ${p.maxStores} 家`}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      账户激活状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                    >
                      <option value="ACTIVE">正常激活 (ACTIVE) - 旗下门店正常对外营业与点餐</option>
                      <option value="SUSPENDED">暂停/停用 (SUSPENDED) - 旗下门店全部暂停新业务</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      当前已分配门店实体
                    </label>
                    <div className="px-3.5 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        当前包含 {assignedStores.length} 家门店实体
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        配额上限：{planInfo.maxStores === Infinity ? '无限制' : `${planInfo.maxStores} 家`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition"
            >
              取消并返回
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold transition active:scale-98 shadow-xs flex items-center gap-2 ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已保存，正在返回...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? '保存中...' : '保存签约信息'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
