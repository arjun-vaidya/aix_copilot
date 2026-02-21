import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Instructor from './pages/Instructor';
import Workspace from './pages/Workspace';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instructor" element={<Instructor />} />
          <Route path="/workspace/:id" element={<Workspace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
