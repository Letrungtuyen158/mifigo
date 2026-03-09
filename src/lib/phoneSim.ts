export type PhoneStatus = "available" | "reserved" | "sold";

export interface PhoneNumberItem {
  id: string;
  number: string;
  status: PhoneStatus;
  reservedUntil?: string;
  reservedByUserId?: string;
  price?: number;
  carrier?: string;
  note?: string;
  simType?: "prepaid" | "postpaid" | null;
   category?: string;
}

export interface PhoneFilters {
  prefix?: string;
  last4?: string;
  status?: PhoneStatus;
  carrier?: string;
  category?: string;
  simType?: "prepaid" | "postpaid";
  minPrice?: number;
  maxPrice?: number;
}

export interface PublicSettings {
  logo: string;
  bankAccount: string;
}

export interface SimWritePayload {
  phoneNumber: string;
  price?: number;
  carrier?: string;
  note?: string;
  simType?: "prepaid" | "postpaid";
  category?: string;
}

export const CATEGORY_OPTIONS = [
  { key: "sim_so_tien", label: "Sim Số Tiến" },
  { key: "sim_taxi", label: "Sim Taxi" },
  { key: "sim_loc_phat", label: "Sim Lộc Phát / Phát Lộc" },
  { key: "sim_than_tai_ong_dia", label: "Sim Thần Tài / Ông Địa" },
  { key: "sim_ganh_dao", label: "Sim Gánh / Đảo" },
  { key: "sim_nam_sinh", label: "Sim Năm Sinh" },
  { key: "sim_so_lap", label: "Sim Số Lặp" },
  { key: "sim_dau_co", label: "Sim Đầu Cổ" },
  { key: "sim_soi_guong", label: "Sim Soi Gương (Đảo)" },
] as const;

