"use client";

import React, { useState, useTransition, useActionState } from "react";
import toast from "react-hot-toast";
import { updateInfoAction, InfoUpdateResult } from "../app/actions/infoActions";

const initialState: InfoUpdateResult = {
  success: false,
  message: "",
};

export default function InfoForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(updateInfoAction, initialState);

  // Handle server action response
  React.useEffect(() => {
    if (state.message) {
      // Always show success toast (green color) for both success and error
      toast.success(state.message);

      // Reset form fields regardless of success or error
      setUsername("");
      setPassword("");
      setOtp("");
      setApiKey("");
    }
  }, [state]);

  const handleFormSubmit = (formData: FormData) => {
    // Reset form immediately when submitting
    setUsername("");
    setPassword("");
    setOtp("");
    setApiKey("");

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-2 sm:mb-3">
          Cập Nhật Thông Tin
        </h2>
        <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-700">
          Dành riêng cho quản trị viên
        </p>
      </div>

      <form
        action={handleFormSubmit}
        className="space-y-4 sm:space-y-5 lg:space-y-6"
      >
        {/* Username Field */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3"
          >
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              className="block w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-base sm:text-lg font-medium shadow-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium"
              disabled={isPending}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password"
              className="block w-full pl-12 pr-12 py-3 sm:py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-base sm:text-lg font-medium shadow-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium"
              disabled={isPending}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              {showPassword ? (
                <svg
                  className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* OTP Field */}
        <div>
          <label
            htmlFor="otp"
            className="block text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3"
          >
            OTP Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="otp"
              name="otp"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="block w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-base sm:text-lg font-medium shadow-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium text-center tracking-widest"
              disabled={isPending}
              maxLength={6}
              pattern="\d{6}"
              required
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Nhập mã OTP 6 chữ số</p>
        </div>

        {/* API Key Field */}
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3"
          >
            Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0V9a2 2 0 00-2-2m0 0a2 2 0 00-2 2v6m0 0V9a2 2 0 012-2m0 0h2m-6 0h2m0 0h2m-8 0h2m-2 0h2"
                />
              </svg>
            </div>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập Key"
              className="block w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-base sm:text-lg font-medium shadow-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium"
              disabled={isPending}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isPending ||
            !username ||
            !password ||
            !otp ||
            otp.length !== 6 ||
            !apiKey
          }
          className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-3 lg:py-4 border border-transparent text-sm sm:text-base lg:text-lg font-bold rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang cập nhật...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Cập Nhật Thông Tin
            </>
          )}
        </button>
      </form>

      <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
        <p className="text-xs sm:text-xs lg:text-sm font-medium text-gray-600">
          🔒 Trang này dành riêng cho quản trị viên
        </p>
      </div>
    </div>
  );
}

