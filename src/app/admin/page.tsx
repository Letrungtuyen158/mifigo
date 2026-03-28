"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchPhoneNumbers,
  fetchPhoneStats,
  importPhoneNumbersFromFile,
  exportPhoneNumbers,
  markPhoneNumberSold,
  loginUser,
  changeOwnPassword,
  createSim,
  updateSim,
  deleteSim,
  downloadSimImportTemplate,
  fetchAllOrders,
  CATEGORY_OPTIONS,
  getCategoryLabel,
  type SimWritePayload,
  type PhoneNumberItem,
  type PhoneStatus,
  AuthError,
} from "@/lib/phoneSim";

type AdminTab = "all" | PhoneStatus;

type AdminRole = "admin" | "staff";

interface AdminUser {
  id: string;
  name: string;
  role: AdminRole;
}

interface PageState {
  items: PhoneNumberItem[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 50;
const CARRIERS = [
  "MobiFone",
  "Viettel",
  "VinaPhone",
  "Vietnamobile",
  "Gmobile",
  "iTel",
  "Reddi (Wintel)",
  "Digitel",
  "FPT",
  "CMC",
] as const;
const MOCK_ADMIN: AdminUser = {
  id: "admin-1",
  name: "Super Admin",
  role: "admin",
};

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("all");
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [simTypeFilter, setSimTypeFilter] = useState<"all" | "prepaid" | "postpaid">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [state, setState] = useState<PageState>({
    items: [],
    isLoading: true,
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  const [stats, setStats] = useState<{
    available: number;
    reserved: number;
    sold: number;
    expiringSoon: number;
  } | null>(null);

  const [showCreateSim, setShowCreateSim] = useState(false);
  const [newSim, setNewSim] = useState<SimWritePayload>({
    phoneNumber: "",
    price: 0,
    carrier: "",
    note: "",
    simType: undefined,
    category: "",
  });
  const [isSavingSim, setIsSavingSim] = useState(false);
  const [editingSim, setEditingSim] = useState<PhoneNumberItem | null>(null);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState("");
  const [editingStatus, setEditingStatus] = useState<PhoneStatus>("available");
  const [editingPrice, setEditingPrice] = useState<number | undefined>(undefined);
  const [editingCarrier, setEditingCarrier] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [editingSimType, setEditingSimType] = useState<
    "prepaid" | "postpaid" | "none"
  >("none");
  const [editingCategory, setEditingCategory] = useState("");
  const [isUpdatingSim, setIsUpdatingSim] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePwNew, setChangePwNew] = useState("");
  const [changePwConfirm, setChangePwConfirm] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(state.total / state.pageSize)),
    [state.total, state.pageSize]
  );

