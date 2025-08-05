"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function FailurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type"); // "phone" or "info"
  const message = searchParams.get("message");

  const getFailureMessage = () => {
    if (type === "phone") {
      return {
        title: "Activation Failed! (激活失败!)",
        message:
          "Failed to activate your phone number. Please try again. (激活手机号码失败，请重试)",
        backText: "Back to Activation (返回激活页面)",
        backUrl: "/vnsky",
      };
    } else if (type === "info") {
      return {
        title: "Update Failed! (更新失败!)",
        message:
          "Failed to update your information. Please try again. (更新信息失败，请重试)",
        backText: "Back to Admin (返回管理页面)",
        backUrl: "/vnsky/admin-info",
      };
    } else {
      return {
        title: "Operation Failed! (操作失败!)",
        message:
          message || "Operation failed. Please try again. (操作失败，请重试)",
        backText: "Back to Home (返回首页)",
        backUrl: "/",
      };
    }
  };

  const failureData = getFailureMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Failure Icon */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Failure Title */}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
          {failureData.title}
        </h1>

        {/* Failure Message */}
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          {failureData.message}
        </p>

        {/* Back Button */}
        <button
          onClick={() => router.push(failureData.backUrl)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {failureData.backText}
        </button>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm font-medium text-red-900">
                Please try again (请重试)
              </span>
            </div>
            <p className="text-xs text-red-700 text-center">
              If the problem persists, please contact support
              (如果问题持续存在，请联系支持)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
