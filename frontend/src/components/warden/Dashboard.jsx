import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import StudentHoverPopup from "../common/StudentHoverPopup";
import "../../styles/warden-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("morning");
  const [morningRequests, setMorningRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);

  // New state for students tab
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterDept, setFilterDept] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  useEffect(() => {
    if (activeTab === "morning") {
      fetchRequests();
    } else if (activeTab === "students") {
      fetchStudents();
      fetchDepartments(); // Load departments once for filter
    }
  }, [activeTab, filterDept, filterYear]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/warden/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMorningRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const query = new URLSearchParams({
        department_id: filterDept,
        year: filterYear
      }).toString();

      const res = await axios.get(`http://localhost:5000/api/warden/students?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to fetch student list");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      if (departments.length > 0) return; // Already loaded
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/warden/departments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (err) {
      console.warn("Failed to load departments filter");
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/warden/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Request approved successfully");
      fetchRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Approve error:", err);
      setError("Failed to approve request");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/warden/reject/${id}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Request rejected");
      fetchRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Reject error:", err);
      setError("Failed to reject request");
    }
  };

  const tabs = [
    { id: "morning", label: "🌅 Morning (Before 9:15)", icon: "🌅" },
    { id: "students", label: "👨‍🎓 Students List", icon: "👨‍🎓" }
    // { id: "history", label: "📋 History", icon: "📋" } // Hide history for now as backend doesn't support it fully yet
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="warden"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>🚨 Warden Dashboard</h1>
            <p>Approve early morning requests from hostellers (before 9:15 AM)</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {activeTab === "morning" && (
            <div className="warden-container">
              <h2>🌅 Hosteller Morning Requests</h2>
              <p className="info-text">⏰ Time-sensitive: These hostellers need approval to exit between 6:00 AM - 9:15 AM</p>

              {loading ? (
                <div className="loading">Loading requests...</div>
              ) : morningRequests.length === 0 ? (
                <div className="no-data">No pending morning requests</div>
              ) : (
                <div className="requests-list">
                  {morningRequests.map((req) => (
                    <div key={req.gatepass_id} className="warden-request-card">
                      <div className="request-header">
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredStudent(req.Student)}
                          onMouseLeave={() => setHoveredStudent(null)}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0' }}>
                            {req.Student?.profile_pic ? (
                              <img
                                src={`http://localhost:5000/uploads/${req.Student.profile_pic}`}
                                alt={req.Student?.User?.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.textContent = '👤'; e.target.parentNode.style.display = 'flex'; e.target.parentNode.style.alignItems = 'center'; e.target.parentNode.style.justifyContent = 'center'; }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                            )}
                          </div>
                          <h3>{req.Student?.User?.name || "Student"}</h3>
                        </div>
                        <span className="room-badge">{req.Student?.year} Year - {req.Student?.Department?.department_name}</span>
                      </div>
                      <div className="request-details">
                        <p>ID: <strong>{req.gatepass_id}</strong></p>
                        <p>🕐 Time: <strong>{new Date(req.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
                        <p>📝 Reason: <strong>{req.reason}</strong></p>
                      </div>
                      <div className="request-actions">
                        <button className="btn btn-approve" onClick={() => handleApprove(req.gatepass_id)}>✅ Approve</button>
                        <button className="btn btn-reject" onClick={() => handleReject(req.gatepass_id)}>❌ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div className="warden-container">
              <div className="tab-header">
                <h2>📋 Hosteller Students List</h2>
                <div className="filters-row">
                  <select
                    className="filter-select"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(d => (
                      <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="loading">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="no-data">No hostellers found matching criteria</div>
              ) : (
                <div className="table-responsive">
                  <table className="warden-table">
                    <thead>
                      <tr>
                        <th>Profile</th>
                        <th>Name</th>
                        <th>Year</th>
                        <th>Department</th>
                        <th>Parent Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.student_id}>
                          <td>
                            <div
                              className="profile-circle-sm"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredStudent(student)}
                              onMouseLeave={() => setHoveredStudent(null)}
                            >
                              {student.profile_pic ? (
                                <img src={`http://localhost:5000/uploads/${student.profile_pic}`} alt="Profile" />
                              ) : "👤"}
                            </div>
                          </td>
                          <td>{student.User?.name}</td>
                          <td>{student.year} Year</td>
                          <td>{student.Department?.department_name}</td>
                          <td>{student.parent_phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <StudentHoverPopup student={hoveredStudent} />
    </div>
  );
};

export default Dashboard;

