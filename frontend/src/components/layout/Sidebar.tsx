import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
  { name: "My Courses", path: "/courses", Icon: BookOpen },
  { name: "Resources", path: "/resources", Icon: FolderOpen },
  { name: "Settings", path: "/settings", Icon: Settings },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="w-full md:w-64 h-auto md:h-screen bg-white border-b md:border-b-0 md:border-r border-[#e5e7eb] flex flex-col flex-shrink-0 z-50">
      {/* Top Bar (Mobile) / Logo Area (Desktop) */}
      <div className="flex items-center justify-between md:justify-start px-6 py-4 md:py-6 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold">
            Ai
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight text-gray-900">
              AI4Numerics
            </span>
            <span className="hidden md:block text-xs text-gray-500 font-medium">
              Academic Portal
            </span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Navigation Menus (Hidden on mobile unless open) */}
      <div
        className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex flex-col flex-1 overflow-y-auto w-full absolute md:static top-[73px] bg-white border-b md:border-b-0 border-[#e5e7eb] shadow-lg md:shadow-none`}
      >
        <nav className="flex-1 px-4 py-4 md:py-0 space-y-1">
          {NAV_ITEMS.map(({ name, path, Icon }) => (
            <NavLink
              key={name}
              to={path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {name}
            </NavLink>
          ))}
        </nav>

        {/* Deadlines Widget at Bottom */}
        <div className="px-6 py-6 border-t border-[#e5e7eb]">
          <h4 className="text-xs font-bold text-gray-400 tracking-wider mb-4 uppercase">
            Deadlines
          </h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  Lab Report 2
                </p>
                <p className="text-xs text-blue-600 mt-0.5">Due tomorrow</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  Final Project Proposal
                </p>
                <p className="text-xs text-blue-600 mt-0.5">Due in 5 days</p>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-3 mt-8 text-sm font-medium text-gray-600 hover:text-gray-900 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
