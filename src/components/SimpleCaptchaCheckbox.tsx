"use client";

import { useState, useEffect } from "react";

interface SimpleCaptchaCheckboxProps {
  onVerify: (isVerified: boolean) => void;
  resetTrigger?: number;
  className?: string;
}

export default function SimpleCaptchaCheckbox({
  onVerify,
  resetTrigger = 0,
  className = "",
}: SimpleCaptchaCheckboxProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Reset captcha when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setIsVerified(false);
      onVerify(false);
    }
  }, [resetTrigger, onVerify]);

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      setIsChecking(true);
      // Simulate verification delay for better UX
      setTimeout(() => {
        setIsVerified(true);
        setIsChecking(false);
        onVerify(true);
      }, 800);
    } else {
      setIsVerified(false);
      setIsChecking(false);
      onVerify(false);
    }
  };

  return (
    <div
      className={`border-2 border-gray-300 rounded-lg p-4 lg:p-6 bg-gray-50 ${className}`}
    >
      <div className="space-y-4">
        {/* Main captcha box - giống Google reCAPTCHA */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            {/* Checkbox */}
            <div className="relative">
              {isChecking ? (
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded animate-spin"></div>
              ) : (
                <input
                  type="checkbox"
                  id="simple-captcha"
                  checked={isVerified}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                  className="w-6 h-6 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
              )}
            </div>

            {/* Text */}
            <label
              htmlFor="simple-captcha"
              className="text-base font-medium text-gray-900 cursor-pointer flex-1"
            >
              I am not robot (我不是机器人)
            </label>

            {/* reCAPTCHA-like logo */}
            <div className="flex flex-col items-center text-xs text-gray-500">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Security</span>
              <span>Captcha</span>
            </div>
          </div>
        </div>

        {/* Success message */}
        {isVerified && (
          <div className="flex items-center justify-center text-green-700 text-sm lg:text-base font-medium">
            <svg
              className="w-4 lg:w-5 h-4 lg:h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Successful! (成功的!)
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600 mr-2"
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
            <span className="text-sm font-medium text-blue-900">
              Security and Safety
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-2 text-center">
            Click "I am not robot" to verify (点击"我不是机器人"进行验证)
          </p>
        </div>
      </div>
    </div>
  );
}

