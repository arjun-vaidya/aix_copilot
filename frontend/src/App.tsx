import { useState } from "react";
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (role: string) => {
    // eslint-disable-next-line no-console
    console.log(`Logging in as: ${role}`); // Will be useful later for branching
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // If not authenticated, force the Login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Once authenticated, render the main application layout
  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8f9fa] overflow-hidden">
        {/* Persistent Global Sidebar */}
        <Sidebar onLogout={handleLogout} />

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

export default App;
