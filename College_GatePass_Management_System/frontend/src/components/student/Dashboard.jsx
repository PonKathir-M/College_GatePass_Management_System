import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import ApplyGatePass from "./ApplyGatePass";
import GatePassHistory from "./GatePassHistory";
import TrackStatus from "./TrackStatus";
import Profile from "./Profile";
import AnnouncementsWidget from "./AnnouncementsWidget";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import "../styles/student-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("apply");

  const tabs = [
    { id: "apply", label: "📝 Apply Gate Pass", icon: "📝" },
    { id: "track", label: "📍 Track Status", icon: "📍" },
    { id: "history", label: "📋 History", icon: "📋" },
    { id: "profile", label: "👤 Profile", icon: "👤" }
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="student"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>👨‍🎓 Student Gate Pass System</h1>
            <p>Apply and track your gate pass requests</p>
          </div>

          {activeTab === "apply" && (
            <>
              <AnnouncementsWidget />
              <ApplyGatePass />
            </>
          )}
          {activeTab === "track" && <TrackStatus />}
          {activeTab === "history" && <GatePassHistory />}
          {activeTab === "profile" && <Profile />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

