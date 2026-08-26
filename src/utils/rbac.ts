import { StaffRole, StaffUser, MerchantAccount, StoreEntity } from '../types';
import { NavView } from '../components/layout/AppSidebar';
import { AdminTab } from '../components/admin/SaaSAdminDashboard';

/**
 * 角色权限权重层级 (数字越大权限级别越高)
 * 规则：账户管理只能查看管理同一分支中更低权限的账户 (Operator Level > Target Level)
 */
export const ROLE_HIERARCHY_LEVELS: Record<StaffRole, number> = {
  SUPER_ADMIN: 100,  // 平台超级管理员 (全球云运营中枢)
  MERCHANT: 80,      // 连锁品牌主 (多店中台)
  STORE_MANAGER: 60, // 门店店长 (单店运营核心)
  CHEF: 20,          // 后厨主厨 (后厨出餐工位)
  CASHIER: 20,       // 前台收银员 (吧台收银点单)
  EXPO_PACKER: 20,   // 总控打包叫号员 (前厅打包调度)
};

/**
 * 获取角色权限等级 (0-100)
 */
export const getRoleLevel = (role: StaffRole): number => {
  return ROLE_HIERARCHY_LEVELS[role] ?? 0;
};

/**
 * 获取角色权限等级中文标签
 */
export const getRoleLevelTag = (role: StaffRole): string => {
  const level = getRoleLevel(role);
  if (level >= 100) return '等级 100 · 平台超管';
  if (level >= 80) return '等级 80 · 品牌主';
  if (level >= 60) return '等级 60 · 门店店长';
  return '等级 20 · 门店员工';
};

/**
 * 校验目标角色是否严格低于当前操作者权限等级
 */
export const isSubordinateRole = (operatorRole: StaffRole, targetRole: StaffRole): boolean => {
  return getRoleLevel(operatorRole) > getRoleLevel(targetRole);
};

/**
 * 校验是否属于同一企业分支 / 门店组织架构
 */
export const isSameBranch = (
  operator: StaffUser,
  target: StaffUser,
  merchants: MerchantAccount[] = [],
  stores: StoreEntity[] = []
): boolean => {
  // 1. 超管拥有全平台管理权限 (属于全局分支最高节点)
  if (operator.role === 'SUPER_ADMIN') {
    return true;
  }

  // 2. 品牌主 (MERCHANT)：限定在当前商户品牌分支旗下
  if (operator.role === 'MERCHANT') {
    // 目标账号不能是超管或其他品牌的商户
    if (target.role === 'SUPER_ADMIN') return false;

    // 匹配商户ID
    if (operator.merchantId && target.merchantId && operator.merchantId === target.merchantId) {
      return true;
    }
    // 匹配品牌代号 (brandCode)
    if (operator.brandCode && target.brandCode && operator.brandCode.toLowerCase() === target.brandCode.toLowerCase()) {
      return true;
    }
    // 匹配商户名下门店
    const operatorMerchant = merchants.find(m => m.id === operator.merchantId || m.brandCode === operator.brandCode);
    if (operatorMerchant && operatorMerchant.assignedStoreIds && target.storeId) {
      if (operatorMerchant.assignedStoreIds.includes(target.storeId)) {
        return true;
      }
    }
    // 匹配stores中归属于该商户的门店
    if (operator.merchantId && target.storeId) {
      const targetStoreObj = stores.find(s => s.id === target.storeId);
      if (targetStoreObj && targetStoreObj.merchantId === operator.merchantId) {
        return true;
      }
    }
    return false;
  }

  // 3. 门店店长 (STORE_MANAGER)：限定在当前店长所管辖的门店与品牌分支旗下
  if (operator.role === 'STORE_MANAGER') {
    // 目标必须同属一个品牌
    if (operator.merchantId && target.merchantId && operator.merchantId !== target.merchantId) {
      return false;
    }
    if (operator.brandCode && target.brandCode && operator.brandCode.toLowerCase() !== target.brandCode.toLowerCase()) {
      return false;
    }

    // 门店比对：目标门店必须在店长的管辖门店列表中
    const managerStoreIds = new Set<string>();
    if (operator.storeId) managerStoreIds.add(operator.storeId);
    if (Array.isArray(operator.accessibleStoreIds)) {
      operator.accessibleStoreIds.forEach(sid => managerStoreIds.add(sid));
    }

    if (target.storeId && managerStoreIds.has(target.storeId)) {
      return true;
    }

    if (Array.isArray(target.accessibleStoreIds) && target.accessibleStoreIds.some(sid => managerStoreIds.has(sid))) {
      return true;
    }

    return false;
  }

  // 4. 其他低等级员工无管理下级分支权限
  return false;
};

