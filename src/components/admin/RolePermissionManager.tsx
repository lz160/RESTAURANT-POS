import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffUser, StaffRole } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  X,
  Building2,
  Search,
  Store,
  Mail,
  Phone,
  Calendar,
  Award,
  Clock,
  HeartHandshake,
  AlertCircle,
  Eye,
  EyeOff,
  UserX,
  RotateCcw,
  BadgeCheck,
  Filter,
  Layers,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

export const RolePermissionManager: React.FC = () => {
  const {
    staffUsers,
    stores,
    merchants,
    permissionsList,
    currentStaffUser,
    setCurrentStaffUser,
    createStaffUser,
    updateStaffUser,
    deleteStaffUser,
    t,
    theme,
  } = useApp();

  const isSuperAdmin = currentStaffUser?.role === 'SUPER_ADMIN';
  const isMerchant = currentStaffUser?.role === 'MERCHANT';

  // Identify current merchant if user is merchant
  const activeMerchant = useMemo(() => {
    if (isMerchant) {
      return (currentStaffUser.merchantId ? merchants.find(m => m.id === currentStaffUser.merchantId) : null) || merchants[0];
    }
    return null;
  }, [isMerchant, currentStaffUser, merchants]);

  // Brand filter (Super Admin can switch, Merchant is locked to their brand)
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>(isMerchant && activeMerchant ? activeMerchant.id : 'ALL');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'PROFILE' | 'RBAC'>('PROFILE');

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPinOpen, setIsResetPinOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Copied PIN indicator
  const [copiedPin, setCopiedPin] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered staff list
  const filteredStaffUsers = useMemo(() => {
    return (staffUsers || []).filter((user) => {
      // 1. If merchant logged in, strictly only see staff belonging to their merchant/brand
      if (isMerchant && activeMerchant) {
        const isSelf = user.id === currentStaffUser.id;
        const matchesMerchantId = user.merchantId === activeMerchant.id;
        const matchesBrandCode = user.brandCode === activeMerchant.brandCode || user.username.startsWith(activeMerchant.brandCode);
        const matchesStore = user.storeId && activeMerchant.assignedStoreIds?.includes(user.storeId);
        if (!isSelf && !matchesMerchantId && !matchesBrandCode && !matchesStore) {
          return false;
        }
      }

      // 2. Super Admin Brand filter
      if (!isMerchant) {
        if (selectedBrandFilter === 'SUPER_ADMIN') {
          if (user.role !== 'SUPER_ADMIN') return false;
        } else if (selectedBrandFilter !== 'ALL') {
          const m = merchants.find((item) => item.id === selectedBrandFilter);
          if (m) {
            const matchesMId = user.merchantId === m.id;
            const matchesStore = user.storeId && m.assignedStoreIds?.includes(user.storeId);
            const matchesCode = user.brandCode === m.brandCode || user.username.startsWith(m.brandCode);
            if (!matchesMId && !matchesStore && !matchesCode) return false;
          }
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        if ((user.status || 'ACTIVE') !== statusFilter) return false;
      }

      // 4. Department Filter
      if (departmentFilter !== 'ALL') {
        if ((user.department || '门店运营部') !== departmentFilter) return false;
      }

      // 5. Search Query (Name, Username, Employee ID, Email, Phone, Position, Location)
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.trim().toLowerCase();
        const match =
          (user.name && user.name.toLowerCase().includes(q)) ||
          (user.username && user.username.toLowerCase().includes(q)) ||
          (user.employeeNumber && user.employeeNumber.toLowerCase().includes(q)) ||
          (user.email && user.email.toLowerCase().includes(q)) ||
          (user.phone && user.phone.toLowerCase().includes(q)) ||
          (user.position && user.position.toLowerCase().includes(q)) ||
          (user.department && user.department.toLowerCase().includes(q)) ||
          (user.locationName && user.locationName.toLowerCase().includes(q)) ||
          (user.role && user.role.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [staffUsers, isMerchant, activeMerchant, selectedBrandFilter, statusFilter, departmentFilter, staffSearchQuery, currentStaffUser, merchants]);

  // Selected staff state
  const [selectedStaff, setSelectedStaff] = useState<StaffUser>(
    filteredStaffUsers[0] || currentStaffUser
  );

  // Sync selected staff if list changes and current selection is gone
  React.useEffect(() => {
    if (selectedStaff) {
      const updated = staffUsers.find((u) => u.id === selectedStaff.id);
      if (updated) {
        setSelectedStaff(updated);
      } else if (filteredStaffUsers.length > 0) {
        setSelectedStaff(filteredStaffUsers[0]);
      }
    } else if (filteredStaffUsers.length > 0) {
      setSelectedStaff(filteredStaffUsers[0]);
    }
  }, [staffUsers, filteredStaffUsers]);

  // Available stores for selection based on role
  const selectableStores = useMemo(() => {
    if (isMerchant && activeMerchant) {
      return stores.filter(
        (s) =>
          activeMerchant.assignedStoreIds?.includes(s.id) ||
          s.merchantId === activeMerchant.id ||
          (currentStaffUser.accessibleStoreIds && currentStaffUser.accessibleStoreIds.includes(s.id))
      );
    }
    return stores;
  }, [isMerchant, activeMerchant, stores, currentStaffUser]);

  // Departments list for filter & select
  const departmentOptions = [
    '门店运营部',
    '前厅吧台部',
    '后厨研发部',
    '仓储供应链',
    '财务审计部',
    '集团管理部',
  ];

  // Employee Form State (for both Add and Edit)
  const initialEmployeeForm = {
    name: '',
    username: '',
    employeeNumber: '',
    role: 'CASHIER' as StaffRole,
    department: '门店运营部',
    position: '餐饮运营服务专员',
    storeId: selectableStores[0]?.id || 'store_paris_01',
    accessibleStoreIds: [selectableStores[0]?.id || 'store_paris_01'] as string[],
    locationName: selectableStores[0]?.storeName || '巴黎香榭丽舍旗舰店',
    email: '',
    phone: '',
    hireDate: new Date().toISOString().slice(0, 10),
    availability: '全职 (常驻轮班)',
    emergencyContactName: '应急联系人',
    emergencyContactPhone: '+33 6 00 00 00 00',
    emergencyContactRelationship: '家属',
    skillsInput: 'POS收银, 餐品核验, 顾客服务',
    certificationsInput: '食品安全卫生证 HACCP',
    pinCode: '1234',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
  };

  const [employeeFormData, setEmployeeFormData] = useState(initialEmployeeForm);
  const [resetPinValue, setResetPinValue] = useState('1234');

  // Open Edit Modal with selected staff data
  const handleOpenEditModal = (staff: StaffUser) => {
    const assignedStores = staff.accessibleStoreIds && staff.accessibleStoreIds.length > 0
      ? staff.accessibleStoreIds
      : [staff.storeId || selectableStores[0]?.id || 'store_paris_01'];

    setEmployeeFormData({
      name: staff.name || '',
      username: staff.username || '',
      employeeNumber: staff.employeeNumber || '',
      role: staff.role || 'CASHIER',
      department: staff.department || '门店运营部',
      position: staff.position || '餐饮运营服务专员',
      storeId: staff.storeId || selectableStores[0]?.id || 'store_paris_01',
      accessibleStoreIds: assignedStores,
      locationName: staff.locationName || selectableStores[0]?.storeName || '',
      email: staff.email || '',
      phone: staff.phone || '',
      hireDate: staff.hireDate || new Date().toISOString().slice(0, 10),
      availability: staff.availability || '全职 (常驻轮班)',
      emergencyContactName: staff.emergencyContact?.name || '',
      emergencyContactPhone: staff.emergencyContact?.phone || '',
      emergencyContactRelationship: staff.emergencyContact?.relationship || '家属',
      skillsInput: Array.isArray(staff.skills) ? staff.skills.join(', ') : '',
      certificationsInput: Array.isArray(staff.certifications) ? staff.certifications.join(', ') : '',
      pinCode: staff.pinCode || '1234',
      status: staff.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const brandCodePrefix = (isMerchant && activeMerchant ? activeMerchant.brandCode : 'POS').toUpperCase();
    const randomEmpId = `EMP-${brandCodePrefix}-${Math.floor(100 + Math.random() * 900)}`;
    const randomUser = `emp_${Math.random().toString(36).slice(2, 6)}`;
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

    setEmployeeFormData({
      ...initialEmployeeForm,
      employeeNumber: randomEmpId,
      username: randomUser,
      pinCode: randomPin,
      storeId: selectableStores[0]?.id || 'store_paris_01',
      accessibleStoreIds: [selectableStores[0]?.id || 'store_paris_01'],
      locationName: selectableStores[0]?.storeName || '旗舰店',
    });
    setIsAddStaffOpen(true);
  };

  // Handle Add Form Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.name.trim()) {
      showToast('请输入员工姓名', 'error');
      return;
    }

    try {
      // Default perms according to role
      let initialPerms: string[] = ['perm_menu_view'];
      if (employeeFormData.role === 'SUPER_ADMIN') {
        initialPerms = permissionsList.map((p) => p.id);
      } else if (employeeFormData.role === 'MERCHANT') {
        initialPerms = permissionsList.filter(p => !['perm_system_config', 'perm_db_access'].includes(p.id)).map(p => p.id);
      } else if (employeeFormData.role === 'STORE_MANAGER') {
        initialPerms = permissionsList.filter(p => !['perm_system_config', 'perm_db_access'].includes(p.id)).map(p => p.id);
      } else if (employeeFormData.role === 'CASHIER') {
        initialPerms = ['perm_menu_view', 'perm_order_create', 'perm_order_verify', 'perm_sku_soldout', 'perm_finance_view'];
      } else if (employeeFormData.role === 'CHEF') {
        initialPerms = ['perm_menu_view', 'perm_kds_bump', 'perm_sku_soldout'];
      } else if (employeeFormData.role === 'EXPO_PACKER') {
        initialPerms = ['perm_menu_view', 'perm_kds_bump', 'perm_expo_call', 'perm_order_verify'];
      }

      const targetStore = stores.find(s => s.id === employeeFormData.storeId);
      const effectiveMerchantId = isMerchant && activeMerchant ? activeMerchant.id : (targetStore?.merchantId || undefined);
      const effectiveBrandCode = isMerchant && activeMerchant ? activeMerchant.brandCode : (targetStore?.brandCode || 'danube');

      const skillsArray = employeeFormData.skillsInput
        .split(/[,，、\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const certsArray = employeeFormData.certificationsInput
        .split(/[,，、\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const finalAccessibleStores = employeeFormData.accessibleStoreIds && employeeFormData.accessibleStoreIds.length > 0
        ? employeeFormData.accessibleStoreIds
        : [employeeFormData.storeId];

      const res = await createStaffUser({
        name: employeeFormData.name.trim(),
        username: employeeFormData.username.trim() || `staff_${Date.now().toString().slice(-4)}`,
        role: employeeFormData.role,
        merchantId: effectiveMerchantId,
        brandCode: effectiveBrandCode,
        storeId: employeeFormData.storeId,
        accessibleStoreIds: finalAccessibleStores,
        employeeNumber: employeeFormData.employeeNumber.trim(),
        email: employeeFormData.email.trim(),
        phone: employeeFormData.phone.trim(),
        position: employeeFormData.position.trim(),
        department: employeeFormData.department.trim(),
        locationName: targetStore ? targetStore.storeName : employeeFormData.locationName,
        hireDate: employeeFormData.hireDate,
        availability: employeeFormData.availability,
        emergencyContact: {
          name: employeeFormData.emergencyContactName.trim() || '应急联系人',
          phone: employeeFormData.emergencyContactPhone.trim() || '+33 6 00 00 00 00',
          relationship: employeeFormData.emergencyContactRelationship.trim() || '家属',
        },
        skills: skillsArray.length > 0 ? skillsArray : ['POS收银', '餐品核验'],
        certifications: certsArray.length > 0 ? certsArray : ['食品安全卫生证 HACCP'],
        pinCode: employeeFormData.pinCode || '1234',
        status: employeeFormData.status || 'ACTIVE',
        permissions: initialPerms,
      });

      setIsAddStaffOpen(false);
      if (res.staff) {
        setSelectedStaff(res.staff);
      }
      showToast(`员工【${employeeFormData.name}】档案创建成功`);
    } catch (err: any) {
      showToast(err.message || '创建员工失败', 'error');
    }
  };

  // Handle Edit Form Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!employeeFormData.name.trim()) {
      showToast('请输入员工姓名', 'error');
      return;
    }

    try {
      const targetStore = stores.find(s => s.id === employeeFormData.storeId);
      const skillsArray = employeeFormData.skillsInput
        .split(/[,，、\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const certsArray = employeeFormData.certificationsInput
        .split(/[,，、\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const finalAccessibleStores = employeeFormData.accessibleStoreIds && employeeFormData.accessibleStoreIds.length > 0
        ? employeeFormData.accessibleStoreIds
        : [employeeFormData.storeId];

      const payload = {
        name: employeeFormData.name.trim(),
        username: employeeFormData.username.trim(),
        role: employeeFormData.role,
        employeeNumber: employeeFormData.employeeNumber.trim(),
        department: employeeFormData.department.trim(),
        position: employeeFormData.position.trim(),
        storeId: employeeFormData.storeId,
        accessibleStoreIds: finalAccessibleStores,
        locationName: targetStore ? targetStore.storeName : employeeFormData.locationName,
        email: employeeFormData.email.trim(),
        phone: employeeFormData.phone.trim(),
        hireDate: employeeFormData.hireDate,
        availability: employeeFormData.availability,
        emergencyContact: {
          name: employeeFormData.emergencyContactName.trim(),
          phone: employeeFormData.emergencyContactPhone.trim(),
          relationship: employeeFormData.emergencyContactRelationship.trim(),
        },
        skills: skillsArray,
        certifications: certsArray,
        status: employeeFormData.status,
      };

      const res = await updateStaffUser(selectedStaff.id, payload);
      setIsEditModalOpen(false);
      if (res.staff) {
        setSelectedStaff(res.staff);
      }
      showToast(`员工【${employeeFormData.name}】档案更新成功`);
    } catch (err: any) {
      showToast(err.message || '更新员工失败', 'error');
    }
  };

  // Toggle Staff Status (ACTIVE <-> SUSPENDED / 禁用)
  const handleToggleStaffStatus = async (staff: StaffUser) => {
    if (staff.role === 'SUPER_ADMIN' && staff.id === currentStaffUser.id) {
      showToast('禁止禁用当前登入的超级管理员账号', 'error');
      return;
    }

    const currentStatus = staff.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? '启用' : '禁用';

    try {
      const res = await updateStaffUser(staff.id, { status: newStatus });
      if (selectedStaff.id === staff.id) {
        setSelectedStaff({ ...selectedStaff, status: newStatus });
      }
      showToast(`员工【${staff.name}】账号已成功${actionText}`);
    } catch (err: any) {
      showToast(err.message || `${actionText}失败`, 'error');
    }
  };

  // Reset PIN / Password Handler
  const handleOpenResetPinModal = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setResetPinValue(Math.floor(1000 + Math.random() * 9000).toString());
    setIsResetPinOpen(true);
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    if (!resetPinValue || resetPinValue.length < 4) {
      showToast('请输入至少 4 位数字的登录 PIN 码', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${selectedStaff.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode: resetPinValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '重置密码失败');

      await updateStaffUser(selectedStaff.id, { pinCode: resetPinValue });
      setSelectedStaff({ ...selectedStaff, pinCode: resetPinValue });
      setIsResetPinOpen(false);
      showToast(`员工【${selectedStaff.name}】登录 PIN 码已重置为：${resetPinValue}`);
    } catch (err: any) {
      showToast(err.message || '重置密码失败', 'error');
    }
  };

  // Delete Staff User Handler
  const handleDeleteStaffSubmit = async () => {
    if (!selectedStaff) return;
    if (selectedStaff.role === 'SUPER_ADMIN') {
      showToast('禁止删除超级管理员账号', 'error');
      setIsDeleteConfirmOpen(false);
      return;
    }

    try {
      await deleteStaffUser(selectedStaff.id);
      setIsDeleteConfirmOpen(false);
      showToast(`员工【${selectedStaff.name}】账号已注销删除`);
      if (filteredStaffUsers.length > 0) {
        setSelectedStaff(filteredStaffUsers[0]);
      }
    } catch (err: any) {
      showToast(err.message || '删除员工失败', 'error');
    }
  };

  // Toggle Individual Permission in Matrix
  const handleTogglePermission = async (permId: string) => {
    if (!selectedStaff) return;
    if (selectedStaff.role === 'SUPER_ADMIN') {
      showToast('超级管理员拥有全部不可撤销权限', 'error');
      return;
    }

    const hasIt = selectedStaff.permissions?.includes(permId);
    const currentPerms = selectedStaff.permissions || [];
    const newPerms = hasIt
      ? currentPerms.filter((p) => p !== permId)
      : [...currentPerms, permId];

    try {
      await updateStaffUser(selectedStaff.id, { permissions: newPerms });
      setSelectedStaff({ ...selectedStaff, permissions: newPerms });
      showToast('权限配置已即时更新');
    } catch (err: any) {
      showToast(err.message || '更新权限失败', 'error');
    }
  };

  // Grant All Permissions
  const handleGrantAllPermissions = async () => {
    if (!selectedStaff) return;
    const allPermIds = permissionsList.map((p) => p.id);
    try {
      await updateStaffUser(selectedStaff.id, { permissions: allPermIds });
      setSelectedStaff({ ...selectedStaff, permissions: allPermIds });
      showToast('已授予全部可用权限');
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  // Permission Categories
  const permissionCategories = [
    { key: 'MENU', label: '菜单与商品配方 (Menu & BOM)' },
    { key: 'ORDERS', label: '收银与后厨调度 (Orders & KDS)' },
    { key: 'STAFF', label: '员工档案与 RBAC (Staff & HR)' },
    { key: 'FINANCE', label: '财务审计与税控 (Finance & EET)' },
    { key: 'SYSTEM', label: '系统与舰队配置 (Fleet & System)' },
  ];

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredStaffUsers.length;
    const active = filteredStaffUsers.filter((u) => (u.status || 'ACTIVE') === 'ACTIVE').length;
    const suspended = total - active;
    const depts = new Set(filteredStaffUsers.map((u) => u.department || '门店运营部')).size;
    return { total, active, suspended, depts };
  }, [filteredStaffUsers]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none">
      
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border animate-bounce flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
              {isMerchant && activeMerchant
                ? `【${activeMerchant.name}】企业员工与人事档案中心`
                : '全平台多商户员工档案与 RBAC 权限中枢'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              {isMerchant ? '企业管理者专属' : '全租户总览'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isMerchant
              ? '管理名下各直营及加盟分店的在职员工、岗位角色、部门归属、排班可用性、技能证书与登录安全密码。'
              : '统一调度多商户与跨国分店的员工账号、细粒度 RBAC 权限矩阵与安全凭证。'}
          </p>
        </div>

        {/* Action button & Summary stats */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            <span>在职员工: <strong className="text-emerald-600 dark:text-emerald-400">{stats.active}</strong></span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>已禁用: <strong className="text-zinc-400">{stats.suspended}</strong></span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>覆盖部门: <strong className="text-zinc-900 dark:text-zinc-100">{stats.depts}</strong></span>
          </div>

          <button
            type="button"
            id="btn_create_staff"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold transition shadow-sm active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>创建员工档案</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden min-h-0">
        
        {/* Left Column: Staff Directory with Filters */}
        <div className="w-full md:w-96 shrink-0 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-2xs overflow-hidden">
          
          {/* Header & Count */}
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <h2 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">员工名册列表</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold font-mono">
              {filteredStaffUsers.length} / {staffUsers.length}
            </span>
          </div>

          {/* Super Admin Brand Selector */}
          {isSuperAdmin && (
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto border-b border-zinc-100 dark:border-zinc-800 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedBrandFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                  selectedBrandFilter === 'ALL'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                全部品牌
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrandFilter('SUPER_ADMIN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                  selectedBrandFilter === 'SUPER_ADMIN'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                }`}
              >
                超管中心
              </button>
              {merchants.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedBrandFilter(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                    selectedBrandFilter === m.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {m.name.slice(0, 5)}
                </button>
              ))}
            </div>
          )}

          {/* Search Box */}
          <div className="pt-2 pb-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input_search_staff"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="搜索员工姓名、工号、职位、部门..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
              />
            </div>
          </div>

          {/* Filter Dropdowns (Department & Status) */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 text-[11px]">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2 py-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
            >
              <option value="ALL">全部部门</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
            >
              <option value="ALL">全部状态</option>
              <option value="ACTIVE">🟢 活跃在职</option>
              <option value="SUSPENDED">🔴 已禁用冻结</option>
            </select>
          </div>

          {/* Staff Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-0.5 min-h-0">
            {filteredStaffUsers.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs">
                没有找到匹配条件的员工档案
              </div>
            ) : (
              filteredStaffUsers.map((user) => {
                const isSelected = selectedStaff?.id === user.id;
                const isCurrentLoggedIn = currentStaffUser?.id === user.id;
                const isSuspended = user.status === 'SUSPENDED';

                return (
                  <div
                    key={user.id}
                    id={`staff_card_${user.id}`}
                    onClick={() => setSelectedStaff(user)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2 relative ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                        : isSuspended
                        ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 opacity-75 hover:opacity-100'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850 hover:bg-zinc-100/70 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                              isSuspended ? 'bg-zinc-400' : 'bg-emerald-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span className="truncate text-zinc-900 dark:text-zinc-100">{user.name}</span>
                            {isCurrentLoggedIn && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                                当前登入
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                            {user.employeeNumber || `ID: ${user.username}`}
                          </div>
                        </div>
                      </div>

                      {/* Status / Role Tag */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            user.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : user.role === 'MERCHANT'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : user.role === 'STORE_MANAGER'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {user.role === 'SUPER_ADMIN'
                            ? '超级管理员'
                            : user.role === 'MERCHANT'
                            ? '连锁管理'
                            : user.role === 'STORE_MANAGER'
                            ? '店长'
                            : user.role === 'CASHIER'
                            ? '收银'
                            : user.role === 'CHEF'
                            ? '主厨'
                            : 'Expo'}
                        </span>

                        {isSuspended && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900">
                            已禁用
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Department & Location Pills */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-200/50 dark:border-zinc-800/80">
                      <span className="truncate">{user.department || '门店运营部'} · {user.position || '专员'}</span>
                      <span className="truncate font-medium text-zinc-600 dark:text-zinc-300 ml-1 font-mono text-[9px]">
                        {user.locationName || '巴黎旗舰店'}
                      </span>
                    </div>

                    {/* Footer Quick Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        PIN: {user.pinCode || '****'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(user);
                          }}
                          title="编辑员工信息"
                          className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenResetPinModal(user);
                          }}
                          title="重置登录 PIN 码"
                          className="p-1 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {user.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStaffStatus(user);
                            }}
                            title={isSuspended ? '启用员工' : '禁用员工'}
                            className={`p-1 transition ${
                              isSuspended ? 'text-zinc-400 hover:text-emerald-600' : 'text-zinc-400 hover:text-rose-500'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Employee Detailed Profile & RBAC Matrix */}
        <div className="flex-1 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs overflow-hidden min-h-0">
          
          {selectedStaff ? (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={selectedStaff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={selectedStaff.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50">
                        {selectedStaff.name}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                        {selectedStaff.role}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          selectedStaff.status === 'SUSPENDED'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                        }`}
                      >
                        {selectedStaff.status === 'SUSPENDED' ? '🔴 已禁用 (冻结)' : '🟢 在职活跃'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap font-mono">
                      <span>工号: <strong className="text-zinc-900 dark:text-zinc-100">{selectedStaff.employeeNumber || '未设定'}</strong></span>
                      <span>·</span>
                      <span>登录名: <strong>@{selectedStaff.username}</strong></span>
                      <span>·</span>
                      <span>工作地点: <strong className="text-zinc-900 dark:text-zinc-100">{selectedStaff.locationName || '旗舰店'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Management Action Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    id="btn_edit_profile"
                    onClick={() => handleOpenEditModal(selectedStaff)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>编辑档案</span>
                  </button>

                  <button
                    type="button"
                    id="btn_reset_pin"
                    onClick={() => handleOpenResetPinModal(selectedStaff)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold transition"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>重置 PIN 码</span>
                  </button>

                  {selectedStaff.role !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      id="btn_toggle_status"
                      onClick={() => handleToggleStaffStatus(selectedStaff)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border font-semibold transition ${
                        selectedStaff.status === 'SUSPENDED'
                          ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{selectedStaff.status === 'SUSPENDED' ? '启用员工' : '禁用员工'}</span>
                    </button>
                  )}

                  {selectedStaff.role !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      id="btn_delete_staff"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStaffUser(selectedStaff);
                      showToast(`已切换当前操作身份为：${selectedStaff.name}`);
                    }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold hover:bg-zinc-800 transition"
                  >
                    <span>⚡ 切换身份</span>
                  </button>
                </div>
              </div>

              {/* Sub-tabs: Profile vs RBAC Matrix */}
              <div className="flex items-center gap-2 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('PROFILE')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeSubTab === 'PROFILE'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>员工完整档案 (Employee Profile)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('RBAC')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeSubTab === 'RBAC'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>RBAC 权限矩阵配置 ({selectedStaff.permissions?.length || 0} / {permissionsList.length})</span>
                </button>
              </div>

              {/* Sub-tab 1: Employee Detailed Information Profile */}
              {activeSubTab === 'PROFILE' && (
                <div className="flex-1 overflow-y-auto mt-3 space-y-4 pr-1 min-h-0">
                  
                  {/* Grid 1: Basic & Employment Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    
                    {/* Item 1: Name & ID */}
                    <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>工号与姓名 (Employee ID & Name)</span>
                      </div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{selectedStaff.name}</div>
                      <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {selectedStaff.employeeNumber || 'EMP-TEMP-000'}
                      </div>
                    </div>

                    {/* Item 2: Department & Position */}
                    <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>所属部门与职位 (Dept & Position)</span>
                      </div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {selectedStaff.department || '门店运营部'}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {selectedStaff.position || '餐饮运营服务专员'}
                      </div>
                    </div>

                    {/* Item 3: Store & Location */}
                    <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                        <Store className="w-3.5 h-3.5 text-amber-500" />
                        <span>工作门店 / 地点 (Location)</span>
                      </div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {selectedStaff.locationName || '巴黎香榭丽舍旗舰店'}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        StoreID: {selectedStaff.storeId || 'N/A'}
                      </div>
                    </div>

                    {/* Item 4: Email */}
                    <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        <span>电子邮箱 (Email)</span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {selectedStaff.email || '未登记邮箱'}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">用于接收薪酬单与企业通知</div>
                    </div>

                    {/* Item 5: Phone */}
                    <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                        <Phone className="w-3.5 h-3.5 text-cyan-500" />
                        <span>联系电话 (Phone)</span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                        {selectedStaff.phone || '+33 6 00 00 00 00'}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">工作联络与应急通信</div>
                    </div>

                    {/* Item 6: Hire Date */}
                    <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        <span>入职日期 (Hire Date)</span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                        {selectedStaff.hireDate || '2024-01-01'}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">正式签约劳动合同起算日</div>
                    </div>
                  </div>

                  {/* Emergency Contact & Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Emergency Contact */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        <HeartHandshake className="w-4 h-4 text-rose-500" />
                        <span>紧急联系人 (Emergency Contact)</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">联系人姓名:</span>
                          <strong className="text-zinc-800 dark:text-zinc-200">{selectedStaff.emergencyContact?.name || '家属联系人'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">关系:</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{selectedStaff.emergencyContact?.relationship || '亲属'}</span>
                        </div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-zinc-400">紧急电话:</span>
                          <strong className="text-rose-600 dark:text-rose-400">{selectedStaff.emergencyContact?.phone || '+33 6 11 22 33 44'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>排班可用性与班次 (Availability)</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                          {selectedStaff.availability || '全职 (早班/晚班弹性轮换)'}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          支持跨店调班支持，遵循欧盟每周法定工时与双休合规保障。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Certifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Skills */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>技能特长 (Skills)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(selectedStaff.skills) && selectedStaff.skills.length > 0 ? (
                          selectedStaff.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium border border-zinc-200 dark:border-zinc-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400">未录入特定技能</span>
                        )}
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2.5">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <span>资质与专业证书 (Certifications)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(selectedStaff.certifications) && selectedStaff.certifications.length > 0 ? (
                          selectedStaff.certifications.map((cert, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                            >
                              <BadgeCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{cert}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400">未录入专业证书</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Credentials Card */}
                  <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850/40 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        <Lock className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        <span>收银终端与后台登录凭证 (Login Credentials)</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                        登录账号: <strong className="text-zinc-900 dark:text-zinc-100">@{selectedStaff.username}</strong> | 快速登录 PIN 码: <strong className="text-amber-600 dark:text-amber-400 font-mono tracking-widest">{selectedStaff.pinCode || '1234'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedStaff.pinCode || '1234');
                          setCopiedPin(true);
                          setTimeout(() => setCopiedPin(false), 2000);
                          showToast(`已复制员工【${selectedStaff.name}】的 PIN 码`);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition flex items-center gap-1"
                      >
                        {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPin ? '已复制' : '复制 PIN 码'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenResetPinModal(selectedStaff)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold transition"
                      >
                        重置密码 / PIN
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Sub-tab 2: Granular RBAC Permissions Matrix */}
              {activeSubTab === 'RBAC' && (
                <div className="flex-1 overflow-y-auto mt-3 space-y-4 pr-1 min-h-0">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs">
                    <div>
                      <span className="font-bold text-indigo-900 dark:text-indigo-200">细粒度权限开关</span>
                      <span className="text-indigo-700/80 dark:text-indigo-300/80 ml-2">
                        点击任意权限卡片即可即时授权或撤销，无需重启即刻生效。
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGrantAllPermissions}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shrink-0"
                    >
                      授予全部权限
                    </button>
                  </div>

                  {permissionCategories.map((group) => {
                    const groupPerms = (permissionsList || []).filter((p) => p.category === group.key);
                    if (groupPerms.length === 0) return null;

                    return (
                      <div key={group.key} className="space-y-2">
                        <h3 className="font-bold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          {group.label}
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                          {groupPerms.map((perm) => {
                            const isGranted =
                              selectedStaff?.role === 'SUPER_ADMIN' ||
                              selectedStaff?.permissions?.includes(perm.id);

                            return (
                              <div
                                key={perm.id}
                                id={`perm_item_${perm.id}`}
                                onClick={() => handleTogglePermission(perm.id)}
                                className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer ${
                                  isGranted
                                    ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850 hover:bg-zinc-100/60 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                <div className="pr-3">
                                  <div className="flex items-center gap-1.5 font-bold text-xs">
                                    <span className={isGranted ? 'text-zinc-900 dark:text-zinc-100' : ''}>
                                      {perm.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-normal">
                                      ({perm.id})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                                    {perm.description}
                                  </p>
                                </div>

                                <div className="pt-0.5">
                                  {isGranted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
              <UserCheck className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-semibold">请在左侧选择员工或点击“创建员工”</p>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Add Employee Modal */}
      {/* ========================================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base">创建新员工档案 (Add Enterprise Employee)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Basic Details */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">1. 基础身份信息 (Basic Info)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">员工姓名 *</label>
                    <input
                      type="text"
                      required
                      placeholder="如: 赵小宇 / Pierre"
                      value={employeeFormData.name}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">工号 / Employee ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="如: EMP-DANUBE-012"
                      value={employeeFormData.employeeNumber}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeNumber: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">登录用户名 *</label>
                    <input
                      type="text"
                      required
                      placeholder="如: cashier_zhao"
                      value={employeeFormData.username}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Roles & Organization */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">2. 岗位、部门与工作地点 (Role & Org)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">岗位角色 (Role)</label>
                    <select
                      value={employeeFormData.role}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value as StaffRole })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      {isSuperAdmin && <option value="SUPER_ADMIN">超级管理员 (Super Admin)</option>}
                      <option value="MERCHANT">连锁管理 (Merchant Boss)</option>
                      <option value="STORE_MANAGER">店长 (Store Manager)</option>
                      <option value="CASHIER">收银吧台 (Cashier)</option>
                      <option value="CHEF">后厨主厨 (Chef)</option>
                      <option value="EXPO_PACKER">Expo 打包叫号 (Expo Packer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">所属部门 (Department)</label>
                    <select
                      value={employeeFormData.department}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">职位名称 (Position)</label>
                    <input
                      type="text"
                      placeholder="如: 资深店长 / 金牌调饮师"
                      value={employeeFormData.position}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">主要所属门店 (Primary Store)</label>
                    <select
                      value={employeeFormData.storeId}
                      onChange={(e) => {
                        const target = selectableStores.find(s => s.id === e.target.value);
                        const newId = e.target.value;
                        const curAccess = employeeFormData.accessibleStoreIds || [];
                        const updatedAccess = curAccess.includes(newId) ? curAccess : [...curAccess, newId];
                        setEmployeeFormData({
                          ...employeeFormData,
                          storeId: newId,
                          accessibleStoreIds: updatedAccess,
                          locationName: target ? target.storeName : '',
                        });
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      {selectableStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.storeName} ({s.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">入职日期 (Hire Date)</label>
                    <input
                      type="date"
                      value={employeeFormData.hireDate}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, hireDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Multi-store assignment for manager or merchant in Add Modal */}
                {(employeeFormData.role === 'STORE_MANAGER' || employeeFormData.role === 'MERCHANT') && (
                  <div className="mt-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        管辖门店分配 (店长可查看勾选门店的营业流水 / Multi-Store Access)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = selectableStores.map((s) => s.id);
                          const isAll = (employeeFormData.accessibleStoreIds || []).length === selectableStores.length;
                          setEmployeeFormData({
                            ...employeeFormData,
                            accessibleStoreIds: isAll ? [selectableStores[0]?.id || 'store_paris_01'] : allIds,
                          });
                        }}
                        className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        {(employeeFormData.accessibleStoreIds || []).length === selectableStores.length ? '取消全选' : '全选所属企业门店'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectableStores.map((store) => {
                        const isChecked = (employeeFormData.accessibleStoreIds || []).includes(store.id);
                        return (
                          <label
                            key={store.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'border-amber-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const cur = employeeFormData.accessibleStoreIds || [];
                                let next: string[];
                                if (e.target.checked) {
                                  next = Array.from(new Set([...cur, store.id]));
                                } else {
                                  next = cur.filter((id) => id !== store.id);
                                  if (next.length === 0) next = [store.id];
                                }
                                setEmployeeFormData({
                                  ...employeeFormData,
                                  accessibleStoreIds: next,
                                  storeId: next.includes(employeeFormData.storeId) ? employeeFormData.storeId : next[0],
                                });
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <div className="flex-1 truncate">
                              <div>{store.storeName}</div>
                              <div className="text-[10px] text-zinc-400 font-normal">{store.city} · {store.currency}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact & Availability */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">3. 通讯联络与排班 (Contact & Availability)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">电子邮箱 (Email)</label>
                    <input
                      type="email"
                      placeholder="employee@danube.com"
                      value={employeeFormData.email}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">联系电话 (Phone)</label>
                    <input
                      type="text"
                      placeholder="+33 6 12 34 56 78"
                      value={employeeFormData.phone}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">排班可用性 (Availability)</label>
                    <input
                      type="text"
                      placeholder="全职 (早晚班轮换)"
                      value={employeeFormData.availability}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, availability: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">4. 紧急联系人 (Emergency Contact)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">紧急联系人姓名</label>
                    <input
                      type="text"
                      placeholder="如: 李女士"
                      value={employeeFormData.emergencyContactName}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyContactName: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">关系 (Relationship)</label>
                    <input
                      type="text"
                      placeholder="配偶 / 父母 / 亲属"
                      value={employeeFormData.emergencyContactRelationship}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyContactRelationship: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">紧急电话</label>
                    <input
                      type="text"
                      placeholder="+33 6 88 99 00 11"
                      value={employeeFormData.emergencyContactPhone}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyContactPhone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Certifications */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">5. 技能与证书 (Skills & Certifications)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">技能特长 (用逗号分隔)</label>
                    <input
                      type="text"
                      placeholder="意式拉花, POS收银, 温控油炸, 三语服务"
                      value={employeeFormData.skillsInput}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, skillsInput: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">资格证书 (用逗号分隔)</label>
                    <input
                      type="text"
                      placeholder="食品安全卫生证 HACCP, SCA初级咖啡师"
                      value={employeeFormData.certificationsInput}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, certificationsInput: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PIN Code & Status */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">6. 初始安全密码 (Security Credentials)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">终端登录 PIN 码 (4位数字)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={employeeFormData.pinCode}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, pinCode: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono tracking-widest text-center font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">账号状态</label>
                    <select
                      value={employeeFormData.status}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, status: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      <option value="ACTIVE">🟢 活跃在职 (ACTIVE)</option>
                      <option value="SUSPENDED">🔴 禁用冻结 (SUSPENDED)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  id="btn_submit_add_staff"
                  className="px-6 py-2 text-xs rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold transition shadow-sm active:scale-98"
                >
                  确认创建员工
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Edit Employee Modal */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base">编辑员工档案【{employeeFormData.name}】</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Basic Details */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">1. 基础身份信息 (Basic Info)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">员工姓名 *</label>
                    <input
                      type="text"
                      required
                      value={employeeFormData.name}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">工号 / Employee ID *</label>
                    <input
                      type="text"
                      required
                      value={employeeFormData.employeeNumber}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeNumber: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">登录用户名 *</label>
                    <input
                      type="text"
                      required
                      value={employeeFormData.username}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Roles & Organization */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">2. 岗位、部门与工作地点 (Role & Org)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">岗位角色 (Role)</label>
                    <select
                      value={employeeFormData.role}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value as StaffRole })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      {isSuperAdmin && <option value="SUPER_ADMIN">超级管理员 (Super Admin)</option>}
                      <option value="MERCHANT">连锁管理 (Merchant Boss)</option>
                      <option value="STORE_MANAGER">店长 (Store Manager)</option>
                      <option value="CASHIER">收银吧台 (Cashier)</option>
                      <option value="CHEF">后厨主厨 (Chef)</option>
                      <option value="EXPO_PACKER">Expo 打包叫号 (Expo Packer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">所属部门 (Department)</label>
                    <select
                      value={employeeFormData.department}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">职位名称 (Position)</label>
                    <input
                      type="text"
                      value={employeeFormData.position}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">主要所属门店 (Primary Store)</label>
                    <select
                      value={employeeFormData.storeId}
                      onChange={(e) => {
                        const target = selectableStores.find(s => s.id === e.target.value);
                        const newId = e.target.value;
                        const curAccess = employeeFormData.accessibleStoreIds || [];
                        const updatedAccess = curAccess.includes(newId) ? curAccess : [...curAccess, newId];
                        setEmployeeFormData({
                          ...employeeFormData,
                          storeId: newId,
                          accessibleStoreIds: updatedAccess,
                          locationName: target ? target.storeName : '',
                        });
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      {selectableStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.storeName} ({s.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">入职日期 (Hire Date)</label>
                    <input
                      type="date"
                      value={employeeFormData.hireDate}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, hireDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Multi-store assignment for manager or merchant in Edit Modal */}
                {(employeeFormData.role === 'STORE_MANAGER' || employeeFormData.role === 'MERCHANT') && (
                  <div className="mt-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        管辖门店分配 (店长可查看勾选门店的营业流水 / Multi-Store Access)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = selectableStores.map((s) => s.id);
                          const isAll = (employeeFormData.accessibleStoreIds || []).length === selectableStores.length;
                          setEmployeeFormData({
                            ...employeeFormData,
                            accessibleStoreIds: isAll ? [selectableStores[0]?.id || 'store_paris_01'] : allIds,
                          });
                        }}
                        className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        {(employeeFormData.accessibleStoreIds || []).length === selectableStores.length ? '取消全选' : '全选所属企业门店'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectableStores.map((store) => {
                        const isChecked = (employeeFormData.accessibleStoreIds || []).includes(store.id);
                        return (
                          <label
                            key={store.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'border-amber-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const cur = employeeFormData.accessibleStoreIds || [];
                                let next: string[];
                                if (e.target.checked) {
                                  next = Array.from(new Set([...cur, store.id]));
                                } else {
                                  next = cur.filter((id) => id !== store.id);
                                  if (next.length === 0) next = [store.id];
                                }
                                setEmployeeFormData({
                                  ...employeeFormData,
                                  accessibleStoreIds: next,
                                  storeId: next.includes(employeeFormData.storeId) ? employeeFormData.storeId : next[0],
                                });
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <div className="flex-1 truncate">
                              <div>{store.storeName}</div>
                              <div className="text-[10px] text-zinc-400 font-normal">{store.city} · {store.currency}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact & Availability */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">3. 通讯联络与排班 (Contact & Availability)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">电子邮箱 (Email)</label>
                    <input
                      type="email"
                      value={employeeFormData.email}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">联系电话 (Phone)</label>
                    <input
                      type="text"
                      value={employeeFormData.phone}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">排班可用性 (Availability)</label>
                    <input
                      type="text"
                      value={employeeFormData.availability}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, availability: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">4. 紧急联系人 (Emergency Contact)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">紧急联系人姓名</label>
                    <input
                      type="text"
                      value={employeeFormData.emergencyContactName}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyContactName: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">关系 (Relationship)</label>
                    <input
                      type="text"
                      value={employeeFormData.emergencyContactRelationship}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyContactRelationship: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">紧急电话</label>
                    <input
                      type="text"
                      value={employeeFormData.emergencyContactPhone}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyContactPhone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Certifications */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">5. 技能与证书 (Skills & Certifications)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">技能特长 (用逗号分隔)</label>
                    <input
                      type="text"
                      value={employeeFormData.skillsInput}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, skillsInput: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">资格证书 (用逗号分隔)</label>
                    <input
                      type="text"
                      value={employeeFormData.certificationsInput}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, certificationsInput: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2">6. 状态设置 (Status)</h4>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">账号状态</label>
                  <select
                    value={employeeFormData.status}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none"
                  >
                    <option value="ACTIVE">🟢 活跃在职 (ACTIVE)</option>
                    <option value="SUSPENDED">🔴 禁用冻结 (SUSPENDED)</option>
                  </select>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  id="btn_submit_edit_staff"
                  className="px-6 py-2 text-xs rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold transition shadow-sm active:scale-98"
                >
                  保存修改
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Reset PIN / Password Modal */}
      {/* ========================================================================= */}
      {isResetPinOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">重置员工登录 PIN 码</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPinOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">员工姓名:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{selectedStaff.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">登录账号:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">@{selectedStaff.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">工号:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedStaff.employeeNumber || 'EMP-N/A'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    新登录 PIN 码 (4-6 位数字)
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetPinValue(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>随机生成</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetPinValue}
                  onChange={(e) => setResetPinValue(e.target.value)}
                  className="w-full text-lg px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                重置后，该员工在 POS 吧台、KDS 后厨及管理端登录时需使用此新 PIN 码。
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsResetPinOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  id="btn_confirm_reset_pin"
                  className="px-5 py-2 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-sm active:scale-98"
                >
                  确认重置 PIN 码
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Delete Confirm Modal */}
      {/* ========================================================================= */}
      {isDeleteConfirmOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base">注销 / 删除员工账号</h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              确定要永久注销并删除员工【<strong>{selectedStaff.name}</strong>】(工号: {selectedStaff.employeeNumber || selectedStaff.username}) 吗？删除后此员工将无法继续登录收银或后台系统。
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
              >
                取消
              </button>
              <button
                type="button"
                id="btn_confirm_delete_staff"
                onClick={handleDeleteStaffSubmit}
                className="px-4 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm active:scale-98"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
