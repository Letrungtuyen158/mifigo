"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  fetchPhoneNumbers,
  createOrder,
  registerUser,
  verifyEmail,
  loginUser,
  fetchPublicSettings,
  type PhoneNumberItem,
  type PhoneStatus,
} from "@/lib/phoneSim";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface PhonePageState {
  items: PhoneNumberItem[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 50;

export default function SimPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authTab, setAuthTab] = useState<"register" | "login">("register");
  const ALLOWED_PREFIXES = ["090", "093", "076", "078"] as const;
  const CARRIERS = [
    "Viettel",
    "MobiFone",
    "VinaPhone",
    "Vietnamobile",
    "Gmobile",
    "iTel",
    "Reddi (Wintel)",
    "Digitel",
    "FPT",
    "CMC",
  ] as const;

  const [filters, setFilters] = useState<{
    prefixes: string[];
    last4: string;
    carrier: string;
    category: string;
    simType: "all" | "prepaid" | "postpaid";
    minPrice: string;
    maxPrice: string;
  }>({
    prefixes: [],
    last4: "",
    carrier: "",
    category: "",
    simType: "all",
    minPrice: "",
    maxPrice: "",
  });

  const [state, setState] = useState<PhonePageState>({
    items: [],
    isLoading: true,
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const [cart, setCart] = useState<PhoneNumberItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutImage, setCheckoutImage] = useState<File | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<string | null>(null);
  const cartSectionRef = useRef<HTMLDivElement | null>(null);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(state.total / state.pageSize)),
    [state.total, state.pageSize]
  );
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sim_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setAuthUser(parsed);
      } catch {
        window.localStorage.removeItem("sim_user");
      }
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const settings = await fetchPublicSettings();
        setLogoUrl(settings.logo);
      } catch {
        setLogoUrl("");
      }
    })();
  }, []);

  useEffect(() => {
    void loadPage(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPage(
    page: number,
    currentFilters: {
      prefixes: string[];
      last4: string;
      carrier: string;
      category: string;
      simType: "all" | "prepaid" | "postpaid";
      minPrice: string;
      maxPrice: string;
    }
  ) {
    setState((prev) => ({ ...prev, isLoading: true }));
    const response = await fetchPhoneNumbers({
      page,
      pageSize: PAGE_SIZE,
      filters: {
        prefix:
          currentFilters.prefixes && currentFilters.prefixes.length > 0
            ? currentFilters.prefixes.join(",")
            : undefined,
        last4: currentFilters.last4 || undefined,
        carrier: currentFilters.carrier || undefined,
        category: currentFilters.category || undefined,
        simType:
          currentFilters.simType === "all"
            ? undefined
            : currentFilters.simType === "prepaid" || currentFilters.simType === "postpaid"
            ? currentFilters.simType
            : undefined,
        minPrice: currentFilters.minPrice
          ? Number(currentFilters.minPrice) || undefined
          : undefined,
        maxPrice: currentFilters.maxPrice
          ? Number(currentFilters.maxPrice) || undefined
          : undefined,
      },
    });
    setState({
      items: response.items,
      isLoading: false,
      page: response.page,
      pageSize: response.pageSize,
      total: response.total,
    });
  }

  function handleAddToCart(item: PhoneNumberItem) {
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }

    setCart((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
    toast.success(`Đã thêm ${item.number} vào giỏ mua`);
  }

  function handleApplyFilters() {
    void loadPage(1, filters);
  }

  function handleClearFilters() {
    const reset = {
      prefixes: [],
      last4: "",
      carrier: "",
      category: "",
      simType: "all" as const,
      minPrice: "",
      maxPrice: "",
    };
    setFilters(reset);
    void loadPage(1, reset);
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    void loadPage(nextPage, filters);
  }

  async function handleSendOtp() {
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Vui lòng nhập email và mật khẩu.");
      return;
    }
    try {
      await registerUser(authEmail.trim(), authPassword);
      setOtpSent(true);
      toast.success("Đã gửi mã xác thực tới email. Vui lòng kiểm tra hộp thư.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi mã xác thực."
      );
    }
  }

  async function handleVerifyOtp() {
    if (!authEmail.trim() || !otpCode.trim()) {
      toast.error("Vui lòng nhập email và mã OTP.");
      return;
    }
    try {
      const result = await verifyEmail(authEmail.trim(), otpCode.trim());
      const { token, user } = result;
      const clientUser: AuthUser = {
        id: user.id,
        name: user.username || user.email,
        email: user.email,
      };
      setAuthUser(clientUser);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sim_user", JSON.stringify(clientUser));
        window.localStorage.setItem("sim_token", token);
      }
      toast.success("Đăng nhập thành công.");
      setShowAuthModal(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Xác thực thất bại. Vui lòng thử lại."
      );
    }
  }

  async function handleLogin() {
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Vui lòng nhập email và mật khẩu.");
      return;
    }
    try {
      const { token, user } = await loginUser(authEmail.trim(), authPassword);
      const clientUser: AuthUser = {
        id: user.id,
        name: user.username || user.email,
        email: user.email,
      };
      setAuthUser(clientUser);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sim_user", JSON.stringify(clientUser));
        window.localStorage.setItem("sim_token", token);
      }
      toast.success("Đăng nhập thành công.");
      setShowAuthModal(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại."
      );
    }
  }

  function handleClickCartIcon() {
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }

    if (cart.length === 0) {
      toast("Giỏ hàng đang trống. Hãy thêm số vào giỏ trước.", {
        icon: "🛒",
      });
      return;
    }

    setShowCheckout(true);
  }

  function handleRemoveFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function handleCheckoutImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCheckoutImage(file);
    if (checkoutPreview) {
      URL.revokeObjectURL(checkoutPreview);
    }
    if (file) {
      setCheckoutPreview(URL.createObjectURL(file));
    } else {
      setCheckoutPreview(null);
    }
  }

  async function handleCreateOrder() {
    if (!authUser) {
      setShowCheckout(false);
      setShowAuthModal(true);
      return;
    }

    if (!cart.length) {
      toast.error("Giỏ hàng đang trống.");
      return;
    }

    if (!checkoutImage) {
      toast.error("Vui lòng tải ảnh chuyển khoản trước khi tạo order.");
      return;
    }

    try {
      const order = await createOrder({
        simIds: cart.map((item) => item.id),
        paymentImage: checkoutImage,
      });

      toast.success(
        `Đã tạo order ${order.id}. Vui lòng chờ admin xác nhận thanh toán.`
      );
      setCart([]);
      setCheckoutImage(null);
      if (checkoutPreview) {
        URL.revokeObjectURL(checkoutPreview);
        setCheckoutPreview(null);
      }
      setShowCheckout(false);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo order. Vui lòng thử lại.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
                Chọn số &amp; mua số đẹp
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClickCartIcon}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span className="sr-only">Mở giỏ hàng</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a1 1 0 0 0 .99.81H19a1 1 0 0 0 .98-.8L22 6H6" />
              </svg>
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
                  {cart.length}
                </span>
              )}
            </button>
            <Link
              href="/sim/orders"
              className="hidden text-xs font-medium text-slate-600 underline-offset-4 hover:underline sm:inline-block"
            >
              Lịch sử order
            </Link>
            {authUser ? (
              <>
                <div className="hidden text-right text-sm sm:block">
                  <div className="font-medium text-slate-900">
                    {authUser.name}
                  </div>
                  <div className="text-slate-500">{authUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthUser(null);
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("sim_user");
                    }
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Đăng ký / Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6 lg:py-8">
        <section className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 lg:p-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 lg:p-4 mt-1">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Lọc theo đầu số
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ALLOWED_PREFIXES.map((p) => {
                  const active = filters.prefixes.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => {
                          const exists = prev.prefixes.includes(p);
                          return {
                            ...prev,
                            prefixes: exists
                              ? prev.prefixes.filter((v) => v !== p)
                              : [...prev.prefixes, p],
                          };
                        })
                      }
                      className={
                        active
                          ? "rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                          : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      }
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              </div>
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Tìm theo 4 số cuối
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="VD: 8888"
                value={filters.last4}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, last4: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:ring-2"
              />
              </div>
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Nhà mạng
              </label>
              <select
                value={filters.carrier}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, carrier: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2"
              >
                <option value="">Tất cả nhà mạng</option>
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              </div>
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Danh mục sim
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2"
              >
                <option value="">Tất cả danh mục</option>
                <option value="Sim Số Tiến">Sim Số Tiến</option>
                <option value="Sim Taxi">Sim Taxi</option>
                <option value="Sim Lộc Phát / Phát Lộc">
                  Sim Lộc Phát / Phát Lộc
                </option>
                <option value="Sim Thần Tài / Ông Địa">
                  Sim Thần Tài / Ông Địa
                </option>
                <option value="Sim Gánh / Đảo">Sim Gánh / Đảo</option>
                <option value="Sim Năm Sinh">Sim Năm Sinh</option>
                <option value="Sim Số Lặp">Sim Số Lặp</option>
                <option value="Sim Đầu Cổ">Sim Đầu Cổ</option>
                <option value="Sim Soi Gương (Đảo)">
                  Sim Soi Gương (Đảo)
                </option>
              </select>
              </div>
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Loại sim
              </label>
              <select
                value={filters.simType}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    simType: e.target.value as "all" | "prepaid" | "postpaid",
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2"
              >
                <option value="all">Tất cả</option>
                <option value="prepaid">Trả trước</option>
                <option value="postpaid">Trả sau</option>
              </select>
              </div>
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Giá từ (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:ring-2"
              />
              </div>
              <div>
              <label className="block text-xs font-medium text-slate-700">
                Giá đến (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:ring-2"
              />
              </div>
              <div className="md:col-span-2 flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-emerald-500/20 hover:bg-emerald-700 hover:shadow-md"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-xs">
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
                      Loại sim
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {state.isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Đang tải dữ liệu số...
                      </td>
                    </tr>
                  ) : state.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Không tìm thấy số phù hợp. Vui lòng thử bộ lọc khác.
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
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                          {item.simType === "prepaid"
                            ? "Trả trước"
                            : item.simType === "postpaid"
                            ? "Trả sau"
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={item.status !== "available"}
                            onClick={() => handleAddToCart(item)}
                            className="inline-flex items-center rounded-full border border-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            Mua
                          </button>
                        </td>
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
        </section>

        <aside className="w-full space-y-4 lg:w-[320px]" ref={cartSectionRef}>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 lg:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
                  Giỏ số của bạn
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Các số đã thêm để mua. Bạn có thể xoá bớt trước khi thanh toán.
                </p>
              </div>
              <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white">
                {cart.length}
              </span>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {cart.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Giỏ đang trống. Hãy bấm &quot;Mua&quot; ở danh sách số để thêm
                  vào đây.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.number}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-[11px] font-medium text-slate-500 hover:text-red-600"
                    >
                      Xoá
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
            >
              Thanh toán giỏ hàng
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-slate-50 shadow-lg lg:p-5">
            <h2 className="text-sm font-semibold lg:text-base">
              Quy trình thanh toán
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Sau khi thêm số vào giỏ, bạn thực hiện chuyển khoản và tải ảnh
              chứng từ trong bước thanh toán. Phần call API order đã được mock
              sẵn để bạn gắn backend thật.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                  1
                </span>
                <span>Chọn số &amp; bấm &quot;Mua&quot; để thêm vào giỏ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                  2
                </span>
                <span>Thanh toán chuyển khoản theo hướng dẫn của bạn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                  3
                </span>
                <span>Tải ảnh chứng từ và tạo order để admin xử lý</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  {authTab === "register" ? "Đăng ký tài khoản" : "Đăng nhập"}
                </h2>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  Sử dụng email và mật khẩu để{" "}
                  {authTab === "register"
                    ? "tạo tài khoản mới."
                    : "đăng nhập vào tài khoản đã có."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setOtpSent(false);
                  setOtpCode("");
                }}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="inline-flex w-full rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    setOtpSent(false);
                    setOtpCode("");
                  }}
                  className={`flex-1 rounded-full px-3 py-1.5 ${
                    authTab === "register"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Đăng ký
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setOtpSent(false);
                    setOtpCode("");
                  }}
                  className={`flex-1 rounded-full px-3 py-1.5 ${
                    authTab === "login"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Đăng nhập
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Nhập email"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:ring-2"
                  />
                </div>

                {authTab === "login" ? (
                  <button
                    type="button"
                    onClick={() => void handleLogin()}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Đăng nhập
                  </button>
                ) : !otpSent ? (
                  <button
                    type="button"
                    onClick={() => void handleSendOtp()}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Gửi OTP xác thực email
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Nhập mã OTP
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Nhập mã 6 số"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] text-slate-900 outline-none ring-emerald-500/20 placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleVerifyOtp()}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Xác nhận &amp; hoàn tất đăng ký
                    </button>
                    <p className="mt-2 text-[11px] text-slate-500">
                      OTP được gửi qua email đăng ký. Sau khi xác thực thành công,
                      bạn sẽ được lưu phiên đăng nhập trên trình duyệt này.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  Thanh toán đơn hàng
                </h2>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  Đây là bước mock tạo order. Khi có API thật, bạn chỉ cần gọi
                  API tạo đơn ở nút &quot;Xác nhận tạo order&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Danh sách số
                </h3>
                <div className="max-h-40 space-y-1.5 overflow-auto rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                  {cart.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Giỏ hàng trống. Đóng popup và thêm số vào giỏ trước.
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-slate-900"
                      >
                        <span>{item.number}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-[11px] text-slate-500 hover:text-red-600"
                        >
                          Xoá
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ảnh chuyển khoản
                </h3>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500 hover:border-emerald-500 hover:bg-emerald-50">
                  <span className="mb-1 font-medium">
                    Tải ảnh chứng từ (PNG, JPG)
                  </span>
                  <span className="text-[11px]">
                    Đây là mock, backend thật sẽ lưu file.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCheckoutImageChange}
                  />
                </label>
                {checkoutPreview && (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <img
                      src={checkoutPreview}
                      alt="Preview"
                      className="h-32 w-full rounded-md object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateOrder}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Xác nhận tạo order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

