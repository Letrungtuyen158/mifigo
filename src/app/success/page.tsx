"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type"); // "phone" or "info"
  const message = searchParams.get("message");
  const data = searchParams.get("data");

  const getSuccessMessage = () => {
    if (type === "phone") {
      return {
        title: "Activation Successful! (激活成功!)",
        message:
          message ||
          "You have successfully activated your phone number (您已成功激活手机号码)",
        backText: "Back to Activation (返回激活页面)",
        backUrl: "/vnsky",
      };
    } else if (type === "info") {
      return {
        title: "Update Successful! (更新成功!)",
        message:
          "You have successfully updated your information (您已成功更新信息)",
        backText: "Back to Admin (返回管理页面)",
        backUrl: "/vnsky/admin-info",
      };
    } else {
      return {
        title: "Success! (成功!)",
        message: message || "Operation completed successfully (操作成功完成)",
        backText: "Back to Home (返回首页)",
        backUrl: "/",
      };
    }
  };

  const successData = getSuccessMessage();
  let activationResults = null;

  try {
    if (data) {
      activationResults = JSON.parse(decodeURIComponent(data));
    }
  } catch (error) {
    console.error("Error parsing activation data:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Title */}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
          {successData.title}
        </h1>

        {/* Success Message */}
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          {successData.message}
        </p>

        {/* Detailed Results */}
        {activationResults && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activation Results (激活结果)
            </h3>

            {Array.isArray(activationResults) ? (
              // Single activation result
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-900">
                    Successfully activated: {activationResults[0]?.phoneNumber}
                  </span>
                </div>
              </div>
            ) : activationResults.successful ? (
              // Multiple activation results
              <div className="space-y-3">
                {activationResults.successful.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Successfully Activated (
                      {activationResults.successful.length})
                    </h4>
                    <div className="space-y-1">
                      {activationResults.successful.map(
                        (result: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center text-sm text-green-700"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {result.phoneNumber}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {activationResults.failed &&
                  activationResults.failed.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">
                        Failed to Activate ({activationResults.failed.length})
                      </h4>
                      <div className="space-y-1">
                        {activationResults.failed.map(
                          (result: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center text-sm text-red-700"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
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
                              {result.phoneNumber} - {result.message}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : null}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => router.push(successData.backUrl)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {successData.backText}
        </button>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Thank you for using our service (感谢使用我们的服务)
              </span>
            </div>
            <p className="text-xs text-blue-700 text-center">
              Your request has been processed successfully (您的请求已成功处理)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="animate-pulse">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full mb-6"></div>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-8"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}

