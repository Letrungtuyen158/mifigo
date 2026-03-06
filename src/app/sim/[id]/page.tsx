 "use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { fetchSimById, type PhoneNumberItem, AuthError } from "@/lib/phoneSim";

export default function SimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const simId = typeof params?.id === "string" ? params.id : "";

  const [sim, setSim] = useState<PhoneNumberItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onSessionExpired = () => {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      router.push("/sim");
    };
    if (typeof window === "undefined") return;
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, [router]);

  useEffect(() => {
    if (!simId) return;

    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchSimById(simId);
        setSim(data);
      } catch (error) {
        console.error(error);
        if (error instanceof AuthError) {
          router.push("/sim");
          return;
        }
        toast.error(
          error instanceof Error ? error.message : "Không tải được thông tin SIM."
        );
        router.push("/sim");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [simId, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
              Thông tin SIM
            </h1>
            <p className="mt-1 text-sm text-slate-500 lg:text-base">
              Xem chi tiết số SIM, trạng thái và thời gian giữ.
            </p>
          </div>
          <Link
            href="/sim"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            ← Quay về danh sách SIM
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-4 py-3 lg:px-6">
            <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
              Chi tiết số
            </h2>
          </div>
          <div className="px-4 py-5 lg:px-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">Đang tải dữ liệu SIM...</p>
            ) : !sim ? (
              <p className="text-sm text-slate-500">
                Không tìm thấy thông tin SIM. Có thể số đã bị xoá hoặc bạn không
                có quyền xem.
              </p>
            ) : (
              <div className="space-y-4 text-sm text-slate-800">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Số điện thoại
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {sim.number}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </div>
                  <div className="mt-1">
                    {sim.status === "available" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        Available
                      </span>
                    )}
                    {sim.status === "reserved" && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                        Reserved
                      </span>
                    )}
                    {sim.status === "sold" && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        Sold
                      </span>
                    )}
                  </div>
                </div>
                {sim.reservedUntil && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Giữ đến
                    </div>
                    <div className="mt-1 text-slate-700">
                      {new Date(sim.reservedUntil).toLocaleString("vi-VN")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

