import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  IngredientProcurementRecord, 
  CollectivePurchasingPoolItem, 
  CollectiveProcurementSummary,
  InventoryCategory 
} from '../../types';
import {
  PackageCheck,
  TrendingDown,
  Coins,
  Layers,
  Building2,
  Store,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowUpDown,
  Sparkles,
  BarChart3,
  Percent,
  Calendar,
  Truck,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit3,
  Info,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const CollectiveProcurementCollector: React.FC = () => {
  const { stores, merchants, currentStaffUser, formatPrice, t } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'POOL' | 'RECORDS' | 'INGEST'>('POOL');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<CollectiveProcurementSummary | null>(null);
  const [poolItems, setPoolItems] = useState<CollectivePurchasingPoolItem[]>([]);
  const [records, setRecords] = useState<IngredientProcurementRecord[]>([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIngredientId, setExpandedIngredientId] = useState<string | null>(null);

  // Ingestion Simulator Modal / Form state
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    merchantId: merchants[0]?.id || 'merchant_danube',
    storeId: stores[0]?.id || 'store_paris_01',
    ingredientName: '',
    category: 'TEA' as InventoryCategory,
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 150,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 20.0,
    currency: 'EUR' as 'CZK' | 'EUR',
    supplierName: '欧洲本地食材贸易行',
    reportingSource: 'POS_RECIPE_DEDUCTION' as const,
  });

  // Export Manifest Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedPoolForExport, setSelectedPoolForExport] = useState<CollectivePurchasingPoolItem | null>(null);

  // Fetch Overview & Pool
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/collective-procurement/overview');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setPoolItems(data.poolItems);
      }
    } catch (err) {
      console.error('Failed to fetch procurement overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Raw Records
  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMerchant !== 'ALL') params.append('merchantId', selectedMerchant);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/collective-procurement/records?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to fetch procurement records:', err);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchRecords();
  }, [selectedMerchant, selectedCategory, searchQuery]);

  // Handle Ingest Submit
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestForm.ingredientName.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/admin/collective-procurement/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingestForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsIngestModalOpen(false);
        setIngestForm({
          merchantId: merchants[0]?.id || 'merchant_danube',
          storeId: stores[0]?.id || 'store_paris_01',
          ingredientName: '',
          category: 'TEA',
          categoryName: '茶底原叶',
          unit: 'kg',
          consumedQuantity: 150,
          consumedPeriod: '2026-08 (本月)',
          purchasePrice: 20.0,
          currency: 'EUR',
          supplierName: '欧洲本地食材贸易行',
          reportingSource: 'POS_RECIPE_DEDUCTION',
        });
        await fetchOverview();
        await fetchRecords();
      }
    } catch (err) {
      console.error('Failed to ingest telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('确定要删除该条食材消耗与进货价采集记录吗？')) return;
    try {
      const res = await fetch(`/api/admin/collective-procurement/records/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
        await fetchRecords();
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // Categories list
  const CATEGORIES_MAP: Record<string, { label: string; bg: string }> = {
    TEA: { label: '茶底原叶', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    DAIRY: { label: '乳品乳酪', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    MEAT: { label: '鲜肉肉饼', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    SNACK: { label: '烘焙面点', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    PACKAGING: { label: '包材耗材', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    SAUCE: { label: '糖浆调味', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    FRUIT: { label: '新鲜水果', bg: 'bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300 border-lime-200 dark:border-lime-800' },
  };

  // Filtered pool items
  const filteredPoolItems = useMemo(() => {
    return poolItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.ingredientName.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [poolItems, selectedCategory, searchQuery]);

  return (
    <div id="collective-procurement-hub" className="w-full h-full flex flex-col overflow-hidden bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* 1. Header & Purpose Banner */}
      <div className="flex-none p-6 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    食材消耗与采购价采集数据中枢
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    集采预留数据底座
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
                  专门采集全网各商家的食材消耗量与实际进货单价。通过全平台需求池聚合 (Demand Pooling) 测算集体采购降本空间，为后续上线厂家直采与集采分销预留核心数据支持。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchOverview();
                fetchRecords();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors shadow-sm"
              title="刷新全网采集数据"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新数据</span>
            </button>

            <button
              onClick={() => setIsIngestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>补录/模拟采集数据</span>
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
            {/* KPI 1 */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
                <span>已监控核心食材种类</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  {summary.totalMonitoredIngredients}
                </span>
                <span className="text-xs text-zinc-500">种高频大宗食材</span>
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-500" />
                <span>涵盖 {summary.totalParticipatingMerchants} 家跨国商家 · {summary.totalParticipatingStores} 间门店</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
                <span>全网月度食材采购总支出</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  €{summary.totalMonthlyConsumptionSpend.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500">/ 月度总耗</span>
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400">
                各商家现行分散自采累计成本
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <span>预估集体采购月度可节省</span>
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">
                  €{summary.totalEstimatedSavingsAmount.toLocaleString()}
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  降本 -{summary.avgSavingsPercentage}%
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                汇聚全网大宗订单后厂家直采预估降幅
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
                <span>集采最大差价食材</span>
                <Percent className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2">
                {summary.topHighSpreadIngredients[0] ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                      {summary.topHighSpreadIngredients[0].ingredientName}
                    </span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      差价浮动 {summary.topHighSpreadIngredients[0].priceSpreadPct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">数据计算中</span>
                )}
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400 truncate">
                中小商家被多层二道批发商加价最严重
              </div>
            </div>
          </div>
        )}

        {/* 3. Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 border-b border-zinc-200 dark:border-zinc-800 -mb-6 pb-0">
          <button
            onClick={() => setActiveSubTab('POOL')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'POOL'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>全网食材集采聚合池 ({poolItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('RECORDS')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'RECORDS'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>商家消耗与进货台账明细 ({records.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex-none px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium">品类:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">全食品类目 (ALL)</option>
              <option value="TEA">茶底原叶</option>
              <option value="DAIRY">乳品乳酪</option>
              <option value="MEAT">鲜肉肉饼</option>
              <option value="SNACK">烘焙面点</option>
              <option value="PACKAGING">包材耗材</option>
              <option value="SAUCE">糖浆调味</option>
            </select>
          </div>

          {/* Merchant Filter (for records tab) */}
          {activeSubTab === 'RECORDS' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 font-medium">商家:</span>
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">全部入驻商家</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索食材名、规格或供应商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-56"
            />
          </div>
        </div>

        <div className="text-xs text-zinc-400">
          {activeSubTab === 'POOL' ? (
            <span>聚合池食材: <strong className="text-zinc-700 dark:text-zinc-200">{filteredPoolItems.length}</strong> 种</span>
          ) : (
            <span>当前筛选记录: <strong className="text-zinc-700 dark:text-zinc-200">{records.length}</strong> 条</span>
          )}
        </div>
      </div>

      {/* 5. Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ======================================================== */}
        {/* TAB 1: 全网食材集采聚合池 (Collective Demand & Price Pool) */}
        {/* ======================================================== */}
        {activeSubTab === 'POOL' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Info className="w-4 h-4 text-amber-500" />
                <span>
                  点击任意食材可展开查看<strong>各商家的消耗数量分布与各自进货单价对比</strong>，直观发现高价差与集采直供利润空间。
                </span>
              </div>
            </div>

            <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                    <th className="py-3 px-4">监控食材与品类</th>
                    <th className="py-3 px-4">消耗商家 / 门店</th>
                    <th className="py-3 px-4 text-right">全网月度总消耗量</th>
                    <th className="py-3 px-4 text-right">当前平均进货单价</th>
                    <th className="py-3 px-4 text-right">商家进货高低差价</th>
                    <th className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400">预估集采批发价</th>
                    <th className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400">预计月度降本总额</th>
                    <th className="py-3 px-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {filteredPoolItems.map((item) => {
                    const isExpanded = expandedIngredientId === item.ingredientId;
                    const catBadge = CATEGORIES_MAP[item.category] || {
                      label: item.categoryName,
                      bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                    };

                    return (
                      <React.Fragment key={item.ingredientId}>
                        <tr
                          onClick={() => setExpandedIngredientId(isExpanded ? null : item.ingredientId)}
                          className={`cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                            isExpanded ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Name & Category */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                  {item.ingredientName}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${catBadge.bg}`}>
                                    {catBadge.label}
                                  </span>
                                  <span className="text-[11px] text-zinc-400">单位: {item.unit}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Participating */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{item.participatingMerchantsCount} 家商家</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              涉及 {item.participatingStoresCount} 家实体门店
                            </div>
                          </td>

                          {/* Total Volume */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm">
                              {item.totalConsumedVolume.toLocaleString()}
                            </span>
                            <span className="text-xs text-zinc-400 ml-1">{item.unit}</span>
                          </td>

                          {/* Avg Price */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              €{item.avgPurchasePrice.toFixed(3)}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              加权均价 / {item.unit}
                            </div>
                          </td>

                          {/* Price Spread */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="text-xs">
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">€{item.minPurchasePrice.toFixed(2)}</span>
                              <span className="text-zinc-400 mx-1">~</span>
                              <span className="text-rose-600 dark:text-rose-400 font-medium">€{item.maxPurchasePrice.toFixed(2)}</span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                差价浮动 {item.priceSpreadPct}%
                              </span>
                            </div>
                          </td>

                          {/* Target Group Buy Price */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                              €{item.targetGroupBuyPrice.toFixed(3)}
                            </div>
                            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                              降幅 -{item.projectedSavingsPct}%
                            </div>
                          </td>

                          {/* Projected Monthly Savings */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                              €{item.projectedMonthlySavings.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              全网月度省
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedPoolForExport(item);
                                setIsExportModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                            >
                              集采意向单
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Merchant Detail Drawer */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 bg-zinc-50/90 dark:bg-zinc-950/70 border-y border-zinc-200 dark:border-zinc-800">
                              <div className="p-4 pl-12 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    <Building2 className="w-4 h-4 text-amber-600" />
                                    <span>各商家当前独立采购数据透视 (共 {item.merchantBreakdown.length} 处采集点):</span>
                                  </div>
                                  <span className="text-[11px] text-zinc-400">
                                    按商家采购价降序排列，单价偏高者为集采核心受益方
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {item.merchantBreakdown.map((mb, idx) => {
                                    const isHighest = mb.purchasePrice === item.maxPurchasePrice;
                                    const isLowest = mb.purchasePrice === item.minPurchasePrice;
                                    const potentialSavingForMerchant = Number(((mb.purchasePrice - item.targetGroupBuyPrice) * mb.consumedVolume).toFixed(2));

                                    return (
                                      <div
                                        key={idx}
                                        className={`p-3.5 rounded-xl border ${
                                          isHighest
                                            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                                            : isLowest
                                            ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                                        } shadow-xs`}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                              {mb.merchantName}
                                            </div>
                                            {mb.storeName && (
                                              <div className="text-[11px] text-zinc-400 mt-0.5">
                                                {mb.storeName}
                                              </div>
                                            )}
                                          </div>
                                          {isHighest && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                              进价最高
                                            </span>
                                          )}
                                          {isLowest && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                              进价最低
                                            </span>
                                          )}
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <div className="text-[10px] text-zinc-400">消耗数量</div>
                                            <div className="font-bold text-zinc-800 dark:text-zinc-200">
                                              {mb.consumedVolume} {item.unit}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-[10px] text-zinc-400">当前进货单价</div>
                                            <div className="font-extrabold text-zinc-900 dark:text-zinc-50">
                                              €{mb.purchasePrice.toFixed(3)}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 text-[11px] text-zinc-400 truncate flex items-center gap-1">
                                          <Truck className="w-3 h-3 text-zinc-400" />
                                          <span>渠道: {mb.supplierName || '散装自采'}</span>
                                        </div>

                                        {potentialSavingForMerchant > 0 && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                                            <span>集采预计帮该商家月省:</span>
                                            <span className="font-bold">€{potentialSavingForMerchant.toLocaleString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: 商家消耗与进货台账明细 (Merchant Consumption Ledger) */}
        {/* ======================================================== */}
        {activeSubTab === 'RECORDS' && (
          <div className="space-y-4">
            <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                    <th className="py-3 px-4">食材名称与分类</th>
                    <th className="py-3 px-4">归属商家 / 门店</th>
                    <th className="py-3 px-4">统计周期消耗量</th>
                    <th className="py-3 px-4">当前进货采购单价</th>
                    <th className="py-3 px-4">供货商 / 采购渠道</th>
                    <th className="py-3 px-4">采集方式与时间</th>
                    <th className="py-3 px-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {records.map((rec) => {
                    const catBadge = CATEGORIES_MAP[rec.category] || {
                      label: rec.categoryName,
                      bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                    };

                    return (
                      <tr key={rec.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {rec.ingredientName}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${catBadge.bg}`}>
                              {catBadge.label}
                            </span>
                            <span className="text-[11px] text-zinc-400">单位: {rec.unit}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {rec.merchantName}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span>{rec.storeName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                            {rec.consumedQuantity.toLocaleString()} <span className="text-xs font-normal text-zinc-400">{rec.unit}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            周期: {rec.consumedPeriod}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm">
                            €{rec.purchasePrice.toFixed(3)}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            / {rec.unit} ({rec.currency})
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                            {rec.supplierName || '散装现货渠道'}
                          </div>
                          {rec.benchmarkMarketPrice && (
                            <div className="text-[11px] text-zinc-400">
                              行业基准价: €{rec.benchmarkMarketPrice.toFixed(2)}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>
                              {rec.reportingSource === 'POS_RECIPE_DEDUCTION'
                                ? 'POS销售配方自动扣减'
                                : rec.reportingSource === 'STORE_STOCKTAKE'
                                ? '门店出库台账'
                                : rec.reportingSource === 'SUPPLIER_INVOICE_SYNC'
                                ? '进货发票同步'
                                : '人工补录'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {new Date(rec.lastReportedAt).toLocaleDateString()} {new Date(rec.lastReportedAt).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="删除采集记录"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: 补录/模拟采集数据 (Ingest Telemetry Modal) */}
      {/* ======================================================== */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  补录 / 模拟商家食材消耗与进货价
                </h3>
              </div>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIngestSubmit} className="space-y-3.5 text-xs">
              {/* Select Merchant */}
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">归属商家账户</label>
                <select
                  value={ingestForm.merchantId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const mStores = stores.filter((s) => s.merchantId === mId);
                    setIngestForm({
                      ...ingestForm,
                      merchantId: mId,
                      storeId: mStores[0]?.id || stores[0]?.id || '',
                    });
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingredient Name & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">食材品名 *</label>
                  <input
                    type="text"
                    required
                    placeholder="如: 特级茉莉花茶原叶"
                    value={ingestForm.ingredientName}
                    onChange={(e) => setIngestForm({ ...ingestForm, ingredientName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">品类</label>
                  <select
                    value={ingestForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as InventoryCategory;
                      const catName = CATEGORIES_MAP[cat]?.label || '其他品类';
                      setIngestForm({ ...ingestForm, category: cat, categoryName: catName });
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="TEA">茶底原叶</option>
                    <option value="DAIRY">乳品乳酪</option>
                    <option value="MEAT">鲜肉肉饼</option>
                    <option value="SNACK">烘焙面点</option>
                    <option value="PACKAGING">包材耗材</option>
                    <option value="SAUCE">糖浆调味</option>
                    <option value="FRUIT">新鲜水果</option>
                  </select>
                </div>
              </div>

              {/* Consumption Qty & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">消耗数量 (月度) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={ingestForm.consumedQuantity}
                    onChange={(e) => setIngestForm({ ...ingestForm, consumedQuantity: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">计量单位</label>
                  <input
                    type="text"
                    value={ingestForm.unit}
                    onChange={(e) => setIngestForm({ ...ingestForm, unit: e.target.value })}
                    placeholder="kg / L / 块 / 个 / 根"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Purchase Price & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">进货采购单价 (€) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.001"
                    required
                    value={ingestForm.purchasePrice}
                    onChange={(e) => setIngestForm({ ...ingestForm, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">当前供应商/渠道</label>
                  <input
                    type="text"
                    value={ingestForm.supplierName}
                    onChange={(e) => setIngestForm({ ...ingestForm, supplierName: e.target.value })}
                    placeholder="如: 法国当地食材批发行"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Reporting Source */}
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">采集来源渠道</label>
                <select
                  value={ingestForm.reportingSource}
                  onChange={(e) => setIngestForm({ ...ingestForm, reportingSource: e.target.value as any })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="POS_RECIPE_DEDUCTION">POS 点餐配方自动核销扣减 (实时)</option>
                  <option value="STORE_STOCKTAKE">门店定期库存盘点台账</option>
                  <option value="SUPPLIER_INVOICE_SYNC">供货商发票进货单同步</option>
                  <option value="MANUAL_TELEMETRY">管理中心人工补录</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsIngestModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
                >
                  {loading ? '正在同步采集...' : '确认采集入库'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: 集采招商需求意向单 (Export Group-Buy RFP) */}
      {/* ======================================================== */}
      {isExportModalOpen && selectedPoolForExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  集体采购意向单 · 厂家直供需求池
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">采购标的食材:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{selectedPoolForExport.ingredientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">全网聚合月度采购量:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">{selectedPoolForExport.totalConsumedVolume.toLocaleString()} {selectedPoolForExport.unit} / 月</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">现行各商家采购均价:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">€{selectedPoolForExport.avgPurchasePrice.toFixed(3)} / {selectedPoolForExport.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">厂家集采直供协议目标价:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">€{selectedPoolForExport.targetGroupBuyPrice.toFixed(3)} / {selectedPoolForExport.unit} (降幅 -{selectedPoolForExport.projectedSavingsPct}%)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-400">预计全网月度集体节省:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">€{selectedPoolForExport.projectedMonthlySavings.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <div className="font-semibold mb-1">参与意向采购商家名单:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                {selectedPoolForExport.merchantBreakdown.map((m, i) => (
                  <li key={i}>
                    {m.merchantName} ({m.consumedVolume} {selectedPoolForExport.unit}, 当前进价 €{m.purchasePrice.toFixed(3)})
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                完成预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
