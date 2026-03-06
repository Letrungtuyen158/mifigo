"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { fetchPublicSettings, updateLogo, AuthError } from "@/lib/phoneSim";

export default function AdminLogoPage() {
  const [currentLogo, setCurrentLogo] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
    void (async () => {
      try {
        const settings = await fetchPublicSettings();
        setCurrentLogo(settings.logo);
      } catch {
        // ignore, sẽ hiện toast khi user thao tác
      }
    })();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  }

  async function handleSave() {
    if (!file) {
      toast.error("Vui lòng chọn file logo trước.");
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateLogo({ file });
      setCurrentLogo(result.logo);
      toast.success("Đã cập nhật logo.");
    } catch (error) {
      console.error(error);
      if (error instanceof AuthError) return;
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật logo."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setIsSaving(true);
    try {
      const result = await updateLogo({ clear: true });
      setCurrentLogo(result.logo);
      setFile(null);
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      toast.success("Đã xoá logo.");
    } catch (error) {
      console.error(error);
      if (error instanceof AuthError) return;
      toast.error(
        error instanceof Error ? error.message : "Không thể xoá logo."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
              Cài đặt logo
            </h1>
            <p className="mt-1 text-sm text-slate-500 lg:text-base">
              Upload logo hiển thị ở trang chọn sim.
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
        <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 lg:text-base">
                Logo hiện tại
              </h2>
              {currentLogo ? (
                <div className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Image
                    src={currentLogo}
                    alt="Logo hiện tại"
                    width={160}
                    height={56}
                    className="h-14 w-auto object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Chưa có logo. Trang sim sẽ hiển thị chữ mặc định.
                </p>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Chọn file logo (PNG/JPEG, tối đa 2MB)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-black"
                />
              </div>
              {preview && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-700">
                    Xem trước
                  </p>
                  <div className="inline-flex items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3">
                    <Image
                      src={preview}
                      alt="Logo xem trước"
                      width={160}
                      height={56}
                      className="h-14 w-auto object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Lưu logo
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Xoá logo
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