/**
 * 核心判定：当前操作者是否能够查看与管理目标账户
 * 业务规则：账户管理只能查看管理【同一分支】中【更低权限】的账户
 */
export const canManageStaffUser = (
  operator: StaffUser | null | undefined,
  target: StaffUser | null | undefined,
  merchants: MerchantAccount[] = [],
  stores: StoreEntity[] = []
): boolean => {
  if (!operator || !target) return false;

  // 不能在下级账户管理列表中管理自己（自己的档案在顶部或个人中心维护）
  if (operator.id === target.id || operator.username === target.username) {
    return false;
  }

  // 1. 严格低权限校验：目标权限等级必须严格小于操作者权限等级 (Level_target < Level_operator)
  const isLowerLevel = isSubordinateRole(operator.role, target.role);
  if (!isLowerLevel) {
    return false;
  }

  // 2. 同一分支校验：必须处于同一分支架构内
  return isSameBranch(operator, target, merchants, stores);
};

/**
 * 获取当前操作者可以为新员工或编辑员工分配的角色选项列表 (仅返回更低等级角色)
 */
export const getAssignableRolesForOperator = (
  operator: StaffUser | null | undefined
): { role: StaffRole; label: string; level: number; desc: string }[] => {
  if (!operator) return [];
  const operatorLevel = getRoleLevel(operator.role);

  const allRoleOptions: { role: StaffRole; label: string; level: number; desc: string }[] = [
    { role: 'MERCHANT', label: '连锁品牌主 (Merchant Owner)', level: 80, desc: '负责品牌多店大盘经营与菜单BOM工坊' },
    { role: 'STORE_MANAGER', label: '门店店长 (Store Manager)', level: 60, desc: '负责单店日常运营、原料台账与收银核销' },
    { role: 'CHEF', label: '后厨主厨 (Kitchen Chef)', level: 20, desc: '负责后厨KDS工位出餐与菜品即时估清' },
    { role: 'CASHIER', label: '前台收银员 (Counter Cashier)', level: 20, desc: '负责吧台POS点单、现金找零与刷卡记账' },
    { role: 'EXPO_PACKER', label: '打包叫号员 (Expo Packer)', level: 20, desc: '负责前厅打包出餐、大屏叫号与语音播报' },
  ];

  // 仅保留等级严格低于操作者的角色
  return allRoleOptions.filter(opt => opt.level < operatorLevel);
};

export interface RolePresetInfo {
  role: StaffRole;
  roleName: string;
  roleNameEn: string;
  defaultUsername: string;
  defaultPin: string;
  tag: string;
  tagColor: 'amber' | 'indigo' | 'emerald' | 'blue' | 'purple' | 'zinc';
  description: string;
  accessiblePages: {
    name: string;
    view: NavView;
    tab?: AdminTab;
    desc: string;
  }[];
  forbiddenPages: {
    name: string;
    reason: string;
  }[];
}

