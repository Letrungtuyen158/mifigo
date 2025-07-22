"use client";

import { useState, useEffect } from "react";

interface SimpleCaptchaProps {
  onVerify: (isVerified: boolean) => void;
  resetTrigger?: number;
  className?: string;
}

export default function SimpleCaptcha({
  onVerify,
  resetTrigger = 0,
  className = "",
}: SimpleCaptchaProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ["+", "-", "*"];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let result: number;
    let questionText: string;

    switch (operation) {
      case "+":
        result = num1 + num2;
        questionText = `${num1} + ${num2}`;
        break;
      case "-":
        result = Math.max(num1, num2) - Math.min(num1, num2);
        questionText = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
        break;
      case "*":
        const smallNum1 = Math.floor(Math.random() * 5) + 1;
        const smallNum2 = Math.floor(Math.random() * 5) + 1;
        result = smallNum1 * smallNum2;
        questionText = `${smallNum1} × ${smallNum2}`;
        break;
      default:
        result = num1 + num2;
        questionText = `${num1} + ${num2}`;
    }

    setQuestion(questionText);
    setAnswer(result.toString());
    setUserAnswer("");
    setIsVerified(false);
    setHasAttempted(false);
    onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Reset captcha khi resetTrigger thay đổi
  useEffect(() => {
    if (resetTrigger > 0) {
      setIsEnabled(false);
      setUserAnswer("");
      setIsVerified(false);
      setHasAttempted(false);
      onVerify(false);
      generateCaptcha();
    }
  }, [resetTrigger, onVerify]);

  const handleEnableChange = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setUserAnswer("");
      setIsVerified(false);
      setHasAttempted(false);
      onVerify(false);
    }
  };

  const handleVerify = () => {
    setHasAttempted(true);
    const verified = userAnswer.trim() === answer;
    setIsVerified(verified);
    onVerify(verified);
  };

  const handleRefresh = () => {
    generateCaptcha();
  };

  return (
    <div
      className={`border-2 border-gray-300 rounded-lg p-4 lg:p-6 bg-gray-50 ${className}`}
    >
      {/* Checkbox để enable captcha */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="captcha-enable"
          checked={isEnabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label
          htmlFor="captcha-enable"
          className="ml-2 text-base font-medium text-gray-900"
        >
          Xác minh Captcha
        </label>
      </div>

      {/* Form captcha chỉ hiện khi enabled */}
      {isEnabled && (
        <>
          <div className="flex items-center gap-3 mb-3 lg:mb-4">
            <div className="bg-white border-2 border-dashed border-gray-400 px-4 lg:px-6 py-2 lg:py-3 rounded-lg text-lg lg:text-xl font-bold font-mono text-gray-900">
              {question} = ?
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Làm mới captcha"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Nhập đáp án"
              className="flex-1 px-3 lg:px-4 py-2 lg:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm lg:text-base font-medium text-gray-900 placeholder:text-gray-500 placeholder:font-medium"
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
            />
            <button
              type="button"
              onClick={handleVerify}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm lg:text-base shadow-md"
            >
              Xác minh
            </button>
          </div>
        </>
      )}

      {isVerified && (
        <div className="mt-2 lg:mt-3 flex items-center text-green-700 text-sm lg:text-base font-medium">
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
          Captcha đã được xác minh!
        </div>
      )}

      {hasAttempted && !isVerified && userAnswer.trim() !== "" && (
        <div className="mt-2 lg:mt-3 flex items-center text-red-700 text-sm lg:text-base font-medium">
          <svg
            className="w-4 lg:w-5 h-4 lg:h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Đáp án không chính xác!
        </div>
      )}
    </div>
  );
}

