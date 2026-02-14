import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import StudentHistoryModal from "./StudentHistoryModal";
import TrackingTab from "./TrackingTab";
import AnalyticsTab from "./AnalyticsTab";
import StudentSuspension from "./StudentSuspension";
import axios from "axios";
import "../styles/hod-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null); // For modal
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  });

  const tabs = [
    { id: "pending", label: "⏳ Pending", icon: "⏳" },
    { id: "tracking", label: "📡 Status Tracking", icon: "📡" },
    { id: "analytics", label: "📊 Analytics", icon: "📊" },
    { id: "suspension", label: "🚫 Block/Unblock", icon: "🚫" }
  ];

  useEffect(() => {
    fetchPendingApprovals();
    fetchStats();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/hod/pending", {
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

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/hod/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    if (timeString.includes(":")) {
      return timeString.slice(0, 5); //HH:MM
    }
    return timeString;
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Grant final approval for this gate pass?")) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/hod/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI
      setPendingApprovals(prev => prev.filter(req => req.gatepass_id !== id));
      fetchStats(); // Refresh stats
      alert("Gate pass GRANTED successfully!");
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
      await axios.post(`http://localhost:5000/api/hod/reject/${id}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI
      setPendingApprovals(prev => prev.filter(req => req.gatepass_id !== id));
      fetchStats();
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
            <h1>👔 HOD Dashboard</h1>
            <p>Final approval for all gate pass requests</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {activeTab === "pending" && (
            <div className="requests-container">
              <h2>⏳ Awaiting HOD Approval</h2>
              {loading ? (
                <div className="loading-spinner">Loading requests...</div>
              ) : pendingApprovals.length === 0 ? (
                <div className="empty-state">
                  <p>✨ No pending approvals</p>
                </div>
              ) : (
                <div className="approval-card-list">
                  {pendingApprovals.map((req) => (
                    <div key={req.gatepass_id} className="approval-card">
                      <div className="card-content">
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', cursor: 'pointer' }}
                          onClick={() => setSelectedStudentId(req.StudentStudentId)}
                          title="Click to view full history"
                        >
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            {req.Student?.profile_pic ? (
                              <img
                                src={`http://localhost:5000/uploads/${req.Student.profile_pic}`}
                                alt={req.Student?.User?.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.style.display = 'flex'; e.target.parentNode.style.alignItems = 'center'; e.target.parentNode.style.justifyContent = 'center'; e.target.parentNode.textContent = '👤'; }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                            )}
                          </div>
                          <div>
                            <h3>{req.Student?.User?.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Click for history ↗</span>
                          </div>
                        </div>
                        <div className="details">
                          <span>📚 Year: {req.Student?.year}nd</span>
                          <span>📝 Reason: {req.reason}</span>
                          <span>⏰ {formatTime(req.out_time)} - {formatTime(req.expected_return)}</span>
                          <span className="badge status-approved">
                            {req.status === "Tutor Approved" ? "✅ Tutor Approved" : "⏳ Pending"}
                          </span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleApprove(req.gatepass_id)}
                          disabled={actionLoading === req.gatepass_id}
                        >
                          {actionLoading === req.gatepass_id ? "..." : "✅ Grant Pass"}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(req.gatepass_id)}
                          disabled={actionLoading === req.gatepass_id}
                        >
                          {actionLoading === req.gatepass_id ? "..." : "❌ Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "tracking" && <TrackingTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "suspension" && <StudentSuspension />}
        </div>
      </div>

      {/* Student History Modal */}
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

