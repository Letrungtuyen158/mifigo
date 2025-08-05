import MultiSimActivationForm from "../../components/MultiSimActivationForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Header */}
      <div className="text-center mb-8 lg:mb-12">
        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 tracking-tight">
          Mifigo Active Data Plan (开通5G套餐)
        </h1>
        <p className="text-lg lg:text-xl font-medium text-gray-700 mb-6">
          Make simple life for travelling (让旅行生活更简单)
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Form - Left Side */}
          <div className="order-1">
            <MultiSimActivationForm />
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
                  Instructions (指示)
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Enter mobile numbers (输入手机号码)
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Enter mobile numbers for multiple SIM cards
                      (输入多张SIM卡的手机号码)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Add more SIMs (添加更多SIM卡)
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Click "+ Add SIM" to add more SIM cards (点击"+ Add
                      SIM"添加更多SIM卡)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      CAPTCHA verify (我不是机器人)
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Click "I am not robot" to verify
                      (点击"我不是机器人"进行验证)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      ACTIVE (立即激活)
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Click to activate all SIM cards simultaneously
                      (点击同时激活所有SIM卡)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Result Information (结果信息)
                    </h4>
                    <p className="text-gray-600 text-sm">
                      View which SIM cards were activated successfully
                      (查看哪些SIM卡激活成功)
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
                      Security and Safety
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    By activating, you agree to our terms of service
                    (激活即表示您同意我们的服务条款)
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

