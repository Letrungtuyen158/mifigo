"use server";

import { redirect } from "next/navigation";

export interface PhoneActivationResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function activatePhoneAction(
  prevState: PhoneActivationResult,
  formData: FormData
): Promise<PhoneActivationResult> {
  const phoneNumber = formData.get("phoneNumber") as string;
  const captchaVerified = formData.get("captchaVerified") as string;

  // Validation
  if (!phoneNumber?.trim()) {
    return {
      success: false,
      message: "Vui lòng nhập số điện thoại!",
    };
  }

  if (captchaVerified !== "true") {
    return {
      success: false,
      message: "Vui lòng hoàn thành xác minh captcha trước!",
    };
  }

  try {
    const apiUrl =
      process.env.BACKEND_API_URL ||
      "http://localhost:4000/api/user/active-phone-number";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
      }),
    });

    const result = await response.json();
    if (result.success) {
      return {
        success: true,
        message: result.message || "Kích hoạt số điện thoại thành công!",
        data: JSON.stringify(result.data),
      };
    } else {
      return {
        success: false,
        message: result.message || "Kích hoạt thất bại. Vui lòng thử lại!",
      };
    }
  } catch (error) {
    console.error("Server-side API error:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra. Vui lòng thử lại!",
    };
  }
}

