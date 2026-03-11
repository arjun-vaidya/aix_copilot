import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
    { name: "Instructor Dashboard", path: "/instructor", Icon: LayoutDashboard },
    { name: "My Courses", path: "/courses", Icon: BookOpen },
    { name: "Resources", path: "/resources", Icon: FolderOpen },
    { name: "Settings", path: "/settings", Icon: Settings },
];

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(location.pathname.startsWith("/workspace"));

    // Automatically adjust the collapsed state when navigating between Workspace and Dashboard
    useEffect(() => {
        setIsCollapsed(location.pathname.startsWith("/workspace"));
    }, [location.pathname]);

    return (
        <div className={`w-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} h-auto md:h-screen bg-white border-b md:border-b-0 md:border-r border-[#e5e7eb] flex flex-col flex-shrink-0 z-50 transition-all duration-300 ease-in-out`}>
            {/* Top Bar / Logo Area */}
            <div className={`flex items-center justify-between ${isCollapsed ? 'md:justify-center' : 'md:justify-start'} px-4 md:px-6 py-4 md:py-6 md:mb-6`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'md:hidden' : ''}`}>
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex shrink-0 items-center justify-center text-white font-bold">
                        Ai
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight text-gray-900 whitespace-nowrap">
                            AI4Numerics
                        </span>
                        <span className="hidden md:block text-xs text-gray-500 font-medium whitespace-nowrap">
                            Academic Portal
                        </span>
                    </div>
                </div>

                {/* Desktop Hamburger Button (Toggle Collapse) */}
                {!isCollapsed && (
                    <button
                        className="hidden md:flex ml-auto text-gray-500 hover:text-gray-900 transition-colors shrink-0"
                        onClick={() => setIsCollapsed(true)}
                        title="Collapse Sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Desktop Expand Button (When Collapsed) */}
                {isCollapsed && (
                    <button
                        className="hidden md:flex text-gray-500 hover:text-gray-900 transition-colors pt-1"
                        onClick={() => setIsCollapsed(false)}
                        title="Expand Sidebar"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}

                {/* Mobile Hamburger Button (Toggle Drawer) */}
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
                <nav className={`flex-1 py-4 md:py-0 space-y-2 px-4 ${isCollapsed ? 'md:px-3' : 'md:px-4'}`}>
                    {NAV_ITEMS.map(({ name, path, Icon }) => (
                        <NavLink
                            key={name}
                            to={path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            title={isCollapsed ? name : undefined}
                            className={({ isActive }) =>
                                `flex items-center justify-start gap-3 px-3 py-2.5 ${isCollapsed ? 'md:justify-center md:py-3 md:px-0' : ''} rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`
                            }
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? 'md:mr-0' : ''}`} />
                            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Deadlines Widget at Bottom */}
                <div className={`px-4 md:px-6 py-6 border-t border-[#e5e7eb] ${isCollapsed ? 'md:flex md:flex-col md:items-center' : ''}`}>
                    <div className={isCollapsed ? 'md:hidden' : 'block'}>
                        <h4 className="text-xs font-bold text-gray-400 tracking-wider mb-4 uppercase whitespace-nowrap">
                            Deadlines
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight whitespace-nowrap">
                                        Lab Report 2
                                    </p>
                                    <p className="text-xs text-blue-600 mt-0.5 whitespace-nowrap">Due tomorrow</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight whitespace-nowrap">
                                        Final Project Proposal
                                    </p>
                                    <p className="text-xs text-blue-600 mt-0.5 whitespace-nowrap">Due in 5 days</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        title={isCollapsed ? "Log out" : undefined}
                        className={`flex items-center gap-3 mt-8 w-full ${isCollapsed ? 'md:justify-center md:p-2 md:mt-2 md:bg-gray-50 md:rounded-lg md:hover:bg-gray-100 md:w-auto md:gap-0' : ''} text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors`}
                    >
                        <LogOut className={`w-5 h-5 shrink-0 ${isCollapsed ? 'md:mr-0' : ''}`} />
                        <span className={isCollapsed ? 'md:hidden' : ''}>Log out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
