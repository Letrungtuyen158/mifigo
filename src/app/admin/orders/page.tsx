 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllOrders, updateOrderStatus, type PhoneOrder } from "@/lib/phoneSim";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PhoneOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchAllOrders();
        setOrders(data);
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
                Quản lý đơn hàng
              </h1>
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {pendingCount} đơn chờ xử lý
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 lg:text-base">
              Xem và xử lý các đơn đặt số: xác nhận thanh toán hoặc huỷ đơn.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            ← Quay về trang admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-4 py-3 lg:px-6">
            <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
              Danh sách order
            </h2>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User ID
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
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Đang tải danh sách order...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                        {order.userId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {order.phoneNumbers.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {order.transferImageUrl
                          ? `File: ${order.transferImageUrl}`
                          : "Chưa upload"}
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


