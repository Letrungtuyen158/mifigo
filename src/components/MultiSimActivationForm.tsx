"use client";

import React, { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SimpleCaptchaCheckbox from "./SimpleCaptchaCheckbox";
import {
  activatePhoneAction,
  PhoneActivationResult,
} from "../app/actions/phoneActions";

interface SimInput {
  id: string;
  phoneNumber: string;
}

interface ActivationResult {
  phoneNumber: string;
  success: boolean;
  message: string;
  data?: any;
}

const initialState: PhoneActivationResult = {
  success: false,
  message: "",
};

export default function MultiSimActivationForm() {
  const [simInputs, setSimInputs] = useState<SimInput[]>([
    { id: "1", phoneNumber: "" },
  ]);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(activatePhoneAction, initialState);
  const router = useRouter();

  const handlePhoneChange = (id: string, value: string) => {
    const cleanedValue = value.replace(/[^0-9+]/g, "");
    setSimInputs((prev) =>
      prev.map((sim) =>
        sim.id === id ? { ...sim, phoneNumber: cleanedValue } : sim
      )
    );
  };

  const handleAddSim = () => {
    if (simInputs.length < 20) {
      const newId = (simInputs.length + 1).toString();
      setSimInputs((prev) => [...prev, { id: newId, phoneNumber: "" }]);
    } else {
      toast.error("Maximum 20 SIM cards allowed (最多允许20张SIM卡)");
    }
  };

  const handleRemoveSim = (id: string) => {
    if (simInputs.length > 1) {
      setSimInputs((prev) => prev.filter((sim) => sim.id !== id));
    }
  };

  const handleCaptchaVerify = (isVerified: boolean) => {
    setIsCaptchaVerified(isVerified);
  };

  const activateSingleSim = async (
    phoneNumber: string
  ): Promise<ActivationResult> => {
    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);
      formData.append("captchaVerified", "true"); // We already verified captcha

      // Call server action
      const result = await activatePhoneAction(initialState, formData);

      return {
        phoneNumber,
        success: result.success,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      return {
        phoneNumber,
        success: false,
        message: "Network error",
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCaptchaVerified) {
      toast.error("Please complete CAPTCHA verification (请完成验证码验证)");
      return;
    }

    const validSims = simInputs.filter((sim) => sim.phoneNumber.trim());
    if (validSims.length === 0) {
      toast.error(
        "Please enter at least one phone number (请输入至少一个手机号码)"
      );
      return;
    }

    startTransition(async () => {
      try {
        // Call all server actions in parallel using Promise.all
        const results = await Promise.all(
          validSims.map((sim) => activateSingleSim(sim.phoneNumber))
        );

        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        if (successful.length > 0 && failed.length === 0) {
          // All successful
          router.push(
            `/success?type=phone&message=${encodeURIComponent(
              `Successfully activated ${successful.length} SIM cards`
            )}&data=${encodeURIComponent(JSON.stringify(successful))}`
          );
        } else if (successful.length > 0 && failed.length > 0) {
          // Mixed results
          router.push(
            `/success?type=phone&message=${encodeURIComponent(
              `Activated ${successful.length} SIM cards, ${failed.length} failed`
            )}&data=${encodeURIComponent(
              JSON.stringify({ successful, failed })
            )}`
          );
        } else {
          // All failed
          router.push(
            `/failure?type=phone&message=${encodeURIComponent(
              `Failed to activate ${failed.length} SIM cards`
            )}&data=${encodeURIComponent(JSON.stringify(failed))}`
          );
        }
      } catch (error) {
        toast.error("An error occurred during activation (激活过程中发生错误)");
      }
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
            Multi-SIM Activation (多SIM卡激活)
          </h3>
          <p className="text-gray-600 text-sm">
            Activate multiple SIM cards simultaneously (同时激活多张SIM卡)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
        {/* SIM Inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-base font-bold text-gray-900">
              Mobile Numbers (手机号码) ({simInputs.length}/20)
            </label>
            <button
              type="button"
              onClick={handleAddSim}
              disabled={simInputs.length >= 20}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              + Add SIM
            </button>
          </div>

          {simInputs.map((sim, index) => (
            <div key={sim.id} className="flex items-center space-x-3">
              <div className="flex-1 relative">
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
                  value={sim.phoneNumber}
                  onChange={(e) => handlePhoneChange(sim.id, e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-lg font-medium shadow-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium"
                  placeholder="Enter phone number"
                  disabled={isPending}
                />
              </div>
              {simInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSim(sim.id)}
                  className="px-3 py-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* CAPTCHA */}
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">
            CAPTCHA verify (我不是机器人)
          </label>
          <SimpleCaptchaCheckbox
            onVerify={handleCaptchaVerify}
            className="w-full"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || !isCaptchaVerified}
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
              Activating {simInputs.filter((s) => s.phoneNumber.trim()).length}{" "}
              SIM cards...
            </>
          ) : (
            `ACTIVE ${
              simInputs.filter((s) => s.phoneNumber.trim()).length
            } SIM CARDS (激活${
              simInputs.filter((s) => s.phoneNumber.trim()).length
            }张SIM卡)`
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

