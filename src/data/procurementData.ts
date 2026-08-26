import { IngredientProcurementRecord, CollectivePurchasingPoolItem, CollectiveProcurementSummary } from '../types';

export const INITIAL_PROCUREMENT_RECORDS: IngredientProcurementRecord[] = [
  // 1. 茉莉银毫特级茶原叶 (TEA)
  {
    id: 'rec_tea_01',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_jasmine_tea',
    ingredientName: '特级茉莉银毫茶原叶 (高山初采)',
    category: 'TEA',
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 240,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 22.5,
    currency: 'EUR',
    supplierName: '法国欧华进出口食材行 (Paris Dist.)',
    benchmarkMarketPrice: 24.0,
    lastReportedAt: Date.now() - 3600000 * 4,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_tea_02',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_prague_01',
    storeName: '布拉格老城查理大桥体验店',
    ingredientId: 'ing_jasmine_tea',
    ingredientName: '特级茉莉银毫茶原叶 (高山初采)',
    category: 'TEA',
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 185,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 21.8,
    currency: 'EUR',
    supplierName: '中欧亚超供应链集团 (Prague Hub)',
    benchmarkMarketPrice: 24.0,
    lastReportedAt: Date.now() - 3600000 * 6,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_tea_03',
    merchantId: 'merchant_oriental',
    merchantName: '东方茶舍连锁 (Oriental Tea House)',
    storeId: 'store_tokyo_01',
    storeName: '东京银座手作工坊',
    ingredientId: 'ing_jasmine_tea',
    ingredientName: '特级茉莉银毫茶原叶 (高山初采)',
    category: 'TEA',
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 310,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 25.0,
    currency: 'EUR',
    supplierName: '当地第三方现货二道茶商',
    benchmarkMarketPrice: 24.0,
    lastReportedAt: Date.now() - 3600000 * 2,
    reportingSource: 'STORE_STOCKTAKE',
  },
  {
    id: 'rec_tea_04',
    merchantId: 'merchant_sakura',
    merchantName: '樱花日料连锁工坊 (Sakura Ramen)',
    storeId: 'store_vienna_01',
    storeName: '维也纳金色大厅店',
    ingredientId: 'ing_jasmine_tea',
    ingredientName: '特级茉莉银毫茶原叶 (高山初采)',
    category: 'TEA',
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 95,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 26.5,
    currency: 'EUR',
    supplierName: '奥地利本地散装零售商',
    benchmarkMarketPrice: 24.0,
    lastReportedAt: Date.now() - 3600000 * 12,
    reportingSource: 'SUPPLIER_INVOICE_SYNC',
  },

  // 2. 欧标巴氏低温杀菌纯鲜奶 (DAIRY)
  {
    id: 'rec_milk_01',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_fresh_milk',
    ingredientName: '欧标巴氏冷藏纯鲜牛乳 (3.8%乳脂)',
    category: 'DAIRY',
    categoryName: '乳品乳酪',
    unit: 'L',
    consumedQuantity: 1450,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 1.35,
    currency: 'EUR',
    supplierName: 'Lactalis 欧洲奶业冷链直供',
    benchmarkMarketPrice: 1.45,
    lastReportedAt: Date.now() - 3600000 * 3,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_milk_02',
    merchantId: 'merchant_alps',
    merchantName: '阿尔卑斯烘焙咖啡 (Alps Bakery & Coffee)',
    storeId: 'store_zurich_01',
    storeName: '苏黎世班霍夫大街旗舰店',
    ingredientId: 'ing_fresh_milk',
    ingredientName: '欧标巴氏冷藏纯鲜牛乳 (3.8%乳脂)',
    category: 'DAIRY',
    categoryName: '乳品乳酪',
    unit: 'L',
    consumedQuantity: 1820,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 1.55,
    currency: 'EUR',
    supplierName: '瑞士高山牧场独立奶源配送',
    benchmarkMarketPrice: 1.45,
    lastReportedAt: Date.now() - 3600000 * 5,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_milk_03',
    merchantId: 'merchant_oriental',
    merchantName: '东方茶舍连锁 (Oriental Tea House)',
    storeId: 'store_tokyo_01',
    storeName: '东京银座手作工坊',
    ingredientId: 'ing_fresh_milk',
    ingredientName: '欧标巴氏冷藏纯鲜牛乳 (3.8%乳脂)',
    category: 'DAIRY',
    categoryName: '乳品乳酪',
    unit: 'L',
    consumedQuantity: 1100,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 1.48,
    currency: 'EUR',
    supplierName: '区域经销商二道批发',
    benchmarkMarketPrice: 1.45,
    lastReportedAt: Date.now() - 3600000 * 1,
    reportingSource: 'STORE_STOCKTAKE',
  },

  // 3. 安格斯原切冷鲜牛肉排 (MEAT)
  {
    id: 'rec_beef_01',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_angus_beef',
    ingredientName: '安格斯原切冷鲜汉堡牛肉排 (150g)',
    category: 'MEAT',
    categoryName: '鲜肉肉饼',
    unit: '块',
    consumedQuantity: 2800,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 1.95,
    currency: 'EUR',
    supplierName: '爱尔兰牛业直供',
    benchmarkMarketPrice: 2.15,
    lastReportedAt: Date.now() - 3600000 * 2,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_beef_02',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_berlin_01',
    storeName: '柏林米特区科技工坊店',
    ingredientId: 'ing_angus_beef',
    ingredientName: '安格斯原切冷鲜汉堡牛肉排 (150g)',
    category: 'MEAT',
    categoryName: '鲜肉肉饼',
    unit: '块',
    consumedQuantity: 1950,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 2.10,
    currency: 'EUR',
    supplierName: '德东生鲜肉类批发行',
    benchmarkMarketPrice: 2.15,
    lastReportedAt: Date.now() - 3600000 * 7,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_beef_03',
    merchantId: 'merchant_sakura',
    merchantName: '樱花日料连锁工坊 (Sakura Ramen)',
    storeId: 'store_munich_01',
    storeName: '慕尼黑玛利亚广场店',
    ingredientId: 'ing_angus_beef',
    ingredientName: '安格斯原切冷鲜汉堡牛肉排 (150g)',
    category: 'MEAT',
    categoryName: '鲜肉肉饼',
    unit: '块',
    consumedQuantity: 850,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 2.35,
    currency: 'EUR',
    supplierName: '巴伐利亚本地小批量分销商',
    benchmarkMarketPrice: 2.15,
    lastReportedAt: Date.now() - 3600000 * 9,
    reportingSource: 'SUPPLIER_INVOICE_SYNC',
  },

  // 4. 食品级磨砂高透冷饮杯 700ml (PACKAGING)
  {
    id: 'rec_cup_01',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_cup_700ml',
    ingredientName: '加厚磨砂高透冷饮注塑杯 (700ml带盖)',
    category: 'PACKAGING',
    categoryName: '包材耗材',
    unit: '个',
    consumedQuantity: 8500,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.16,
    currency: 'EUR',
    supplierName: '欧洲环保包材集中仓',
    benchmarkMarketPrice: 0.18,
    lastReportedAt: Date.now() - 3600000 * 1,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_cup_02',
    merchantId: 'merchant_oriental',
    merchantName: '东方茶舍连锁 (Oriental Tea House)',
    storeId: 'store_tokyo_01',
    storeName: '东京银座手作工坊',
    ingredientId: 'ing_cup_700ml',
    ingredientName: '加厚磨砂高透冷饮注塑杯 (700ml带盖)',
    category: 'PACKAGING',
    categoryName: '包材耗材',
    unit: '个',
    consumedQuantity: 6200,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.19,
    currency: 'EUR',
    supplierName: '本地塑料包材小代理商',
    benchmarkMarketPrice: 0.18,
    lastReportedAt: Date.now() - 3600000 * 4,
    reportingSource: 'STORE_STOCKTAKE',
  },
  {
    id: 'rec_cup_03',
    merchantId: 'merchant_alps',
    merchantName: '阿尔卑斯烘焙咖啡 (Alps Bakery & Coffee)',
    storeId: 'store_geneva_01',
    storeName: '日内瓦罗纳街店',
    ingredientId: 'ing_cup_700ml',
    ingredientName: '加厚磨砂高透冷饮注塑杯 (700ml带盖)',
    category: 'PACKAGING',
    categoryName: '包材耗材',
    unit: '个',
    consumedQuantity: 4100,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.21,
    currency: 'EUR',
    supplierName: '日内瓦本地现货批发行',
    benchmarkMarketPrice: 0.18,
    lastReportedAt: Date.now() - 3600000 * 8,
    reportingSource: 'SUPPLIER_INVOICE_SYNC',
  },

  // 5. PLA可降解独立纸包粗吸管 (PACKAGING)
  {
    id: 'rec_straw_01',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_pla_straw',
    ingredientName: 'PLA环保全生物降解斜口粗吸管 (独立纸包)',
    category: 'PACKAGING',
    categoryName: '包材耗材',
    unit: '根',
    consumedQuantity: 12000,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.032,
    currency: 'EUR',
    supplierName: '中欧环保包材直运',
    benchmarkMarketPrice: 0.038,
    lastReportedAt: Date.now() - 3600000 * 1,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_straw_02',
    merchantId: 'merchant_oriental',
    merchantName: '东方茶舍连锁 (Oriental Tea House)',
    storeId: 'store_tokyo_01',
    storeName: '东京银座手作工坊',
    ingredientId: 'ing_pla_straw',
    ingredientName: 'PLA环保全生物降解斜口粗吸管 (独立纸包)',
    category: 'PACKAGING',
    categoryName: '包材耗材',
    unit: '根',
    consumedQuantity: 8900,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.041,
    currency: 'EUR',
    supplierName: '中间贸易商零散订购',
    benchmarkMarketPrice: 0.038,
    lastReportedAt: Date.now() - 3600000 * 3,
    reportingSource: 'STORE_STOCKTAKE',
  },

  // 6. 手工黄油布里欧修汉堡胚 (SNACK)
  {
    id: 'rec_bun_01',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_brioche_bun',
    ingredientName: '法式黄油布里欧修汉堡胚 (手工烘焙)',
    category: 'SNACK',
    categoryName: '烘焙面点',
    unit: '个',
    consumedQuantity: 3100,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.68,
    currency: 'EUR',
    supplierName: '巴黎本地中央烘焙工坊',
    benchmarkMarketPrice: 0.75,
    lastReportedAt: Date.now() - 3600000 * 2,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_bun_02',
    merchantId: 'merchant_alps',
    merchantName: '阿尔卑斯烘焙咖啡 (Alps Bakery & Coffee)',
    storeId: 'store_zurich_01',
    storeName: '苏黎世班霍夫大街旗舰店',
    ingredientId: 'ing_brioche_bun',
    ingredientName: '法式黄油布里欧修汉堡胚 (手工烘焙)',
    category: 'SNACK',
    categoryName: '烘焙面点',
    unit: '个',
    consumedQuantity: 2400,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 0.72,
    currency: 'EUR',
    supplierName: '苏黎世自营中央厨房',
    benchmarkMarketPrice: 0.75,
    lastReportedAt: Date.now() - 3600000 * 5,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },

  // 7. 单一产区精品水洗阿拉比卡咖啡豆 (TEA)
  {
    id: 'rec_coffee_01',
    merchantId: 'merchant_alps',
    merchantName: '阿尔卑斯烘焙咖啡 (Alps Bakery & Coffee)',
    storeId: 'store_zurich_01',
    storeName: '苏黎世班霍夫大街旗舰店',
    ingredientId: 'ing_coffee_beans',
    ingredientName: '埃塞俄比亚耶加雪菲精品咖啡原豆 (浅中烘)',
    category: 'TEA',
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 210,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 24.5,
    currency: 'EUR',
    supplierName: '瑞士精品生豆直采贸易行',
    benchmarkMarketPrice: 28.0,
    lastReportedAt: Date.now() - 3600000 * 1,
    reportingSource: 'POS_RECIPE_DEDUCTION',
  },
  {
    id: 'rec_coffee_02',
    merchantId: 'merchant_danube',
    merchantName: '多瑙国际餐饮集团 (Danube F&B)',
    storeId: 'store_paris_01',
    storeName: '巴黎香榭丽舍旗舰店',
    ingredientId: 'ing_coffee_beans',
    ingredientName: '埃塞俄比亚耶加雪菲精品咖啡原豆 (浅中烘)',
    category: 'TEA',
    categoryName: '茶底原叶',
    unit: 'kg',
    consumedQuantity: 140,
    consumedPeriod: '2026-08 (本月)',
    purchasePrice: 29.0,
    currency: 'EUR',
    supplierName: '巴黎中介咖啡豆商 (小批量订购)',
    benchmarkMarketPrice: 28.0,
    lastReportedAt: Date.now() - 3600000 * 4,
    reportingSource: 'STORE_STOCKTAKE',
  },
];

