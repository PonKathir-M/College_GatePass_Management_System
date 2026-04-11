import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import DepartmentManagement from "./DepartmentManagement";
import StaffManagement from "./StaffManagement";
import StudentManagement from "./StudentManagement";
import LiveStatusBoard from "./LiveStatusBoard";
import Analytics from "./Analytics";
import Reports from "./Reports";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import "../styles/dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard", icon: "📊" },
    { id: "departments", label: "🏢 Departments", icon: "🏢" },
    { id: "staff", label: "👨‍🏫 Staff", icon: "👨‍🏫" },
    { id: "students", label: "👨‍🎓 Students", icon: "👨‍🎓" },
    { id: "reports", label: "📄 Reports", icon: "📄" }
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="admin"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>👨‍💼 Admin Dashboard</h1>
            <p>Manage system users, departments, and view analytics</p>
          </div>

          {activeTab === "dashboard" && (
            <>
              <LiveStatusBoard />
              <Analytics />
            </>
          )}
          {activeTab === "departments" && <DepartmentManagement />}
          {activeTab === "staff" && <StaffManagement />}
          {activeTab === "students" && <StudentManagement />}
          {activeTab === "reports" && <Reports />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

