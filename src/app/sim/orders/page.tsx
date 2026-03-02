"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchOrdersByUser, fetchMyPurchases, type PhoneOrder } from "@/lib/phoneSim";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<PhoneOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnlyPurchased, setShowOnlyPurchased] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sim_user");
    if (stored) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      setIsLoading(true);
      try {
        const data = showOnlyPurchased
          ? await fetchMyPurchases()
          : await fetchOrdersByUser("me");
        setOrders(data);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [isAuthenticated, showOnlyPurchased]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
              Lịch sử đơn hàng
            </h1>
            <p className="mt-1 text-sm text-slate-500 lg:text-base">
              Xem lại các đơn đặt số đã tạo từ trang mua SIM.
            </p>
          </div>
          <Link
            href="/sim"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            ← Quay về trang mua số
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6 lg:py-8">
        {!isAuthenticated ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Cần đăng nhập để xem lịch sử
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Vui lòng đăng nhập ở trang mua số trước, sau đó quay lại đây để
                xem lịch sử order của bạn.
              </p>
              <Link
                href="/sim"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                ← Quay về trang mua số
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:px-6">
            <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
              {showOnlyPurchased ? "Đơn đã mua" : "Tất cả order của bạn"}
            </h2>
            <button
              type="button"
              onClick={() => setShowOnlyPurchased((prev) => !prev)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {showOnlyPurchased ? "Xem tất cả order" : "Chỉ xem đơn đã mua"}
            </button>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Số đã đặt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Đang tải lịch sử order...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Chưa có đơn hàng nào. Hãy tạo đơn từ trang mua số.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {order.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {order.phoneNumbers.join(", ")}
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

