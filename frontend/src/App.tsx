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

function App() {
  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8f9fa] overflow-hidden">
        {/* Persistent Global Sidebar */}
        <Sidebar />

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
