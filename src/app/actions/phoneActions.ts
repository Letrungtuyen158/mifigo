"use server";

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

    const requestBody = {
      phoneNumber,
    };

    console.log("Request URL:", apiUrl);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      // Set infinite timeout
      signal: null,
    });
    console.log(response, 444444444444444);

    // Check if response is ok
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);

      // Try to get error details from response body
      try {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
      } catch (e) {
        console.error("Could not read error response body");
      }

      return {
        success: false,
        message: `Lỗi kết nối: ${response.status} ${response.statusText}`,
      };
    }

    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API returned non-JSON response:", contentType);
      return {
        success: false,
        message: "Lỗi: API trả về dữ liệu không hợp lệ",
      };
    }

    const result = await response.json();
    console.log(result, 3333333333333333);

    // Check for specific success message
    if (result.message === "Kích hoạt gói cước thành công") {
      return {
        success: true,
        message: result.message,
        data: JSON.stringify(result.data),
      };
    } else if (result.success) {
      // Fallback for other success cases
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