export const ROLE_PRESETS: RolePresetInfo[] = [
  {
    role: 'SUPER_ADMIN',
    roleName: '平台超级管理员',
    roleNameEn: 'SaaS Super Admin',
    defaultUsername: 'admin',
    defaultPin: '8888',
    tag: '平台最高权限',
    tagColor: 'amber',
    description: '负责 SaaS 全平台运营、跨国连锁商家入驻、多国门店与独立域名分配、全平台员工 RBAC 权限分配、EET2 税控及 Stripe 支付网关配置。',
    accessiblePages: [
      { name: '多店舰队与管理中台', view: 'SAAS_ADMIN', tab: 'FLEET_HUB', desc: '管理商家账户、跨国门店分配与独立域名白标' },
      { name: '全平台营收大盘', view: 'SAAS_ADMIN', tab: 'PLATFORM_ANALYTICS', desc: '查看多商户、多门店实时销售与统计' },
      { name: '食材消耗与采购价 (集采数据采集)', view: 'SAAS_ADMIN', tab: 'STORE_DAILY', desc: '全网食材消耗总量与进货单价聚合需求池' },
      { name: '账户与 RBAC 权限中枢', view: 'SAAS_ADMIN', tab: 'STAFF_RBAC', desc: '员工账号调度、角色分配与权限颗粒度' },
      { name: 'Stripe 支付网关', view: 'SAAS_ADMIN', tab: 'STRIPE_GATEWAY', desc: '配置 Stripe 独立商户密钥与沙盒联调' },
      { name: '捷克 EET 2.0 财政税控', view: 'SAAS_ADMIN', tab: 'EET2_FISCAL', desc: '配置 2027 财政税控、数字小票与签名' },
      { name: '系统架构规范与 API', view: 'ARCHITECTURE_SPEC', desc: '微服务架构规范与 API 文档' },
    ],
    forbiddenPages: [
      { name: '菜品与配方工坊 (BOM)', reason: '平台超级管理员聚焦于多租户入驻、集采需求池与税控合规；具体菜品与配方维护移交品牌主及门店端管理' },
    ],
  },
  {
    role: 'MERCHANT',
    roleName: '多瑙连锁品牌主',
    roleNameEn: 'Merchant Brand Owner',
    defaultUsername: 'merchant_boss',
    defaultPin: '6666',
    tag: '连锁品牌中台',
    tagColor: 'indigo',
    description: '负责多瑙餐饮品牌旗下多家门店（巴黎旗舰店、柏林自营店、布拉格概念店）的日常经营、品牌营收大盘、菜品配方工坊、门店原料库存台账与旗下商铺管理。',
    accessiblePages: [
      { name: '品牌多店大盘分析', view: 'SAAS_ADMIN', tab: 'PLATFORM_ANALYTICS', desc: '旗下所有门店销售报表、客单价与支付占比' },
      { name: '旗下商铺档案与列表', view: 'SAAS_ADMIN', tab: 'FLEET_HUB', desc: '查看名下已授权的欧洲门店实体' },
      { name: '菜品与 BOM 配方工坊', view: 'MENU_WORKSHOP', desc: '品牌菜单统一维护、价格与原料 BOM 关系' },
      { name: '全店食材库存与台账', view: 'SAAS_ADMIN', tab: 'STORE_DAILY', desc: '全门店原料库存监控、采购入库与盘点流水' },
      { name: '企业员工与 RBAC 权限', view: 'SAAS_ADMIN', tab: 'STAFF_RBAC', desc: '管理名下企业员工档案、工号、部门、角色权限与密码' },
    ],
    forbiddenPages: [
      { name: '系统架构规范与 API', reason: '仅平台超级管理员 (Super Admin) 可查阅底层微服务架构规范与 API 开发文档' },
      { name: '门店终端所有页面 (POS/H5/KDS/Expo/TV/沙盒)', reason: '门店终端属于现场店员及收银操作界面，商家账户聚焦于品牌中台管控与经营报表' },
      { name: '创建新门店实体与签约商户', reason: '仅平台超级管理员可创建新的独立门店并分配配额' },
      { name: '独立域名与白标中枢', reason: '仅平台超级管理员可分配与解析独立域名及 White-label 白标' },
      { name: 'Stripe 支付网关密钥中枢', reason: '由平台 Admin 统一管控多商户接入与支付网关密钥' },
      { name: '捷克 EET 2.0 财政税控接口', reason: '由平台 Admin 统一部署国家财政税控证书与数字签名接口' },
    ],
  },
  {
    role: 'STORE_MANAGER',
    roleName: '巴黎旗舰店店长',
    roleNameEn: 'Store Manager (Pierre)',
    defaultUsername: 'manager_pierre',
    defaultPin: '1111',
    tag: '单店运营核心',
    tagColor: 'emerald',
    description: '负责门店当日实时营业流水、后厨食材原料出入库与盘点校准、菜单商品即时估清、前台收银与顾客交付核销全流程。',
    accessiblePages: [
      { name: '店长日常工作台 (台账与库存)', view: 'SAAS_ADMIN', tab: 'STORE_DAILY', desc: '今日实时销售订单流水 + 后厨原料入库/损耗/盘点' },
      { name: '菜品与配方工坊', view: 'MENU_WORKSHOP', desc: '查看菜单定价、配方原料与单品估清' },
      { name: '柜台收银终端 POS', view: 'COUNTER_SCAN', desc: '吧台点单收银、现金找零与交付核销' },
      { name: '顾客扫码点餐 H5', view: 'CUSTOMER_H5', desc: '顾客端点餐体验与菜品预览' },
      { name: '后厨出餐工位 KDS', view: 'KDS_STATIONS', desc: '巡查后厨制作进度与工位负载' },
      { name: '打包与叫号总控', view: 'EXPO_PACK', desc: '前厅打包核销与叫号大屏' },
      { name: '取餐大屏电视', view: 'CALLING_TV', desc: '门店大屏叫号翻牌' },
      { name: '多端协同分屏沙盒', view: 'SPLIT_SANDBOX', desc: '全流程模拟演练' },
    ],
    forbiddenPages: [
      { name: 'SaaS 舰队中枢与商户管理', reason: '仅超级管理员与品牌主可查看跨店舰队管理' },
      { name: '多商户平台营收大盘', reason: '仅超级管理员与品牌主可查看跨商户汇总报表' },
      { name: '全平台 RBAC 权限中心', reason: '仅超级管理员可调度员工账号权限' },
      { name: '底层架构规范与 API 文档', reason: '开发工程文档非店长日常运维范畴' },
    ],
  },
  {
    role: 'CHEF',
    roleName: '后厨出餐主厨',
    roleNameEn: 'Kitchen Chef (Marco)',
    defaultUsername: 'chef_marco',
    defaultPin: '2222',
    tag: '后厨出餐制作',
    tagColor: 'purple',
    description: '负责后厨各工位（水吧茶饮、金牌炸台、煎烤工位）出餐看板任务流转、划单完成与菜品即时估清。',
    accessiblePages: [
      { name: '后厨出餐工位 KDS', view: 'KDS_STATIONS', desc: '分工位（水吧/炸台/煎烤）查看待做订单、计时预警与完成划单' },
      { name: '顾客点餐 H5 (参考)', view: 'CUSTOMER_H5', desc: '参考顾客点单规格加料' },
      { name: '多端协同分屏沙盒', view: 'SPLIT_SANDBOX', desc: '后厨与前厅联动测试' },
    ],
    forbiddenPages: [
      { name: 'SaaS 管理中台与财务分析', reason: '无财务与商户管理权限' },
      { name: '柜台收银终端 POS', reason: '后厨制作人员不参与前台现钞与刷卡点单' },
      { name: '打包与叫号总控', reason: '由前厅 Expo 打包员负责总控叫号' },
      { name: '支付网关与税控配置', reason: '无系统网关配置权限' },
    ],
  },
  {
    role: 'CASHIER',
    roleName: '前台吧台收银员',
    roleNameEn: 'Front Cashier (Emma)',
    defaultUsername: 'cashier_emma',
    defaultPin: '3333',
    tag: '前台收银点单',
    tagColor: 'blue',
    description: '负责吧台 POS 点单开单、现金收银与精准找零、POS 刷卡记账、订单出餐取餐码核销与钱箱交班流水核对。',
    accessiblePages: [
      { name: '柜台收银终端 POS', view: 'COUNTER_SCAN', desc: '极速点单、加料规格、现钞找零、POS刷卡与取餐码核销' },
      { name: '顾客扫码点餐 H5', view: 'CUSTOMER_H5', desc: '协助到店顾客体验扫码点单' },
      { name: '取餐大屏电视', view: 'CALLING_TV', desc: '观察前厅大屏排队与叫号情况' },
      { name: '多端协同分屏沙盒', view: 'SPLIT_SANDBOX', desc: '收银与出餐协同演练' },
    ],
    forbiddenPages: [
      { name: 'SaaS 管理中台与财务分析', reason: '无商户大盘与后台管理权限' },
      { name: '后厨出餐工位 KDS', reason: '前台收银人员不参与后厨制作划单' },
      { name: '菜品配方 BOM 工坊', reason: '无配方原料成本编辑权限' },
      { name: '支付网关与税控配置', reason: '无系统底层密钥配置权限' },
    ],
  },
  {
    role: 'EXPO_PACKER',
    roleName: '打包叫号总控员',
    roleNameEn: 'Expo Packer (Lucas)',
    defaultUsername: 'expo_lucas',
    defaultPin: '4444',
    tag: '总控打包叫号',
    tagColor: 'zinc',
    description: '负责订单全部餐品齐套总装打包、触发取餐大屏翻牌叫号与多国语言 TTS 实时语音播报、交付顾客核销。',
    accessiblePages: [
      { name: '打包与叫号总控 Expo', view: 'EXPO_PACK', desc: '齐套餐品校验、一键触发大屏叫号翻牌与语音播报' },
      { name: '取餐大屏电视 Calling TV', view: 'CALLING_TV', desc: '顾客取餐区叫号显示大屏' },
      { name: '后厨出餐工位 KDS (协助)', view: 'KDS_STATIONS', desc: '协助后厨确认待出餐商品' },
      { name: '多端协同分屏沙盒', view: 'SPLIT_SANDBOX', desc: '多端联动协同演练' },
    ],
    forbiddenPages: [
      { name: 'SaaS 管理中台与财务分析', reason: '无商户后台管理权限' },
      { name: '柜台收银终端 POS', reason: '打包人员不参与前厅现钞收银' },
      { name: '菜品配方工坊与成本', reason: '无菜单配方与价格管理权限' },
      { name: '系统架构与支付网关', reason: '无系统配置权限' },
    ],
  },
];

