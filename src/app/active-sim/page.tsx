import PhoneActivationForm from "../../components/PhoneActivationForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Header */}
      <div className="text-center mb-8 lg:mb-12">
        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 tracking-tight">
          Mifigo Active UI
        </h1>
        <p className="text-lg lg:text-xl font-medium text-gray-700 mb-6">
          Kích hoạt số điện thoại một cách an toàn và nhanh chóng
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Form - Left Side */}
          <div className="order-1">
            <PhoneActivationForm />
          </div>

          {/* Guide - Right Side */}
          <div className="order-2">
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-lg border border-gray-200 sticky top-8">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Hướng dẫn sử dụng
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Nhập số điện thoại
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Nhập số điện thoại hợp lệ (VD: 0123456789 hoặc
                      +84123456789)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Hoàn thành Captcha
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Giải phép tính toán đơn giản và nhấn "Xác minh"
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Kích hoạt
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Nhấn "Kích hoạt ngay" để gửi yêu cầu đến server
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Nhận kết quả
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Chờ thông báo kết quả thành công hoặc thất bại
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-blue-900">
                      Bảo mật và an toàn
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Captcha giúp bảo vệ hệ thống khỏi các cuộc tấn công tự động
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

