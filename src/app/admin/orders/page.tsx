"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAllOrders, updateOrderStatus, type PhoneOrder, AuthError } from "@/lib/phoneSim";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PhoneOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const router = useRouter();

  useEffect(() => {
    const onSessionExpired = () => {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      router.push("/admin");
    };
    if (typeof window === "undefined") return;
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, [router]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchAllOrders();
        setOrders(data);
      } catch (error) {
        if (error instanceof AuthError) return;
        toast.error(
          error instanceof Error ? error.message : "Không tải được danh sách đơn hàng."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  async function handleUpdateStatus(orderId: string, status: "confirmed" | "cancelled") {
    setIsUpdating(orderId);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      toast.success(
        status === "confirmed"
          ? "Đã xác nhận đơn hàng và đánh dấu SIM đã bán."
          : "Đã hủy đơn hàng và trả SIM về trạng thái available."
      );
    } catch (error) {
      console.error(error);
      if (error instanceof AuthError) return;
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái đơn hàng."
      );
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:py-4 lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl">
                  Quản lý đơn hàng
                </h1>
                {pendingCount > 0 && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white sm:px-3 sm:text-xs">
                    {pendingCount} đơn chờ xử lý
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm lg:text-base">
                Xem và xử lý các đơn đặt số: xác nhận thanh toán hoặc huỷ đơn.
              </p>
            </div>
            <Link
              href="/admin"
              className="shrink-0 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 sm:self-center"
            >
              ← Quay về trang admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-4 py-3 lg:px-6">
            <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
              Danh sách order
            </h2>
          </div>
          {/* Mobile: card list */}
          <div className="divide-y divide-slate-100 md:hidden">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Đang tải danh sách order...
              </div>
            ) : orders.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Chưa có đơn hàng nào. Khi người dùng tạo order, dữ liệu sẽ hiển thị tại đây.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2.5 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="min-w-0 flex-1 truncate font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {order.id.slice(-8)}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        order.status === "pending"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                          : order.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status === "pending"
                        ? "Chờ xử lý"
                        : order.status === "paid"
                          ? "Đã thanh toán"
                          : "Đã huỷ"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    <div className="flex flex-wrap gap-x-1.5">
                      <span className="text-slate-500">Email:</span>
                      <span className="min-w-0 truncate text-slate-700">{(order.userEmail ?? order.userId) || "—"}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <span className="text-slate-500">Tổng tiền:</span>
                      <span className="text-slate-700">
                        {typeof order.totalPrice === "number"
                          ? `${order.totalPrice.toLocaleString("vi-VN")} ₫`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <span className="text-slate-500">Ghi chú:</span>
                      <span className="min-w-0 truncate text-slate-700">
                        {order.note ? order.note : "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <span className="text-slate-500">Thời gian:</span>
                      <span className="text-slate-700">{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <span className="text-slate-500">Số đã đặt:</span>
                      <span className="text-slate-700">
                        {order.phoneNumbers.length === 0
                          ? "—"
                          : `${order.phoneNumbers.slice(0, 3).join(", ")}${order.phoneNumbers.length > 3 ? ` (+${order.phoneNumbers.length - 3})` : ""}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5">
                      <span className="text-slate-500">Ảnh chuyển khoản:</span>
                      {order.transferImageUrl ? (
                        <a
                          href={order.transferImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Xem ảnh
                        </a>
                      ) : (
                        <span className="text-slate-500">Chưa upload</span>
                      )}
                    </div>
                  </div>
                  {order.status === "pending" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={() => void handleUpdateStatus(order.id, "confirmed")}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Xác nhận
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={() => void handleUpdateStatus(order.id, "cancelled")}
                        className="rounded-full border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        Huỷ đơn
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* Desktop: table */}
          <div className="max-h-[560px] overflow-auto hidden md:block">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Số đã đặt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ảnh chuyển khoản
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ghi chú
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Đang tải danh sách order...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Chưa có đơn hàng nào. Khi người dùng tạo order, dữ liệu
                      sẽ hiển thị tại đây.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {order.id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {order.userEmail ?? order.userId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {order.phoneNumbers.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {order.transferImageUrl ? (
                          <a
                            href={order.transferImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            Xem ảnh
                          </a>
                        ) : (
                          "Chưa upload"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                        {typeof order.totalPrice === "number"
                          ? `${order.totalPrice.toLocaleString("vi-VN")} ₫`
                          : "—"}
                      </td>
                      <td className="max-w-[260px] px-4 py-3 text-xs text-slate-700">
                        <span className="block truncate">{order.note ? order.note : "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                          {order.status === "pending"
                            ? "Chờ xử lý"
                            : order.status === "paid"
                            ? "Đã thanh toán"
                            : "Đã huỷ"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                        {order.status === "pending" ? (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={isUpdating === order.id}
                              onClick={() =>
                                void handleUpdateStatus(order.id, "confirmed")
                              }
                              className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Xác nhận
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating === order.id}
                              onClick={() =>
                                void handleUpdateStatus(order.id, "cancelled")
                              }
                              className="inline-flex items-center rounded-full border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              Huỷ đơn
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}


