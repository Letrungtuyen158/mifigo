"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { fetchOrderById, type PhoneOrder, AuthError } from "@/lib/phoneSim";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<PhoneOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!orderId) return;

    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error(error);
        if (error instanceof AuthError) {
          router.push("/admin");
          return;
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Không tải được thông tin đơn hàng."
        );
        router.push("/admin/orders");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
              Chi tiết đơn hàng (Admin)
            </h1>
            <p className="mt-1 text-sm text-slate-500 lg:text-base">
              Xem thông tin chi tiết đơn và các số SIM trong đơn để xử lý.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            ← Quay về danh sách order
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-4 py-3 lg:px-6">
            <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
              Thông tin đơn hàng
            </h2>
          </div>
          <div className="px-4 py-5 lg:px-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">
                Đang tải thông tin đơn hàng...
              </p>
            ) : !order ? (
              <p className="text-sm text-slate-500">
                Không tìm thấy đơn hàng.
              </p>
            ) : (
              <div className="space-y-4 text-sm text-slate-800">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Mã đơn
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {order.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Email
                    </div>
                    <div className="mt-1 text-slate-700">{order.userEmail ?? order.userId}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Tổng tiền
                    </div>
                    <div className="mt-1 text-slate-700">
                      {typeof order.totalPrice === "number"
                        ? `${order.totalPrice.toLocaleString("vi-VN")} ₫`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Thời gian tạo
                    </div>
                    <div className="mt-1 text-slate-700">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Trạng thái
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                        {order.status === "pending"
                          ? "Chờ xử lý"
                          : order.status === "paid"
                          ? "Đã thanh toán"
                          : "Đã huỷ"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ghi chú
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {order.note ? order.note : "—"}
                  </div>
                </div>

                {order.transferImageUrl && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Ảnh chuyển khoản
                    </div>
                    <div className="mt-2">
                      <a
                        href={order.transferImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 underline hover:text-blue-800"
                      >
                        Mở ảnh trong tab mới
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Danh sách số
                  </div>
                  <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                    {order.phoneNumbers.length === 0 ? (
                      <p className="text-slate-500">
                        Đơn hàng này không chứa số nào.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {order.phoneNumbers.map((n) => (
                          <li key={n} className="flex items-center justify-between">
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

