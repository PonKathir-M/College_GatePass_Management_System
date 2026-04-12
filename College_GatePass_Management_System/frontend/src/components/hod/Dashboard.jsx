import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import axios from "axios";
import AnalyticsTab from "./AnalyticsTab";
import StudentHistoryModal from "./StudentHistoryModal";
import DepartmentStudentsTab from "./DepartmentStudentsTab";
import HodInsightsTab from "./HodInsightsTab";
import "../styles/hod-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const tabs = [
    { id: "pending", label: "Pending", icon: "\u23F3" },
    { id: "stats", label: "Analytics", icon: "\uD83D\uDCCA" },
    { id: "students", label: "Students", icon: "\uD83D\uDC65" },
    { id: "insights", label: "Top Insights", icon: "\uD83C\uDFC6" }
  ];

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/hod/pending", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingApprovals(response.data);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    if (timeString.includes(":")) return timeString.slice(0, 5);
    return timeString;
  };

  const getImageSrc = (profilePic) => {
    if (!profilePic) return null;
    if (String(profilePic).startsWith("http://") || String(profilePic).startsWith("https://")) {
      return profilePic;
    }
    return `http://localhost:5001/uploads/${profilePic}`;
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Grant final approval for this gate pass?")) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5001/api/hod/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendingApprovals((prev) => prev.filter((req) => req.gatepass_id !== id));
      alert("Gate pass granted successfully.");
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to grant gate pass");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5001/api/hod/reject/${id}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendingApprovals((prev) => prev.filter((req) => req.gatepass_id !== id));
      alert("Gate pass rejected.");
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Failed to reject gate pass");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="hod"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>HOD Dashboard</h1>
            <p>Final approval for all gate pass requests</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {activeTab === "pending" && (
            <div className="requests-container">
              <h2>Awaiting HOD Approval</h2>
              {loading ? (
                <div className="loading-spinner">Loading requests...</div>
              ) : pendingApprovals.length === 0 ? (
                <div className="empty-state">
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="approval-card-list">
                  {pendingApprovals.map((req) => (
                    <div key={req.gatepass_id} className="approval-card">
                      <div className="card-content">
                        <div className="student-identity-row">
                          <button
                            type="button"
                            className="student-avatar-btn"
                            onClick={() => setSelectedStudentId(req.Student?.student_id)}
                            title="View full student history"
                          >
                            {req.Student?.profile_pic ? (
                              <img
                                src={getImageSrc(req.Student.profile_pic)}
                                alt={req.Student?.User?.name || "Student"}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextSibling;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span
                              className="student-avatar-fallback"
                              style={{ display: req.Student?.profile_pic ? "none" : "flex" }}
                            >
                              S
                            </span>
                          </button>

                          <div>
                            <h3>{req.Student?.User?.name}</h3>
                            <small className="student-subtext">Click image to view history and reasons</small>
                          </div>
                        </div>

                        <div className="details">
                          <span>Year: {req.Student?.year}nd</span>
                          <span>Reason: {req.reason}</span>
                          <span>{formatTime(req.out_time)} - {formatTime(req.expected_return)}</span>
                          <span className="badge status-approved">
                            {req.status === "Tutor Approved" ? "Tutor Approved" : "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleApprove(req.gatepass_id)}
                          disabled={actionLoading === req.gatepass_id}
                        >
                          {actionLoading === req.gatepass_id ? "..." : "Grant Pass"}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(req.gatepass_id)}
                          disabled={actionLoading === req.gatepass_id}
                        >
                          {actionLoading === req.gatepass_id ? "..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && <AnalyticsTab />}
          {activeTab === "students" && <DepartmentStudentsTab />}
          {activeTab === "insights" && <HodInsightsTab />}
        </div>
      </div>

      {selectedStudentId && (
        <StudentHistoryModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
