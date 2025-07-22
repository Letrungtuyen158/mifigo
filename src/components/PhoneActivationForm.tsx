"use client";

import React, { useState, useTransition, useActionState } from "react";
import toast from "react-hot-toast";
import SimpleCaptcha from "./SimpleCaptcha";
import {
  activatePhoneAction,
  PhoneActivationResult,
} from "../app/actions/phoneActions";

const initialState: PhoneActivationResult = {
  success: false,
  message: "",
};

export default function PhoneActivationForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(activatePhoneAction, initialState);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9+]/g, "");
    setPhoneNumber(value);
  };

  // Handle server action response
  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        setPhoneNumber("");
      } else {
        toast.error(state.message);
      }

      // Reset captcha sau khi submit (dù thành công hay thất bại)
      setIsCaptchaVerified(false);
      setResetTrigger((prev) => prev + 1);
    }
  }, [state]);

  const handleFormSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-6 lg:p-8">
      <div className="text-center mb-6 lg:mb-8">
        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">
          Kích hoạt số điện thoại
        </h2>
        <p className="text-base lg:text-lg font-medium text-gray-700">
          Nhập số điện thoại của bạn để kích hoạt dịch vụ
        </p>
      </div>

      <form action={handleFormSubmit} className="space-y-5 lg:space-y-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-base font-bold text-gray-900 mb-3"
          >
            Số điện thoại
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <input
              type="tel"
              id="phone"
              name="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-lg font-medium shadow-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium"
              disabled={isPending}
            />
            {/* Hidden input để pass captcha verification state */}
            <input
              type="hidden"
              name="captchaVerified"
              value={isCaptchaVerified.toString()}
            />
          </div>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">
            Xác minh Captcha
          </label>
          <SimpleCaptcha
            onVerify={setIsCaptchaVerified}
            resetTrigger={resetTrigger}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !isCaptchaVerified || !phoneNumber}
          className="w-full flex items-center justify-center px-6 py-3 lg:py-4 border border-transparent text-base lg:text-lg font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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
              Đang xử lý...
            </>
          ) : (
            "Kích hoạt ngay"
          )}
        </button>
      </form>

      <div className="mt-6 lg:mt-8 text-center">
        <p className="text-xs lg:text-sm font-medium text-gray-600">
          Bằng cách kích hoạt, bạn đồng ý với các điều khoản dịch vụ của chúng
          tôi
        </p>
      </div>
    </div>
  );
}

