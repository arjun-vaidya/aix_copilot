import { useState } from "react";
import { LogIn, Eye, Lock } from "lucide-react";

export default function Login({
  onLogin,
}: {
  onLogin: (role: string) => void;
}) {
  const [roleMode, setRoleMode] = useState<"student" | "instructor">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(roleMode);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 font-sans">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <div className="w-5 h-6 bg-white rounded-sm relative">
              <div className="absolute top-1 left-1 right-1 h-1 bg-blue-100 rounded-full" />
              <div className="absolute top-3 left-1 right-1 h-2 bg-blue-100 rounded-sm" />
            </div>
          </div>
          <span className="font-extrabold text-3xl text-slate-900 tracking-tight">
            AI4Numerics
          </span>
        </div>
        <p className="text-[13px] font-bold text-slate-500 tracking-widest uppercase mt-1">
          Academic Research & Computing Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-10 flex flex-col relative z-10">
        <div className="flex flex-col items-start mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Please enter your academic credentials to login.
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="w-full bg-slate-50 p-1.5 rounded-xl flex items-center mb-8 border border-slate-100">
          <button
            type="button"
            onClick={() => setRoleMode("student")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              roleMode === "student"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRoleMode("instructor")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              roleMode === "instructor"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            Instructor
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700">
              Email or Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <span className="font-serif text-lg">@</span>
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@university.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                Password
              </label>
              <a
                href="#"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                <Eye
                  className={`w-4 h-4 ${showPassword ? "text-blue-500" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-3 mt-1">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 bg-slate-50"
            />
            <label
              htmlFor="remember"
              className="text-xs font-bold text-slate-600 cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white font-bold text-[14px] py-3.5 rounded-[10px] shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all mt-2"
          >
            Sign In
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        {/* SSO Divider */}
        <div className="w-full flex items-center gap-4 my-8 opacity-75">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
            Or continue with
          </span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* SSO Button */}
        <button
          type="button"
          onClick={() => onLogin(roleMode)}
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold text-[13px] py-3.5 rounded-[10px] shadow-sm flex items-center justify-center gap-3 transition-all"
        >
          {/* Mock University Logo */}
          <div className="w-5 h-5 bg-slate-900 rounded-[4px] flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
          </div>
          University SSO
        </button>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex flex-col items-center gap-5">
        <p className="text-xs font-medium text-slate-500">
          New to AI4Numerics?{" "}
          <a
            href="#"
            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
          >
            Contact Administrator
          </a>
        </p>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          <a href="#" className="hover:text-slate-600 transition-colors">
            Help Center
          </a>
          <span className="w-1 h-1 rounded flex shrink-0 bg-slate-300"></span>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </a>
          <span className="w-1 h-1 rounded flex shrink-0 bg-slate-300"></span>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Terms
          </a>
        </div>
      </div>
    </div>
  );
}
