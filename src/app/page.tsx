import InfoForm from "../components/InfoForm";

export default function InfoPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center py-4 px-4 sm:py-6 sm:px-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-3 sm:mb-4">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 sm:mb-3 tracking-tight">
          Admin Panel
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
          Trang quản lý thông tin hệ thống - chi dành cho quản trị viên có thẩm
          quyền
        </p>
        {/* Navigation */}
        <div className="flex justify-center">
          <a
            href="/"
            className="inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 mr-2"
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
            Về Trang Kích Hoạt
          </a>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto py-4">
          <InfoForm />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-center py-3 px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/50 max-w-sm mx-auto">
          <p className="text-xs sm:text-sm font-medium text-gray-700">
            🛡️ Mifigo Admin Panel v1.0
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Được bảo vệ bởi Server Actions & End-to-End Encryption
          </p>
        </div>
      </div>
    </div>
  );
}

