"use client";

import React, { useState, useTransition, useActionState } from "react";
import toast from "react-hot-toast";
import SimpleCaptchaCheckbox from "./SimpleCaptchaCheckbox";
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

  // Handle captcha verification
  const handleCaptchaVerify = (isVerified: boolean) => {
    setIsCaptchaVerified(isVerified);
  };

  // Handle server action response
  React.useEffect(() => {
    if (state.message) {
      // Show toast based on success/error status
      if (state.success) {
        toast.success(state.message, {
          duration: Infinity, // Keep notification until manually dismissed
          id: "phone-activation-result", // Use same ID to prevent duplicates
        });
      } else {
        toast.error(state.message, {
          duration: Infinity, // Keep notification until manually dismissed
          id: "phone-activation-result", // Use same ID to prevent duplicates
        });
      }

      // Only reset form fields if success, keep form data if error
      if (state.success) {
        setPhoneNumber("");
        // Reset captcha only on success
        setIsCaptchaVerified(false);
        setResetTrigger((prev) => prev + 1);
      }
      // If error, keep the form data and captcha state
    }
  }, [state]);

  const handleFormSubmit = (formData: FormData) => {
    // Dismiss previous notification when submitting new form
    toast.dismiss("phone-activation-result");

    // Reset form immediately when submitting
    setPhoneNumber("");
    setIsCaptchaVerified(false);
    setResetTrigger((prev) => prev + 1);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
            Enter Mobile Number (输入手机号码)
          </h3>
          <p className="text-gray-600 text-sm">
            Enter mobile number on simcard to activate data plan
          </p>
        </div>
      </div>

      <form action={handleFormSubmit} className="space-y-5 lg:space-y-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-base font-bold text-gray-900 mb-3"
          >
            Mobile number (手机号码)
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
            {/* Hidden inputs để pass captcha verification state và token */}
            <input
              type="hidden"
              name="captchaVerified"
              value={isCaptchaVerified.toString()}
            />
          </div>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">
            CAPTCHA verify (我不是机器人)
          </label>
          <SimpleCaptchaCheckbox
            onVerify={handleCaptchaVerify}
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
              Processing...
            </>
          ) : (
            "ACTIVE (立即激活)"
          )}
        </button>
      </form>

      <div className="mt-6 lg:mt-8 text-center">
        <p className="text-xs lg:text-sm font-medium text-gray-600">
          By activating, you agree to our terms of service
          (激活即表示您同意我们的服务条款)
        </p>
      </div>
    </div>
  );
}