export function getCategoryLabel(key?: string | null): string {
  if (!key) return "-";
  const found = CATEGORY_OPTIONS.find((c) => c.key === key);
  return found ? found.label : key;
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  type BackendResponse = {
    success: boolean;
    data: {
      logo?: string;
      bankAccount?: string;
    };
  };

  const res = await fetch(`${API_BASE_URL}/settings/public`, {
    method: "GET",
    credentials: "include",
    headers: new Headers({
      "ngrok-skip-browser-warning": "69420",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to load settings (${res.status})`);
  }

  const body = (await res.json()) as BackendResponse;
  return {
    logo: body.data?.logo || "",
    bankAccount: body.data?.bankAccount || "",
  };
}

export async function updateSettings(options: {
  file?: File | null;
  clearLogo?: boolean;
  bankAccount?: string;
}): Promise<PublicSettings> {
  const token = getAuthToken();
  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "69420");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const formData = new FormData();

  if (options.bankAccount != null) {
    formData.append("bankAccount", options.bankAccount);
  }

  if (options.file) {
    formData.append("logo", options.file);
  } else if (options.clearLogo) {
    formData.append("clearLogo", "true");
  }

  type BackendResponse = {
    success: boolean;
    data?: {
      logo?: string;
      bankAccount?: string;
    };
    message?: string;
  };

  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: "PATCH",
    headers,
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const isAuthError = res.status === 401 || res.status === 403;
    if (isAuthError && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("sim_token");
        window.localStorage.removeItem("sim_user");
        window.localStorage.removeItem("admin_user");
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    let message = `Request failed with status ${res.status}`;
    try {
      const err = (await res.json()) as { message?: string };
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    if (isAuthError) throw new AuthError(message);
    throw new Error(message);
  }

  const json = (await res.json()) as BackendResponse;
  return {
    logo: json.data?.logo || "",
    bankAccount: json.data?.bankAccount || "",
  };
}

export async function updateLogo(options: {
  file?: File | null;
  clear?: boolean;
}): Promise<PublicSettings> {
  return updateSettings({ file: options.file, clearLogo: options.clear });
}

export interface PaginatedPhoneResponse {
  items: PhoneNumberItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PhoneStats {
  available: number;
  reserved: number;
  sold: number;
  expiringSoon: number;
}

export type OrderStatus = "pending" | "paid" | "canceled";

export interface PhoneOrder {
  id: string;
  userId: string;
  userEmail?: string | null;
  phoneNumbers: string[];
  transferImageUrl?: string | null;
  totalPrice?: number | null;
  note?: string | null;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderParams {
  simIds: string[];
  paymentImage: File;
  note?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  username?: string | null;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

const API_BASE_URL =
  "https://nonmechanically-nonpedagogic-delcie.ngrok-free.dev/api-mifigo-sim";

/** Lỗi xác thực (401/403): đã clear token và dispatch "auth:session-expired". Caller nên đăng xuất UI, không hiện toast lỗi API. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("sim_token");
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers ?? {});
  headers.set("ngrok-skip-browser-warning", "69420");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...options,
      headers,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const isAuthError = res.status === 401 || res.status === 403;
    if (isAuthError && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("sim_token");
        window.localStorage.removeItem("sim_user");
        window.localStorage.removeItem("admin_user");
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }

    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
    if (isAuthError) throw new AuthError(message);
    throw new Error(message);
  }

  return (await res.json()) as T;
}

function mapSimToPhoneNumberItem(sim: any): PhoneNumberItem {
  const backendStatus: string = sim.status;
  const status: PhoneStatus =
    backendStatus === "pending"
      ? "reserved"
      : backendStatus === "sold"
      ? "sold"
      : "available";

  return {
    id: String(sim._id),
    number: String(sim.phoneNumber),
    status,
    reservedUntil: sim.reservedExpiresAt
      ? new Date(sim.reservedExpiresAt).toISOString()
      : undefined,
    reservedByUserId: sim.reservedBy ? String(sim.reservedBy) : undefined,
    price:
      typeof sim.price === "number"
        ? sim.price
        : sim.price
        ? Number(sim.price)
        : undefined,
    carrier: sim.carrier || undefined,
    note: sim.note || undefined,
    simType: sim.simType || null,
    category: sim.category || undefined,
  };
}

function mapOrderStatusFromBackend(status: string): OrderStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "confirmed":
      return "paid";
    case "cancelled":
    case "expired":
    default:
      return "canceled";
  }
}

function mapOrderFromBackend(order: any): PhoneOrder {
  const userField = order.user;
  const sims = Array.isArray(order.sims) ? order.sims : [];
  const rawTotalPrice =
    order.totalPrice ??
    order.total ??
    order.total_amount ??
    order.totalAmount;
  const parsedTotalPrice =
    typeof rawTotalPrice === "number"
      ? rawTotalPrice
      : rawTotalPrice
      ? Number(rawTotalPrice)
      : null;
  const totalPrice =
    typeof parsedTotalPrice === "number" && Number.isFinite(parsedTotalPrice)
      ? parsedTotalPrice
      : null;
  const note =
    order.note != null
      ? String(order.note)
      : order.customerNote != null
      ? String(order.customerNote)
      : null;

  return {
    id: String(order._id),
    userId:
      typeof userField === "object" && userField !== null
        ? String(userField._id ?? "")
        : String(userField ?? ""),
    userEmail:
      typeof userField === "object" && userField !== null && userField.email != null
        ? String(userField.email)
        : null,
    phoneNumbers: sims.map((s: any) => String(s.phoneNumber)),
    transferImageUrl: order.paymentImage ?? null,
    totalPrice,
    note,
    status: mapOrderStatusFromBackend(order.status),
    createdAt: order.createdAt
      ? new Date(order.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

export async function fetchPhoneNumbers(params: {
  page?: number;
  pageSize?: number;
  filters?: PhoneFilters;
}): Promise<PaginatedPhoneResponse> {
  const { page = 1, pageSize = 50, filters } = params;

  const query: Record<string, unknown> = {
    page,
    limit: pageSize,
  };

  if (filters?.prefix) {
    query.prefix = filters.prefix;
  }
  if (filters?.last4) {
    // BE dùng param `search` cho 4 số cuối / chuỗi tìm kiếm
    query.search = filters.last4;
  }
  if (filters?.carrier) {
    query.carrier = filters.carrier;
  }
  if (filters?.category) {
    query.category = filters.category;
  }
  if (filters?.simType) {
    query.simType = filters.simType;
  }
  if (filters?.minPrice !== undefined) {
    query.minPrice = filters.minPrice;
  }
  if (filters?.maxPrice !== undefined) {
    query.maxPrice = filters.maxPrice;
  }

  if (filters?.status) {
    const status =
      filters.status === "reserved" ? "pending" : (filters.status as string);
    query.status = status;
  }

  const qs = buildQueryString(query);

  type BackendResponse = {
    success: boolean;
    data: any[];
    pagination?: { page: number; limit: number; total: number };
  };

  const res = await apiFetch<BackendResponse>(`/sim${qs}`);

  const items = (res.data ?? []).map(mapSimToPhoneNumberItem);
  const pagination = res.pagination ?? {
    page,
    limit: pageSize,
    total: items.length,
  };

  return {
    items,
    page: pagination.page,
    pageSize: pagination.limit,
    total: pagination.total,
  };
}

export async function reservePhoneNumber(): Promise<PhoneNumberItem> {
  throw new Error(
    "Reserve SIM được xử lý khi tạo đơn hàng trong backend. Không có API riêng cho reserve."
  );
}

export async function markPhoneNumberSold(simId: string): Promise<PhoneNumberItem> {
  type BackendSim = {
    _id: string;
    phoneNumber: string;
    status: string;
    reservedExpiresAt?: string;
    reservedBy?: string;
  };

  type BackendResponse = {
    success: boolean;
    data: BackendSim;
  };

  const body = { status: "sold" };

  const res = await apiFetch<BackendResponse>(`/sim/${simId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return mapSimToPhoneNumberItem(res.data);
}

export async function createSim(payload: SimWritePayload): Promise<PhoneNumberItem> {
  type BackendResponse = {
    success: boolean;
    data: any;
  };

  const res = await apiFetch<BackendResponse>("/sim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return mapSimToPhoneNumberItem(res.data);
}

export async function updateSim(
  id: string,
  payload: Partial<SimWritePayload> & { status?: "available" | "sold" }
): Promise<PhoneNumberItem> {
  type BackendResponse = {
    success: boolean;
    data: any;
  };

  const res = await apiFetch<BackendResponse>(`/sim/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return mapSimToPhoneNumberItem(res.data);
}

export async function deleteSim(id: string): Promise<void> {
  type BackendResponse = {
    success: boolean;
    message?: string;
  };

  await apiFetch<BackendResponse>(`/sim/${id}`, {
    method: "DELETE",
  });
}

export async function importSimsJson(
  sims: SimWritePayload[]
): Promise<{ imported: number; errors?: unknown[] }> {
  type BackendResponse = {
    success: boolean;
    imported: number;
    errors?: unknown[];
  };

  const res = await apiFetch<BackendResponse>("/sim/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sims }),
  });

  return {
    imported: res.imported ?? 0,
    errors: res.errors,
  };
}

export async function downloadSimImportTemplate(): Promise<void> {
  const token = getAuthToken();
  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "69420");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}/sim/import/template`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (typeof window === "undefined") return;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mau_import_sim.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchPhoneStats(
  _filters?: PhoneFilters
): Promise<PhoneStats> {
  type BackendResponse = {
    success: boolean;
    data: {
      sims: {
        total: number;
        available: number;
        pending: number;
        sold: number;
      };
    };
  };

  const res = await apiFetch<BackendResponse>("/admin/analytics");
  const sims = res.data.sims;

  return {
    available: sims.available,
    reserved: sims.pending,
    sold: sims.sold,
    expiringSoon: 0,
  };
}

export interface SalesReportDay {
  date: string;
  revenue: number;
  orderCount: number;
}

/** Format mới từ BE: data.summary + data.series */
export interface SalesReportSeriesItem {
  period: string;
  revenue: number;
  revenueFromOrders?: number;
  revenueFromManual?: number;
  manualSimCount?: number;
  orderCount: number;
}

export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  totalManualSims?: number;
}

export interface SalesReportResult {
  from: string;
  to: string;
  groupBy?: string;
  /** Format mới: dùng summary + series */
  summary?: SalesReportSummary;
  series?: SalesReportSeriesItem[];
  /** Format cũ (fallback) */
  totalRevenue?: number;
  orderCount?: number;
  previousRevenue?: number;
  changePercent?: number | null;
  dailyRevenue?: SalesReportDay[];
}

export async function fetchSalesReport(params?: {
  from?: string;
  to?: string;
}): Promise<SalesReportResult> {
  type BackendResponse = {
    success: boolean;
    data: SalesReportResult;
  };
  const qs = buildQueryString(params ?? {});
  const res = await apiFetch<BackendResponse>(`/admin/analytics/sales-report${qs}`);
  return res.data;
}

export async function fetchReservedNumbersByUser(): Promise<PhoneNumberItem[]> {
  // Chưa có API riêng cho reserved-by-user, để trống tạm thời.
  return [];
}

export async function importPhoneNumbersFromFile(file: File): Promise<{
  imported: number;
  skipped: number;
}> {
  const formData = new FormData();
  formData.append("file", file);

  type BackendResponse = {
    success: boolean;
    imported: number;
    skippedDuplicate?: number;
    errorCount?: number;
  };

  const token = getAuthToken();
  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "69420");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}/sim/import/excel`, {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await res.json()) as BackendResponse;

  return {
    imported: data.imported ?? 0,
    skipped: data.skippedDuplicate ?? data.errorCount ?? 0,
  };
}

export async function exportPhoneNumbers(): Promise<void> {
  const token = getAuthToken();
  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "69420");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(
    `${API_BASE_URL}/sim/export/data?format=csv`,
    {
      method: "GET",
      headers,
      credentials: "include",
    }
  );

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (typeof window === "undefined") return;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sims-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function createOrder(
  params: CreateOrderParams
): Promise<PhoneOrder> {
  const { simIds, paymentImage, note } = params;

  if (!simIds.length) {
    throw new Error("Vui lòng chọn ít nhất một SIM.");
  }

  const formData = new FormData();
  formData.append("simIds", JSON.stringify(simIds));
  formData.append("paymentImage", paymentImage);
  if (note && note.trim()) {
    formData.append("note", note.trim());
  }

  type BackendOrderResponse = {
    success: boolean;
    data: any;
  };

  const token = getAuthToken();
  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "69420");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const isAuthError = res.status === 401 || res.status === 403;
    if (isAuthError && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("sim_token");
        window.localStorage.removeItem("sim_user");
        window.localStorage.removeItem("admin_user");
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }

    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
    if (isAuthError) throw new AuthError(message);
    throw new Error(message);
  }

  const body = (await res.json()) as BackendOrderResponse;
  const backendOrder = body.data;

  return mapOrderFromBackend(backendOrder);
}

export async function fetchOrdersByUser(_userId: string): Promise<PhoneOrder[]> {
  type BackendResponse = {
    success: boolean;
    data: any[];
  };

  const res = await apiFetch<BackendResponse>("/orders");
  return (res.data ?? []).map(mapOrderFromBackend);
}

export async function fetchAllOrders(): Promise<PhoneOrder[]> {
  type BackendResponse = {
    success: boolean;
    data: any[];
  };

  const qs = buildQueryString({ page: 1, limit: 100 });
  const res = await apiFetch<BackendResponse>(`/orders${qs}`);
  return (res.data ?? []).map(mapOrderFromBackend);
}

export async function registerUser(email: string, password: string): Promise<{ email: string }> {
  type BackendResponse = {
    success: boolean;
    message?: string;
    email?: string;
  };

  const body = { email, password };

  const res = await apiFetch<BackendResponse>("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    email: res.email ?? email,
  };
}

export async function verifyEmail(email: string, code: string): Promise<AuthResult> {
  type BackendResponse = {
    success: boolean;
    message?: string;
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
      username?: string | null;
    };
  };

  const res = await apiFetch<BackendResponse>("/auth/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  return {
    token: res.token,
    user: {
      id: res.user.id,
      email: res.user.email,
      role: res.user.role,
      username: res.user.username,
    },
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  type BackendResponse = {
    success: boolean;
    message?: string;
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
      username?: string | null;
    };
  };

  const res = await apiFetch<BackendResponse>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return {
    token: res.token,
    user: {
      id: res.user.id,
      email: res.user.email,
      role: res.user.role,
      username: res.user.username,
    },
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: "confirmed" | "cancelled",
  adminNote?: string
): Promise<PhoneOrder> {
  type BackendResponse = {
    success: boolean;
    data: any;
  };

  const body: Record<string, unknown> = { status };
  if (adminNote != null && adminNote.trim()) {
    body.adminNote = adminNote;
  }

  const res = await apiFetch<BackendResponse>(`/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return mapOrderFromBackend(res.data);
}


// -------- New helpers for detail / my purchases --------

export async function fetchSimById(id: string): Promise<PhoneNumberItem> {
  type BackendResponse = {
    success: boolean;
    data: any;
  };

  const res = await apiFetch<BackendResponse>(`/sim/${id}`);
  return mapSimToPhoneNumberItem(res.data);
}

export async function fetchMyPurchases(): Promise<PhoneOrder[]> {
  type BackendResponse = {
    success: boolean;
    data: any[];
  };

  const res = await apiFetch<BackendResponse>("/orders/my-purchases");
  return (res.data ?? []).map(mapOrderFromBackend);
}

export async function fetchOrderById(id: string): Promise<PhoneOrder> {
  type BackendResponse = {
    success: boolean;
    data: any;
  };

  const res = await apiFetch<BackendResponse>(`/orders/${id}`);
  return mapOrderFromBackend(res.data);
}


