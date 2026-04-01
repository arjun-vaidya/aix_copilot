import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Instructor from "./pages/Instructor";
import Workspace from "./pages/Workspace";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { session, isLoading, signOut } = useAuth();
  const isAuthenticated = !!session;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] font-bold text-slate-500">
        Authenticating...
      </div>
    );
  }

  // If not authenticated, force the Login screen
  if (!isAuthenticated) {
    return <Login />;
  }

  // Once authenticated, render the main application layout
  return (
    <Router>
      <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#f8f9fa] overflow-hidden">
        {/* Persistent Global Sidebar */}
        <Sidebar onLogout={signOut} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/instructor" element={<Instructor />} />
            <Route path="/workspace/:id" element={<Workspace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
