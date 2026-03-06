"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { fetchSalesReport, type SalesReportResult, AuthError } from "@/lib/phoneSim";

function formatDateForInput(iso: string) {
  return iso.slice(0, 10);
}

function getDefaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return {
    from: formatDateForInput(from.toISOString()),
    to: formatDateForInput(to.toISOString()),
  };
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<SalesReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  const loadReport = useCallback(async (from: string, to: string) => {
    if (!from || !to) return;
    setIsLoading(true);
    try {
      const data = await fetchSalesReport({ from, to });
      setReport(data);
    } catch (err) {
      console.error(err);
      if (err instanceof AuthError) return;
      toast.error(
        err instanceof Error ? err.message : "Không tải được báo cáo doanh thu."
      );
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { from, to } = getDefaultRange();
    setDateFrom(from);
    setDateTo(to);
    void loadReport(from, to);
  }, [loadReport]);

  function handleApplyRange() {
    if (!dateFrom || !dateTo) {
      toast.error("Chọn khoảng từ ngày - đến ngày.");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Từ ngày phải trước đến ngày.");
      return;
    }
    void loadReport(dateFrom, dateTo);
  }

  // Hỗ trợ cả format mới (summary + series) và format cũ (totalRevenue + dailyRevenue)
  const totalRevenue = report?.summary?.totalRevenue ?? report?.totalRevenue ?? 0;
  const orderCount = report?.summary?.totalOrders ?? report?.orderCount ?? 0;
  const totalManualSims = report?.summary?.totalManualSims ?? 0;
  const changePercent = report?.changePercent ?? null;
  const chartData =
    report?.series?.map((s) => ({
      date: s.period.slice(0, 10),
      revenue: s.revenue,
      orderCount: s.orderCount ?? 0,
    })) ??
    report?.dailyRevenue ??
    [];

  const maxDailyRevenue =
    chartData.length &&
    Math.max(...chartData.map((d) => d.revenue), 1);

  // Trục Y theo triệu (Tr): khi tổng chỉ 200k thì không hiện 1Tr, dùng thang nhỏ (vd 0→0,5Tr)
  const maxRevenue = Math.max(maxDailyRevenue, totalRevenue, 1);
  const revenueTr = maxRevenue / 1_000_000;
  let yMaxTr: number;
  const yTicks: number[] = [0];
  if (revenueTr <= 0) {
    yMaxTr = 0.2;
    yTicks.push(0.1, 0.2);
  } else if (revenueTr <= 0.5) {
    yMaxTr = 0.5;
    yTicks.push(0.25, 0.5);
  } else if (revenueTr <= 1) {
    yMaxTr = 1;
    yTicks.push(0.5, 1);
  } else if (revenueTr <= 10) {
    yMaxTr = Math.ceil(revenueTr);
    for (let tr = 1; tr <= yMaxTr; tr++) yTicks.push(tr);
  } else {
    yMaxTr = Math.ceil(revenueTr / 10) * 10;
    for (let tr = 10; tr <= yMaxTr; tr += 10) yTicks.push(tr);
  }
  const yTicksUnique = [...new Set(yTicks)].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              aria-label="Quay lại"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
                Báo cáo
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Doanh thu và đơn hàng theo kỳ
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
        <section className="space-y-5">
          {/* Tabs: BÁN HÀNG (active), KHO, TÀI CHÍNH */}
     

          {/* Date range + Chi nhánh */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm text-slate-900 outline-none"
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm text-slate-900 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyRange}
              disabled={isLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              Áp dụng
            </button>
            <span className="text-sm text-slate-500">Chi nhánh mặc định</span>
          </div>

          {/* Revenue card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Doanh thu
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 lg:text-3xl">
                  {isLoading ? "..." : totalRevenue.toLocaleString("vi-VN")}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {orderCount} đơn hàng
                    {totalManualSims > 0 ? ` · ${totalManualSims} sim nhập tay` : ""}
                  </span>
                {changePercent != null && (
                  <p
                    className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${
                      changePercent >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {changePercent >= 0 ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    )}
                    {changePercent >= 0 ? "+" : ""}
                    {changePercent}%
                  </p>
                )}
                </div>
              </div>
              <Link
                href="/admin/orders"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Xem chi tiết"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Bar chart - có trục Y (0 → XTr), trục X (ngày), cột tỷ lệ đúng */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            {isLoading ? (
              <div className="flex h-64 w-full items-center justify-center text-slate-400">
                Đang tải biểu đồ...
              </div>
            ) : chartData.length ? (
              <div className="flex gap-2">
                {/* Trục Y: 60Tr ... 10Tr, 0 */}
                <div className="flex flex-col justify-between pb-6 text-right text-[10px] font-medium text-slate-500 sm:text-xs">
                  {[...yTicksUnique].reverse().map((tr) => (
                    <span key={tr}>{tr === 0 ? "0" : `${tr}Tr`}</span>
                  ))}
                </div>
                {/* Vùng biểu đồ + grid + cột */}
                <div className="flex flex-1 min-w-0 flex-col">
                  <div
                    className="relative flex flex-1 flex-col justify-end gap-0"
                    style={{ height: 200 }}
                  >
                    {/* Grid ngang (nền) */}
                    {yTicksUnique.slice(0, -1).map((tr, i) => (
                      <div
                        key={tr}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{
                          bottom: `${(tr / yMaxTr) * 100}%`,
                        }}
                      />
                    ))}
                    {/* Cột theo ngày: chiều cao tính theo pixel từ trục Y để mỗi cột đúng tỷ lệ */}
                    <div
                      className="relative flex w-full items-end gap-1 sm:gap-2"
                      style={{ height: 200 }}
                    >
                      {chartData.map((day) => {
                        const revenueTr = day.revenue / 1_000_000;
                        const pct =
                          yMaxTr > 0
                            ? Math.min(100, (revenueTr / yMaxTr) * 100)
                            : 0;
                        const barHeightPx = pct > 0 ? Math.max(8, (pct / 100) * 200) : 0;
                        return (
                          <div
                            key={day.date}
                            className="flex flex-1 flex-col items-center justify-end"
                            style={{ height: 200 }}
                          >
                            <div
                              className="w-full min-w-0 rounded-t bg-blue-500 transition-all"
                              style={{
                                height: barHeightPx,
                              }}
                              title={`${day.date}: ${day.revenue.toLocaleString("vi-VN")}đ`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Trục X: nhãn ngày */}
                  <div className="mt-1 flex justify-between gap-1 sm:gap-2">
                    {chartData.map((day) => (
                      <span
                        key={day.date}
                        className="flex-1 truncate text-center text-[10px] text-slate-500 sm:text-xs"
                      >
                        {new Date(day.date + "T12:00:00").toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 w-full items-center justify-center text-slate-400">
                Không có dữ liệu trong kỳ này
              </div>
            )}
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Doanh thu bằng tổng giá trị các đơn hàng giao thành công đã trừ trả hàng.
            </p>
            {/* Chấm phân trang (giống mẫu) */}
            <div className="mt-3 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === 1 ? "bg-slate-400" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* XEM BÁO CÁO CHI TIẾT */}
          {/* <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Xem báo cáo chi tiết
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Báo cáo doanh thu
                  </p>
                  <p className="text-xs text-slate-500">
                    Hiển thị doanh thu của cửa hàng trong kỳ
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Báo cáo lợi nhuận
                  </p>
                  <p className="text-xs text-slate-500">
                    Quản lý lợi nhuận gộp từ việc bán hàng
                  </p>
                </div>
              </Link>
            </div>
          </div> */}
        </section>
      </main>
    </div>
  );
}
