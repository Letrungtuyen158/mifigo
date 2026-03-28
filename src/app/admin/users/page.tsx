"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchAdminUsers,
  adminChangeUserPassword,
  getStoredAdminSession,
  type AdminListedUser,
  AuthError,
} from "@/lib/phoneSim";

const PAGE_SIZE = 20;

function roleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "staff":
      return "Nhân viên";
    case "customer":
      return "Khách hàng";
    default:
      return role;
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminListedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [pwUser, setPwUser] = useState<AdminListedUser | null>(null);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [viewerIsStaff, setViewerIsStaff] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (typeof window === "undefined") return;
    setViewerIsStaff(getStoredAdminSession()?.role === "staff");
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      router.push("/admin");
    };
    if (typeof window === "undefined") return;
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, [router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminUsers({
        page,
        limit: PAGE_SIZE,
        search: searchApplied || undefined,
      });
      const hideAdmins = getStoredAdminSession()?.role === "staff";
      const rows = hideAdmins
        ? res.items.filter((u) => u.role !== "admin")
        : res.items;
      setItems(rows);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      if (err instanceof AuthError) return;
      toast.error(
        err instanceof Error ? err.message : "Không tải được danh sách người dùng."
      );
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchApplied]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchApplied(searchInput.trim());
  }

  function handleOpenChangePassword(u: AdminListedUser) {
    setPwUser(u);
    setPwNew("");
    setPwConfirm("");
  }

  function handleSubmitChangePassword() {
    if (!pwUser) return;
    if (!pwNew.trim() || pwNew.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    void (async () => {
      setIsSavingPw(true);
      try {
        await adminChangeUserPassword(pwUser.id, pwNew);
        toast.success("Đã đổi mật khẩu cho người dùng.");
        setPwUser(null);
      } catch (err) {
        console.error(err);
        if (err instanceof AuthError) return;
        toast.error(
          err instanceof Error ? err.message : "Không thể đổi mật khẩu."
        );
      } finally {
        setIsSavingPw(false);
      }
    })();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:py-4 lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl">
                Quản lý người dùng
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm lg:text-base">
                Tìm theo email. Đổi mật khẩu cho tài khoản được chọn.
                {viewerIsStaff ? (
                  <span className="mt-1 block text-slate-600">
                    Tài khoản Admin không hiển thị với nhân viên.
                  </span>
                ) : null}
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
        <form
          onSubmit={handleSearchSubmit}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo email…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2 sm:max-w-md"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black"
          >
            Tìm
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Xác thực email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Đang tải…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Không có người dùng phù hợp.
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {u.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {roleLabel(u.role)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {u.isEmailVerified ? "Đã xác thực" : "Chưa"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenChangePassword(u)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Đổi mật khẩu
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
              <span>
                Trang {page} / {totalPages} · {total.toLocaleString("vi-VN")} tài khoản
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {pwUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 lg:text-lg">
                  Đổi mật khẩu
                </h2>
                <p className="mt-1 text-xs text-slate-500">{pwUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setPwUser(null)}
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
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2"
                />
              </div>
              <button
                type="button"
                disabled={isSavingPw}
                onClick={handleSubmitChangePassword}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {isSavingPw ? "Đang lưu…" : "Lưu mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