// Helper to calculate aggregate Collective Purchasing Pools from raw records
export function calculateCollectivePurchasingPool(records: IngredientProcurementRecord[]): {
  poolItems: CollectivePurchasingPoolItem[];
  summary: CollectiveProcurementSummary;
} {
  const mapByIngredient = new Map<string, {
    ingredientId: string;
    ingredientName: string;
    category: any;
    categoryName: string;
    unit: string;
    currency: any;
    records: IngredientProcurementRecord[];
  }>();

  records.forEach(rec => {
    if (!mapByIngredient.has(rec.ingredientId)) {
      mapByIngredient.set(rec.ingredientId, {
        ingredientId: rec.ingredientId,
        ingredientName: rec.ingredientName,
        category: rec.category,
        categoryName: rec.categoryName,
        unit: rec.unit,
        currency: rec.currency,
        records: [],
      });
    }
    mapByIngredient.get(rec.ingredientId)!.records.push(rec);
  });

  const poolItems: CollectivePurchasingPoolItem[] = [];
  let totalSpend = 0;
  let totalProjectedSavings = 0;

  mapByIngredient.forEach((group) => {
    const recs = group.records;
    const merchantsSet = new Set(recs.map(r => r.merchantId));
    const storesSet = new Set(recs.map(r => r.storeId));
    const totalVolume = recs.reduce((sum, r) => sum + r.consumedQuantity, 0);

    // Weighted average purchase price
    const totalCost = recs.reduce((sum, r) => sum + (r.consumedQuantity * r.purchasePrice), 0);
    const avgPrice = totalVolume > 0 ? Number((totalCost / totalVolume).toFixed(3)) : 0;

    const prices = recs.map(r => r.purchasePrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const spreadPct = minPrice > 0 ? Number((((maxPrice - minPrice) / minPrice) * 100).toFixed(1)) : 0;

    // Projected bulk factory direct purchase price (estimate 15%~25% lower than current minimum or weighted avg)
    const targetGroupBuyPrice = Number((minPrice * 0.85).toFixed(3));
    const savingsPct = avgPrice > 0 ? Number((((avgPrice - targetGroupBuyPrice) / avgPrice) * 100).toFixed(1)) : 15;
    const monthlySavings = Number(((avgPrice - targetGroupBuyPrice) * totalVolume).toFixed(2));

    totalSpend += totalCost;
    totalProjectedSavings += monthlySavings;

    poolItems.push({
      ingredientId: group.ingredientId,
      ingredientName: group.ingredientName,
      category: group.category,
      categoryName: group.categoryName,
      unit: group.unit,
      currency: group.currency,
      participatingMerchantsCount: merchantsSet.size,
      participatingStoresCount: storesSet.size,
      totalConsumedVolume: totalVolume,
      avgPurchasePrice: avgPrice,
      minPurchasePrice: minPrice,
      maxPurchasePrice: maxPrice,
      priceSpreadPct: spreadPct,
      targetGroupBuyPrice,
      projectedSavingsPct: savingsPct,
      projectedMonthlySavings: monthlySavings,
      merchantBreakdown: recs.map(r => ({
        merchantId: r.merchantId,
        merchantName: r.merchantName,
        storeId: r.storeId,
        storeName: r.storeName,
        consumedVolume: r.consumedQuantity,
        purchasePrice: r.purchasePrice,
        supplierName: r.supplierName,
        reportingSource: r.reportingSource,
        lastReportedAt: r.lastReportedAt,
      })),
    });
  });

  // Sort pool items by total potential savings descending
  poolItems.sort((a, b) => b.projectedMonthlySavings - a.projectedMonthlySavings);

  const allMerchants = new Set(records.map(r => r.merchantId));
  const allStores = new Set(records.map(r => r.storeId));

  const summary: CollectiveProcurementSummary = {
    totalMonitoredIngredients: poolItems.length,
    totalParticipatingMerchants: allMerchants.size,
    totalParticipatingStores: allStores.size,
    totalMonthlyConsumptionSpend: Number(totalSpend.toFixed(2)),
    totalEstimatedSavingsAmount: Number(totalProjectedSavings.toFixed(2)),
    avgSavingsPercentage: totalSpend > 0 ? Number(((totalProjectedSavings / totalSpend) * 100).toFixed(1)) : 18.2,
    topHighSpreadIngredients: poolItems.slice(0, 3),
  };

  return { poolItems, summary };
}
