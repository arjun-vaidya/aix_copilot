import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full h-auto min-h-[64px] py-4 border-b border-[#e5e7eb] bg-white flex flex-col md:flex-row items-center justify-between px-6 md:px-10 shrink-0 gap-4">
      <h1 className="hidden md:block text-xl font-bold text-gray-900 shrink-0">
        Student Dashboard
      </h1>

      {/* Search Bar */}
      <div className="w-full md:flex-1 md:max-w-xl md:mx-8 relative order-last md:order-none">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Search resources, lessons, or grades..."
        />
      </div>

      {/* User Profile Container */}
      <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-6">
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-gray-900">Alex Rivera</span>
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              ID: 2023-8841
            </span>
          </div>
          <img
            className="h-9 w-9 rounded-full object-cover border border-gray-200"
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=f8f9fa"
            alt="Alex Rivera profile"
          />
        </div>
      </div>
    </header>
  );
}
