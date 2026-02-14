import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import StudentHoverPopup from "../common/StudentHoverPopup";
import StudentHistoryModal from "../hod/StudentHistoryModal";
import StudentAssignmentCard from "./StudentAssignmentCard";
import RequestHistory from "./RequestHistory";
import AnnouncementsTab from "./AnnouncementsTab";
import "../styles/tutor-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // State for API data
  const [pendingRequests, setPendingRequests] = useState([]);
  const [departmentStudents, setDepartmentStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffProfile, setStaffProfile] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const tabs = [
    { id: "pending", label: "⏳ Pending Requests", icon: "⏳" },
    { id: "assign", label: "📋 Assign Students", icon: "📋" },
    { id: "history", label: "📜 History", icon: "📜" },
    { id: "announcements", label: "📢 Announcements", icon: "📢" },
  ];

  // Fetch pending requests
  useEffect(() => {
    fetchPendingRequests();
    fetchDepartmentStudents();
    fetchStaffProfile();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/tutor/pending", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle response - could be array or object with data property
      const data = Array.isArray(response.data) ? response.data : response.data.requests || response.data;
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
      setPendingRequests([]);
      setError("Failed to load pending requests");
    }
  };

  const fetchStaffProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      // Get current user profile with staff details
      const response = await axios.get("http://localhost:5000/api/tutor/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.Staff) {
        setStaffProfile(response.data.Staff);
      }
    } catch (err) {
      console.warn("Could not fetch staff profile:", err);
    }
  };

  const fetchDepartmentStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/tutor/students", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = Array.isArray(response.data) ? response.data : response.data.students || response.data;
      setDepartmentStudents(Array.isArray(data) ? data : []);
      setError(""); // Clear error on success
    } catch (err) {
      console.error("Failed to fetch department students:", err);
      setDepartmentStudents([]);
      setError("Failed to load students - please refresh the page");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    // Check if it's already in HH:MM format or HH:MM:SS
    if (timeString.includes(":")) {
      return timeString.slice(0, 5);
    }
    return timeString;
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this gate pass?")) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/tutor/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from list
      setPendingRequests(prev => prev.filter(req => req.gatepass_id !== id));
      alert("Gate pass approved successfully!");
    } catch (err) {
      console.error("Approval failed:", err);
      alert(err.response?.data?.message || "Failed to approve gate pass");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/tutor/reject/${id}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from list
      setPendingRequests(prev => prev.filter(req => req.gatepass_id !== id));
      alert("Gate pass rejected successfully.");
    } catch (err) {
      console.error("Rejection failed:", err);
      alert(err.response?.data?.message || "Failed to reject gate pass");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter students based on search term
  const filteredStudents = departmentStudents.filter(student => {
    try {
      return student.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.User?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (e) {
      return false;
    }
  });

  // Get current user's staff ID from context or staff profile
  const userStaffId = staffProfile?.staff_id || user?.Staff?.staff_id;

  // Separate assigned and unassigned students
  const assignedStudents = filteredStudents.filter(s => s.AssignedStaffStaffId === userStaffId);
  const unassignedStudents = filteredStudents.filter(s => !s.AssignedStaffStaffId || s.AssignedStaffStaffId !== userStaffId);

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="tutor"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>👨‍🏫 Tutor Dashboard</h1>
            <p>Manage gate pass requests and student assignments</p>
          </div>

          {error && (
            <div className="error-banner">
              <span>❌</span>
              <p>{error}</p>
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === "pending" && (
            <div className="requests-container">
              <h2>⏳ Pending Gate Pass Requests</h2>
              {pendingRequests.length === 0 ? (
                <div className="empty-state">
                  <p>✨ No pending requests</p>
                  <span>All requests have been reviewed</span>
                </div>
              ) : (
                <div className="requests-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Year</th>
                        <th>Reason</th>
                        <th>Out Time</th>
                        <th>Return</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => (
                        <tr key={req.gatepass_id}>
                          <td>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredStudent(req.Student)}
                              onMouseLeave={() => setHoveredStudent(null)}
                              onClick={() => setSelectedStudentId(req.Student?.student_id)}
                            >
                              <div style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', background: '#ccc' }}>
                                {req.Student?.profile_pic ? (
                                  <img
                                    src={`http://localhost:5000/uploads/${req.Student.profile_pic}`}
                                    alt={req.Student?.User?.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.style.display = 'flex'; e.target.parentNode.style.alignItems = 'center'; e.target.parentNode.style.justifyContent = 'center'; e.target.parentNode.textContent = '👤'; }}
                                  />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                )}
                              </div>
                              <strong>{req.Student?.User?.name || "Unknown"}</strong>
                            </div>
                          </td>
                          <td>{req.Student?.year || "N/A"}nd</td>
                          <td>{req.reason}</td>
                          <td>{formatTime(req.out_time)}</td>
                          <td>{formatTime(req.expected_return)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(req.gatepass_id)}
                              disabled={actionLoading === req.gatepass_id}
                            >
                              {actionLoading === req.gatepass_id ? "..." : "✅ Approve"}
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(req.gatepass_id)}
                              disabled={actionLoading === req.gatepass_id}
                            >
                              {actionLoading === req.gatepass_id ? "..." : "❌ Reject"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Assign Students Tab */}
          {activeTab === "assign" && (
            <div className="assign-container">
              <div className="assign-header">
                <h2>📋 Student Assignment & Management</h2>
                <p>Assign students to yourself as their tutor. Once assigned, they cannot be assigned to another staff member.</p>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by student name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-count">
                  {filteredStudents.length} students found
                </span>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <p>🔍 No students found</p>
                  <span>Try adjusting your search criteria</span>
                </div>
              ) : (
                <>
                  {/* Assigned Students Section */}
                  {assignedStudents.length > 0 && (
                    <div className="students-section">
                      <h3 className="section-title">
                        ✅ Your Assigned Students ({assignedStudents.length})
                      </h3>
                      <div className="students-grid">
                        {assignedStudents.map((student) => (
                          <StudentAssignmentCard
                            key={student.student_id}
                            student={student}
                            isAssignedToMe={true}
                            onAssignmentChange={fetchDepartmentStudents}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unassigned/Other Students Section */}
                  <div className="students-section">
                    <h3 className="section-title">
                      ⭕ Available Students ({unassignedStudents.length})
                    </h3>
                    {unassignedStudents.length === 0 ? (
                      <div className="empty-state">
                        <p>🎉 You have assigned all available students!</p>
                      </div>
                    ) : (
                      <div className="students-grid">
                        {unassignedStudents.map((student) => (
                          <StudentAssignmentCard
                            key={student.student_id}
                            student={student}
                            isAssignedToMe={false}
                            onAssignmentChange={fetchDepartmentStudents}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Request History Tab */}
          {activeTab === "history" && <RequestHistory />}

          {/* Announcements Tab */}
          {activeTab === "announcements" && <AnnouncementsTab />}
        </div>
      </div>
      <StudentHoverPopup student={hoveredStudent} />

      {selectedStudentId && (
        <StudentHistoryModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          apiEndpoint="http://localhost:5000/api/tutor/student-history"
        />
      )}
    </div>
  );
};

export default Dashboard;

