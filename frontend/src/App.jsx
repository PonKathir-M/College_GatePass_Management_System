import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import StudentLogin from "./pages/StudentLogin";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/common/ProtectedRoute";

import AdminDashboard from "./components/admin/Dashboard";
import StudentDashboard from "./components/student/Dashboard";
import TutorDashboard from "./components/tutor/Dashboard";
import HodDashboard from "./components/hod/Dashboard";
import WardenDashboard from "./components/warden/Dashboard";
import SecurityDashboard from "./components/security/Dashboard";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/staff" element={<StaffLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />

          <Route path="/change-password" element={
            <ProtectedRoute>
              <ForcePasswordChange />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/tutor" element={
            <ProtectedRoute role="staff">
              <TutorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/hod" element={
            <ProtectedRoute role="hod">
              <HodDashboard />
            </ProtectedRoute>
          } />

          <Route path="/warden" element={
            <ProtectedRoute role="warden">
              <WardenDashboard />
            </ProtectedRoute>
          } />

          <Route path="/security" element={
            <ProtectedRoute role="security">
              <SecurityDashboard />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
