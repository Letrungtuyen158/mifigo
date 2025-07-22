"use server";

export interface InfoUpdateResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function updateInfoAction(
  prevState: InfoUpdateResult,
  formData: FormData
): Promise<InfoUpdateResult> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const otp = formData.get("otp") as string;
  const apiKey = formData.get("apiKey") as string;

  // Validation
  if (!username?.trim()) {
    return {
      success: false,
      message: "Vui lòng nhập username!",
    };
  }

  if (!password?.trim()) {
    return {
      success: false,
      message: "Vui lòng nhập password!",
    };
  }

  if (!otp?.trim()) {
    return {
      success: false,
      message: "Vui lòng nhập OTP!",
    };
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    return {
      success: false,
      message: "OTP phải là 6 chữ số!",
    };
  }

  if (!apiKey?.trim()) {
    return {
      success: false,
      message: "Vui lòng nhập API Key!",
    };
  }

  try {
    // Call Info API từ server-side - HOÀN TOÀN ẨN
    const apiUrl =
      process.env.INFO_API_URL || "http://localhost:4000/api/user/change-info";

    const requestBody = {
      key: apiKey,
      username: username,
      password: password,
      otp: otp,
    };

    console.log("[Server] Calling Info API:", apiUrl);
    console.log("[Server] Request payload:", requestBody);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mifigo-Admin-Panel/1.0",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[Server] API Response status:", response.status);

    if (!response.ok) {
      console.error(
        "[Server] API Error:",
        response.status,
        response.statusText
      );
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("[Server] API Response:", result);

    if (result.message) {
      return {
        success: true,
        message: result.message,
        data: result,
      };
    } else {
      return {
        success: false,
        message: "Cập nhật thất bại. Vui lòng kiểm tra thông tin!",
      };
    }
  } catch (error) {
    console.error("[Server] Info API error:", error);

    // Simulate cho development (khi chưa có real API)
    if (process.env.NODE_ENV === "development") {
      console.log("[Server] Development mode - simulating API response");

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check credentials (demo)
      if (
        username === "NPPHUNGTINH" &&
        password === "Ht@12345" &&
        otp === "002011"
      ) {
        return {
          success: true,
          message: "Cập nhật thông tin thành công",
          data: { username, updatedAt: new Date().toISOString() },
        };
      } else {
        return {
          success: false,
          message: "Thông tin không chính xác. Vui lòng kiểm tra lại!",
        };
      }
    }

    return {
      success: false,
      message: "Có lỗi xảy ra khi kết nối API. Vui lòng thử lại!",
    };
  }
}

