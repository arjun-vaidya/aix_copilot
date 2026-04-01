import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const NAV_ITEMS = [
    { name: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
    { name: "Instructor Dashboard", path: "/instructor", Icon: LayoutDashboard },
    { name: "Settings", path: "/settings", Icon: Settings },
];

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(location.pathname.startsWith("/workspace"));

    // Automatically adjust the collapsed state when navigating between Workspace and Dashboard
    useEffect(() => {
        setIsCollapsed(location.pathname.startsWith("/workspace"));
    }, [location.pathname]);

    return (
        <div className={`w-full ${isCollapsed ? 'md:w-20' : 'md:w-72'} h-auto md:h-screen bg-white border-b md:border-b-0 md:border-r border-[#f1f1f1] flex flex-col flex-shrink-0 z-50 transition-all duration-300 ease-in-out`}>
            {/* Top Bar / Logo Area */}
            <div className={`flex items-center justify-between ${isCollapsed ? 'md:justify-center' : 'md:justify-start'} px-6 py-8`}>
                <div className="flex items-center gap-3">
                    {!isCollapsed && (
                        <>
                            <div className="w-10 h-10 bg-[#0267C1] rounded-lg flex shrink-0 items-center justify-center text-white font-bold shadow-sm">
                                <span className="text-xl">Σ</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[#111827] text-lg leading-tight tracking-tight whitespace-nowrap">
                                    AI4Numerics
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mt-0.5">
                                    Student Portal
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Desktop Toggle Button - Only show in Workspace */}
                {isCollapsed && (
                    <button
                        className="hidden md:flex mt-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setIsCollapsed(false)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}
                {location.pathname.startsWith("/workspace") && !isCollapsed && (
                    <button
                        className="hidden md:flex ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setIsCollapsed(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

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

            {/* Navigation Menus */}
            <div
                className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex flex-col flex-1 w-full absolute md:static top-[90px] bg-white border-b md:border-b-0 border-[#f1f1f1] shadow-lg md:shadow-none`}
            >
                <nav className={`flex-1 py-4 md:py-2 space-y-1 px-4 ${isCollapsed ? 'md:px-3' : 'md:px-4'}`}>
                    {NAV_ITEMS.filter(item => {
                        if (item.name === "Instructor Dashboard") {
                            return user?.user_metadata?.role === "instructor";
                        }
                        return true;
                    }).map(({ name, path, Icon }) => (
                        <NavLink
                            key={name}
                            to={path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            title={isCollapsed ? name : undefined}
                            className={({ isActive }) =>
                                `flex items-center justify-start gap-4 px-4 py-3.5 ${isCollapsed ? 'md:justify-center md:py-3.5 md:px-0' : ''} rounded-xl text-[15px] font-bold transition-all ${isActive
                                    ? "bg-[#eff6ff] text-[#0267C1]"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`
                            }
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? 'md:mr-0' : ''}`} />
                            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile Card at Bottom */}
                <div className={`p-4 mt-auto mb-4 ${isCollapsed ? 'md:px-2' : 'md:px-4'}`}>
                    <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-2xl ${isCollapsed ? 'md:justify-center md:bg-transparent md:p-1' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-[#0267C1]" />
                        </div>
                        <div className={`flex flex-col min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
                            <span className="text-sm font-bold text-gray-900 truncate">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
                            </span>
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                ID: {user?.id?.slice(0, 6).toUpperCase() || "N/A"}
                            </span>
                        </div>
                        {!isCollapsed && (
                            <button
                                onClick={onLogout}
                                title="Log out"
                                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