/**
 * Check whether a user with given role can access a specific view and tab
 */
export const canAccessView = (
  role: StaffRole,
  view: NavView,
  tab?: string
): boolean => {
  // 严格权限：除平台超级管理员 (SUPER_ADMIN) 以外，所有账户均不显示且不可访问系统架构与 API 页面
  if (view === 'ARCHITECTURE_SPEC') {
    return role === 'SUPER_ADMIN';
  }

  if (role === 'SUPER_ADMIN') {
    // 菜品与配方工坊已移交商家和门店管理，超管聚焦于平台入驻、集采数据采集大盘、税控与RBAC
    if (view === 'MENU_WORKSHOP' || tab === 'MENU_WORKSHOP') return false;
    return true;
  }

  if (role === 'MERCHANT') {
    // 商家账户不显示/访问门店终端中的所有页面（如收银POS、点餐H5、后厨KDS、打包叫号Expo、取餐电视、协同沙盒）
    if (
      view === 'COUNTER_SCAN' ||
      view === 'CUSTOMER_H5' ||
      view === 'KDS_STATIONS' ||
      view === 'EXPO_PACK' ||
      view === 'CALLING_TV' ||
      view === 'SPLIT_SANDBOX'
    ) {
      return false;
    }

    if (view === 'SAAS_ADMIN') {
      // 商家不可访问超管专属的独立域名白标、Stripe网关配置与EET2税控接口
      if (
        tab === 'FLEET_DOMAINS' ||
        tab === 'STRIPE_GATEWAY' ||
        tab === 'EET2_FISCAL'
      ) {
        return false;
      }
      return true;
    }

    if (view === 'MENU_WORKSHOP') return true;

    return false;
  }

  if (role === 'STORE_MANAGER') {
    if (view === 'SAAS_ADMIN') {
      return tab === 'STORE_DAILY';
    }
    return true;
  }

  if (role === 'CHEF') {
    return view === 'KDS_STATIONS' || view === 'CUSTOMER_H5' || view === 'SPLIT_SANDBOX';
  }

  if (role === 'CASHIER') {
    return view === 'COUNTER_SCAN' || view === 'CUSTOMER_H5' || view === 'CALLING_TV' || view === 'SPLIT_SANDBOX';
  }

  if (role === 'EXPO_PACKER') {
    return view === 'EXPO_PACK' || view === 'CALLING_TV' || view === 'KDS_STATIONS' || view === 'SPLIT_SANDBOX';
  }

  return false;
};

/**
 * Return default home view & tab when a role logs in
 */
export const getRoleDefaultView = (
  role: StaffRole
): { view: NavView; tab?: AdminTab } => {
  switch (role) {
    case 'SUPER_ADMIN':
      return { view: 'SAAS_ADMIN', tab: 'FLEET_HUB' };
    case 'MERCHANT':
      return { view: 'SAAS_ADMIN', tab: 'PLATFORM_ANALYTICS' };
    case 'STORE_MANAGER':
      return { view: 'SAAS_ADMIN', tab: 'STORE_DAILY' };
    case 'CHEF':
      return { view: 'KDS_STATIONS' };
    case 'CASHIER':
      return { view: 'COUNTER_SCAN' };
    case 'EXPO_PACKER':
      return { view: 'EXPO_PACK' };
    default:
      return { view: 'CUSTOMER_H5' };
  }
};
