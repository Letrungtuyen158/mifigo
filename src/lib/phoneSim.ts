export type PhoneStatus = "available" | "reserved" | "sold";

export interface PhoneNumberItem {
  id: string;
  number: string;
  status: PhoneStatus;
  reservedUntil?: string;
  reservedByUserId?: string;
}

export interface PhoneFilters {
  prefix?: string;
  last4?: string;
  status?: PhoneStatus;
}

export interface SimWritePayload {
  phoneNumber: string;
  price?: number;
  carrier?: string;
  note?: string;
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
  phoneNumbers: string[];
  transferImageUrl?: string | null;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderParams {
  simIds: string[];
  paymentImage: File;
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
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
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

  return {
    id: String(order._id),
    userId:
      typeof userField === "object" && userField !== null
        ? String(userField._id ?? "")
        : String(userField ?? ""),
    phoneNumbers: sims.map((s: any) => String(s.phoneNumber)),
    transferImageUrl: order.paymentImage ?? null,
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

  if (filters?.last4) {
    query.last4 = filters.last4;
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

  // Áp dụng filter prefix phía FE (BE chưa hỗ trợ prefix)
  const filteredItems =
    filters?.prefix && filters.prefix.trim()
      ? items.filter((item) => item.number.startsWith(filters.prefix!))
      : items;

  return {
    items: filteredItems,
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
  const { simIds, paymentImage } = params;

  if (!simIds.length) {
    throw new Error("Vui lòng chọn ít nhất một SIM.");
  }

  const formData = new FormData();
  formData.append("simIds", JSON.stringify(simIds));
  formData.append("paymentImage", paymentImage);

  type BackendOrderResponse = {
    success: boolean;
    data: any;
  };

  const token = getAuthToken();
  const headers = new Headers();
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
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body && body.message) message = body.message;
    } catch {
      // ignore
    }
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