  /** Chỉ admin thấy cột Sửa / Đánh dấu / Xoá; staff chỉ xem danh sách. */
  const showSimActionColumn = admin?.role === "admin";
  const simTableColSpan = showSimActionColumn ? 8 : 7;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("admin_user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<AdminUser> & { id?: string };
      if (parsed?.id) {
        setAdmin({
          id: parsed.id,
          name: parsed.name ?? "",
          role: parsed.role === "staff" ? "staff" : "admin",
        });
      }
    } catch {
      window.localStorage.removeItem("admin_user");
    }
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      setAdmin(null);
      setShowLogin(true);
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    };
    if (typeof window === "undefined") return;
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, []);

  useEffect(() => {
    if (!admin) return;
    void loadData(1, activeTab, search);
    void (async () => {
      try {
        const orders = await fetchAllOrders();
        setPendingOrderCount(
          orders.filter((o) => o.status === "pending").length
        );
      } catch (error) {
        if (error instanceof AuthError) return;
        setPendingOrderCount(0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  async function loadData(page: number, tab: AdminTab, keyword: string) {
    setState((prev) => ({ ...prev, isLoading: true }));

    const statusFilter: PhoneStatus | undefined =
      tab === "all" ? undefined : tab;

    try {
      const [listRes, statsRes] = await Promise.all([
      fetchPhoneNumbers({
        page,
        pageSize: PAGE_SIZE,
        filters: {
          status: statusFilter,
          last4: keyword || undefined,
          carrier: carrierFilter || undefined,
          simType:
            simTypeFilter === "all"
              ? undefined
              : (simTypeFilter as "prepaid" | "postpaid"),
          minPrice: minPrice ? Number(minPrice) || undefined : undefined,
          maxPrice: maxPrice ? Number(maxPrice) || undefined : undefined,
          category: categoryFilter || undefined,
        },
      }),
      fetchPhoneStats(
        statusFilter
          ? {
              status: statusFilter,
            }
          : undefined
      ),
    ]);

    setState({
      items: listRes.items,
      isLoading: false,
      page: listRes.page,
      pageSize: listRes.pageSize,
      total: listRes.total,
    });
    setStats(statsRes);
    } catch (error) {
      if (error instanceof AuthError) return;
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu.");
    }
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    void loadData(nextPage, activeTab, search);
  }

  function handleChangeTab(tab: AdminTab) {
    setActiveTab(tab);
    void loadData(1, tab, search);
  }

  function handleSearch() {
    void loadData(1, activeTab, search);
  }

  async function handleMarkSold(item: PhoneNumberItem) {
    try {
      const updated = await markPhoneNumberSold(item.id);
      setState((prev) => ({
        ...prev,
        items: prev.items.map((p) =>
          p.number === updated.number ? updated : p
        ),
      }));
      toast.success(`Đã đánh dấu bán: ${updated.number}`);
    } catch (error) {
      console.error(error);
      if (error instanceof AuthError) return;
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đánh dấu đã bán."
      );
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const promise = importPhoneNumbersFromFile(file);
      toast.promise(promise, {
        loading: "Đang import danh sách số...",
        success: (res) =>
          `Import xong ${res.imported.toLocaleString("vi-VN")} số`,
        error: (err) =>
          err instanceof Error ? err.message : "Import thất bại.",
      });

      await promise;
      void loadData(1, activeTab, search);
    } finally {
      e.target.value = "";
    }
  }

  async function handleExport() {
    try {
      const promise = exportPhoneNumbers();
      toast.promise(promise, {
        loading: "Đang chuẩn bị file export...",
        success: "Đã export danh sách (mock). Gắn API thật để tải file.",
        error: (err) =>
          err instanceof Error ? err.message : "Export thất bại.",
      });
      await promise;
    } catch (error) {
      console.error(error);
      if (error instanceof AuthError) return;
    }
  }

  function handleLogin() {
    if (!loginUsername || !loginPassword) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    void (async () => {
      try {
        const { token, user } = await loginUser(loginUsername.trim(), loginPassword);
        if (user.role !== "admin" && user.role !== "staff") {
          toast.error("Tài khoản này không có quyền truy cập trang quản trị.");
          return;
        }
        const adminUser: AdminUser = {
          id: user.id,
          name: user.username || user.email,
          role: user.role === "staff" ? "staff" : "admin",
        };
        setAdmin(adminUser);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("sim_token", token);
          window.localStorage.setItem("admin_user", JSON.stringify(adminUser));
        }
        setShowLogin(false);
        setLoginUsername("");
        setLoginPassword("");
        toast.success("Đăng nhập admin thành công.");
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại."
        );
      }
    })();
  }

  function requireLogin(action: () => void) {
    if (!admin) {
      setShowLogin(true);
      return;
    }
    action();
  }

  function openChangePasswordModal() {
    setChangePwNew("");
    setChangePwConfirm("");
    setShowChangePassword(true);
  }

  function handleSubmitChangePassword() {
    if (!changePwNew.trim() || changePwNew.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (changePwNew !== changePwConfirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    void (async () => {
      setIsChangingPassword(true);
      try {
        await changeOwnPassword(changePwNew);
        toast.success("Đã đổi mật khẩu thành công.");
        setShowChangePassword(false);
        setChangePwNew("");
        setChangePwConfirm("");
      } catch (error) {
        console.error(error);
        if (error instanceof AuthError) return;
        toast.error(
          error instanceof Error ? error.message : "Không thể đổi mật khẩu."
        );
      } finally {
        setIsChangingPassword(false);
      }
    })();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4 lg:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl">
              Admin quản lý số
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {admin ? (
              <>
                {/* Desktop: links + user + logout */}
                <Link
                  href="/admin/orders"
                  className="relative hidden items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
                >
                  <span>Quản lý order</span>
                  {pendingOrderCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                      {pendingOrderCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/reports"
                  className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
                >
                  Báo cáo
                </Link>
                <Link
                  href="/admin/users"
                  className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
                >
                  Người dùng
                </Link>
                <Link
                  href="/admin/logo"
                  className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
                >
                  Cài đặt 
                </Link>
                <button
                  type="button"
                  onClick={openChangePasswordModal}
                  className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
                >
                  Đổi mật khẩu
                </button>
                <div className="hidden text-right text-sm sm:block">
                  <div className="font-medium text-slate-900">
                    {admin.name}
                  </div>
                  <div className="text-slate-500 text-xs">
                    Quyền:{" "}
                    {admin.role === "admin"
                      ? "Quản trị viên"
                      : "Nhân viên"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdmin(null);
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("admin_user");
                    }
                  }}
                  className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
                >
                  Đăng xuất
                </button>
                {/* Mobile: hamburger menu */}
                <div className="relative sm:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((o) => !o)}
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                    aria-label="Menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  {mobileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30 bg-black/20"
                        aria-hidden="true"
                        onClick={() => setMobileMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-40 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                        <Link
                          href="/admin/orders"
                          onClick={() => setMobileMenuOpen(false)}
                          className="relative flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Quản lý order
                          {pendingOrderCount > 0 && (
                            <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                              {pendingOrderCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/admin/reports"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Báo cáo
                        </Link>
                        <Link
                          href="/admin/users"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Người dùng
                        </Link>
                        <Link
                          href="/admin/logo"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Cài đặt 
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            openChangePasswordModal();
                          }}
                          className="flex w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Đổi mật khẩu
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <div className="px-4 py-2 text-xs text-slate-500">
                          <div className="font-medium text-slate-800">{admin.name}</div>
                          <div className="mt-0.5">
                            {admin.role === "admin"
                              ? "Quản trị viên"
                              : "Nhân viên"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setAdmin(null);
                            if (typeof window !== "undefined") {
                              window.localStorage.removeItem("admin_user");
                            }
                          }}
                          className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-black"
              >
                Đăng nhập admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
        {!admin ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Vui lòng đăng nhập admin
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Trang quản trị chỉ dành cho tài khoản có quyền admin. Hãy đăng
                nhập để xem danh sách số, thống kê và thao tác bán hàng.
              </p>
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
              >
                Đăng nhập admin
              </button>
            </div>
          </div>
        ) : (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Đang trống"
                value={stats?.available ?? 0}
                color="emerald"
              />
              <StatCard
                label="Giữ chỗ"
                value={stats?.reserved ?? 0}
                color="amber"
                subtitle={
                  stats?.expiringSoon
                    ? `${stats.expiringSoon.toLocaleString(
                        "vi-VN"
                      )} sắp hết hạn`
                    : undefined
                }
              />
              <StatCard
                label="Đã bán"
                value={stats?.sold ?? 0}
                color="slate"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => requireLogin(() => setShowCreateSim(true))}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Thêm SIM mới
              </button>
              <button
                type="button"
                onClick={() =>
                  requireLogin(async () => {
                    try {
                      await downloadSimImportTemplate();
                    } catch (error) {
                      console.error(error);
                      if (error instanceof AuthError) return;
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Không thể tải file mẫu. Vui lòng thử lại."
                      );
                    }
                  })
                }
                className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 md:inline-flex"
              >
                Tải file mẫu
              </button>
              <label className="relative inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <span>Import Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => requireLogin(() => void handleImport(e))}
                />
              </label>
              <button
                type="button"
                onClick={() => requireLogin(() => void handleExport())}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-black"
              >
                Export danh sách
              </button>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 lg:p-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap gap-2 rounded-full bg-slate-50 p-1 text-xs font-medium text-slate-600">
                  <AdminTabButton
                    label="Tất cả"
                    value="all"
                    active={activeTab === "all"}
                    onClick={() => handleChangeTab("all")}
                  />
                  <AdminTabButton
                    label="Đang trống"
                    value="available"
                    active={activeTab === "available"}
                    onClick={() => handleChangeTab("available")}
                  />
                  <AdminTabButton
                    label="Giữ chỗ"
                    value="reserved"
                    active={activeTab === "reserved"}
                    onClick={() => handleChangeTab("reserved")}
                  />
                  <AdminTabButton
                    label="Đã bán"
                    value="sold"
                    active={activeTab === "sold"}
                    onClick={() => handleChangeTab("sold")}
                  />
                </div>
                <div className="mt-3 grid w-full gap-2 md:grid-cols-5">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm 4 số cuối..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:bg-white focus:ring-2"
                  />
                  <select
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-slate-900/10 focus:bg-white focus:ring-2"
                  >
                    <option value="">Nhà mạng</option>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={simTypeFilter}
                    onChange={(e) =>
                      setSimTypeFilter(
                        e.target.value as "all" | "prepaid" | "postpaid"
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-slate-900/10 focus:bg-white focus:ring-2"
                  >
                    <option value="all">Loại sim</option>
                    <option value="prepaid">Trả trước</option>
                    <option value="postpaid">Trả sau</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-slate-900/10 focus:bg-white focus:ring-2"
                  >
                    <option value="">Danh mục</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Giá từ"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:bg-white focus:ring-2"
                    />
                    <input
                      type="number"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="đến"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:bg-white focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black"
                    >
                      Tìm
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="max-h-[520px] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Số
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Giá (VNĐ)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Nhà mạng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Trạng thái
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Loại sim
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Danh mục
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Hết hạn giữ
                        </th>
                        {showSimActionColumn && (
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Hành động
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {state.isLoading ? (
                        <tr>
                          <td
                            colSpan={simTableColSpan}
                            className="px-4 py-12 text-center text-sm text-slate-500"
                          >
                            Đang tải danh sách số...
                          </td>
                        </tr>
                      ) : state.items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={simTableColSpan}
                            className="px-4 py-12 text-center text-sm text-slate-500"
                          >
                            Không có dữ liệu cho bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        state.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                              {item.number}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                              {item.price != null
                                ? item.price.toLocaleString("vi-VN")
                                : "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                              {item.carrier || "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <StatusBadge item={item} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                              {item.simType === "prepaid"
                                ? "Trả trước"
                                : item.simType === "postpaid"
                                ? "Trả sau"
                                : "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                              {getCategoryLabel(item.category)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                              {item.reservedUntil
                                ? new Date(
                                    item.reservedUntil
                                  ).toLocaleString("vi-VN")
                                : "-"}
                            </td>
                            {showSimActionColumn && (
                              <td className="whitespace-nowrap px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  {item.status !== "sold" && (
                                    <button
                                      type="button"
                                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                      onClick={() =>
                                        requireLogin(() => {
                                          setEditingSim(item);
                                          setEditingPhoneNumber(item.number);
                                          setEditingStatus(item.status);
                                          setEditingPrice(item.price);
                                          setEditingCarrier(item.carrier || "");
                                          setEditingNote(item.note || "");
                                          setEditingSimType(
                                            item.simType === "prepaid"
                                              ? "prepaid"
                                              : item.simType === "postpaid"
                                              ? "postpaid"
                                              : "none"
                                          );
                                          setEditingCategory(item.category || "");
                                        })
                                      }
                                    >
                                      Sửa
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={item.status === "sold"}
                                    onClick={() =>
                                      requireLogin(() => {
                                        if (
                                          !window.confirm(
                                            `Đánh dấu SIM ${item.number} là đã bán?`
                                          )
                                        ) {
                                          return;
                                        }
                                        void handleMarkSold(item);
                                      })
                                    }
                                    className="inline-flex items-center rounded-full border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                                  >
                                    Đánh dấu đã bán
                                  </button>
                                  {item.status !== "sold" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        requireLogin(async () => {
                                          if (
                                            !window.confirm(
                                              `Xóa SIM ${item.number}? Hành động này không thể hoàn tác.`
                                            )
                                          ) {
                                            return;
                                          }
                                          try {
                                            await deleteSim(item.id);
                                            setState((prev) => ({
                                              ...prev,
                                              items: prev.items.filter(
                                                (s) => s.id !== item.id
                                              ),
                                              total: Math.max(
                                                0,
                                                prev.total - 1
                                              ),
                                            }));
                                            toast.success(
                                              `Đã xóa SIM ${item.number}.`
                                            );
                                          } catch (error) {
                                            console.error(error);
                                            if (error instanceof AuthError) return;
                                            toast.error(
                                              error instanceof Error
                                                ? error.message
                                                : "Không thể xóa SIM."
                                            );
                                          }
                                        })
                                      }
                                      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                                    >
                                      Xoá
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
                  <div>
                    Trang{" "}
                    <span className="font-semibold text-slate-900">
                      {state.page}
                    </span>{" "}
                    / {totalPages} &middot;{" "}
                    <span className="font-semibold text-slate-900">
                      {state.total.toLocaleString("vi-VN")}
                    </span>{" "}
                    số
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleChangePage(state.page - 1)}
                      disabled={state.page <= 1}
                      className="rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangePage(state.page + 1)}
                      disabled={state.page >= totalPages}
                      className="rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {showChangePassword && admin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  Đổi mật khẩu
                </h2>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  Nhập mật khẩu mới (tối thiểu 6 ký tự).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={changePwNew}
                  onChange={(e) => setChangePwNew(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={changePwConfirm}
                  onChange={(e) => setChangePwConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <button
                type="button"
                disabled={isChangingPassword}
                onClick={handleSubmitChangePassword}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChangingPassword ? "Đang lưu…" : "Lưu mật khẩu mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  Đăng nhập Admin
                </h2>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  Đây là flow đăng nhập mock. Khi có API thật, bạn chỉ cần gắn
                  vào phần xử lý submit bên dưới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Tài khoản
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <button
                type="button"
                onClick={handleLogin}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
              >
                Đăng nhập
              </button>
              <p className="mt-1 text-[11px] text-slate-500">
                Sau khi tích hợp API, bạn có thể kiểm tra quyền admin từ token
                / session và ẩn toàn bộ trang này nếu user không đủ quyền.
              </p>
            </div>
          </div>
        </div>
      )}
      {admin && editingSim && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  Chỉnh sửa SIM
                </h2>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  Cập nhật số SIM hoặc trạng thái bán. Khi đổi sang trạng thái{" "}
                  <span className="font-semibold">Sold</span>, hệ thống sẽ đánh
                  dấu SIM đã bán.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSim(null)}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Số SIM
                </label>
                <input
                  type="text"
                  value={editingPhoneNumber}
                  onChange={(e) => setEditingPhoneNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={editingPrice ?? 0}
                    onChange={(e) =>
                      setEditingPrice(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nhà mạng
                  </label>
                  <select
                    value={editingCarrier}
                    onChange={(e) => setEditingCarrier(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="">Không đặt</option>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Trạng thái
                  </label>
                  <select
                    value={editingStatus}
                    onChange={(e) =>
                      setEditingStatus(e.target.value as PhoneStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="available">Đang trống</option>
                    <option value="sold">Đã bán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Loại sim
                  </label>
                  <select
                    value={editingSimType}
                    onChange={(e) =>
                      setEditingSimType(
                        e.target.value as "prepaid" | "postpaid" | "none"
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="none">Không đặt</option>
                    <option value="prepaid">Trả trước</option>
                    <option value="postpaid">Trả sau</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Danh mục sim
                  </label>
                  <select
                    value={editingCategory}
                    onChange={(e) => setEditingCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="">Không đặt</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <button
                type="button"
                disabled={isUpdatingSim}
                onClick={() =>
                  requireLogin(async () => {
                    if (!editingSim) return;
                    if (!editingPhoneNumber.trim()) {
                      toast.error("Vui lòng nhập số SIM.");
                      return;
                    }
                    if (
                      !window.confirm(
                        `Xác nhận cập nhật SIM ${editingPhoneNumber}?`
                      )
                    ) {
                      return;
                    }
                    setIsUpdatingSim(true);
                    try {
                      const updated = await updateSim(editingSim.id, {
                        phoneNumber: editingPhoneNumber,
                        status:
                          editingStatus === "reserved"
                            ? "available"
                            : editingStatus,
                        price: editingPrice,
                        carrier: editingCarrier || undefined,
                        note: editingNote || undefined,
                        simType:
                          editingSimType === "none"
                            ? undefined
                            : (editingSimType as "prepaid" | "postpaid"),
                        category: editingCategory || undefined,
                      });
                      setState((prev) => ({
                        ...prev,
                        items: prev.items.map((s) =>
                          s.id === updated.id ? updated : s
                        ),
                      }));
                      toast.success("Đã cập nhật SIM.");
                      setEditingSim(null);
                    } catch (error) {
                      console.error(error);
                      if (error instanceof AuthError) return;
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Không thể cập nhật SIM. Vui lòng thử lại."
                      );
                    } finally {
                      setIsUpdatingSim(false);
                    }
                  })
                }
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:opacity-60"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
      {admin && showCreateSim && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  Thêm SIM mới
                </h2>
                
              </div>
              <button
                type="button"
                onClick={() => setShowCreateSim(false)}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Số SIM
                </label>
                <input
                  type="text"
                  value={newSim.phoneNumber}
                  onChange={(e) =>
                    setNewSim((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  placeholder="VD: 0901234567"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newSim.price ?? 0}
                    onChange={(e) =>
                      setNewSim((prev) => ({
                        ...prev,
                        price: Number(e.target.value || 0),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nhà mạng
                  </label>
                  <select
                    value={newSim.carrier ?? ""}
                    onChange={(e) =>
                      setNewSim((prev) => ({
                        ...prev,
                        carrier: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="">Không đặt</option>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Loại sim
                  </label>
                  <select
                    value={newSim.simType ?? ""}
                    onChange={(e) =>
                      setNewSim((prev) => ({
                        ...prev,
                        simType: e.target.value
                          ? (e.target.value as "prepaid" | "postpaid")
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="">Không đặt</option>
                    <option value="prepaid">Trả trước</option>
                    <option value="postpaid">Trả sau</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Danh mục sim
                  </label>
                  <select
                    value={newSim.category ?? ""}
                    onChange={(e) =>
                      setNewSim((prev) => ({
                        ...prev,
                        category: e.target.value || "",
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                  >
                    <option value="">Không đặt</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={newSim.note ?? ""}
                  onChange={(e) =>
                    setNewSim((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Mô tả ngắn, loại số đẹp..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
                />
              </div>
              <button
                type="button"
                disabled={isSavingSim}
                onClick={() =>
                  requireLogin(async () => {
                    if (!newSim.phoneNumber.trim()) {
                      toast.error("Vui lòng nhập số SIM.");
                      return;
                    }
                    if (
                      !window.confirm(
                        `Xác nhận thêm SIM ${newSim.phoneNumber.trim()}?`
                      )
                    ) {
                      return;
                    }
                    setIsSavingSim(true);
                    try {
                      const created = await createSim(newSim);
                      setState((prev) => ({
                        ...prev,
                        items: [created, ...prev.items],
                        total: prev.total + 1,
                      }));
                      toast.success(`Đã tạo SIM ${created.number}.`);
                      setShowCreateSim(false);
                      setNewSim({
                        phoneNumber: "",
                        price: 0,
                        carrier: "",
                        note: "",
                        simType: undefined,
                        category: "",
                      });
                    } catch (error) {
                      console.error(error);
                      if (error instanceof AuthError) return;
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Không thể tạo SIM. Vui lòng thử lại."
                      );
                    } finally {
                      setIsSavingSim(false);
                    }
                  })
                }
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:opacity-60"
              >
                Lưu SIM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  subtitle,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber" | "slate";
  subtitle?: string;
}) {
  const colorClasses =
    color === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : color === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-900 text-slate-50";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {value.toLocaleString("vi-VN")}
          </p>
        </div>
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${colorClasses}`}
        >
          {label[0]}
        </div>
      </div>
      {subtitle && (
        <p className="mt-2 text-[11px] text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

function AdminTabButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: AdminTab;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-[80px] flex-1 items-center justify-center rounded-full px-4 py-1.5 ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:bg-white/60"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ item }: { item: PhoneNumberItem }) {
  const { status } = item;

  if (status === "available") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
        Đang trống
      </span>
    );
  }

  if (status === "reserved") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
        Giữ chỗ 24h
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      Đã bán
    </span>
  );
}

