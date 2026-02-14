import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import StudentHoverPopup from "../common/StudentHoverPopup";
import "../styles/security-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("active");
  const [activePasses, setActivePasses] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [historyPasses, setHistoryPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hoveredPass, setHoveredPass] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [passesRes, logsRes, historyRes] = await Promise.all([
        axios.get("http://localhost:5000/api/security/approved-passes", { headers }),
        axios.get("http://localhost:5000/api/security/logs", { headers }),
        axios.get("http://localhost:5000/api/security/history", { headers })
      ]);

      setActivePasses(passesRes.data);
      setActivityLog(logsRes.data);
      setHistoryPasses(historyRes.data);
    } catch (err) {
      console.error("Error fetching security data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOut = async (gatepass_id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/security/mark-out", { gatepass_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Student marked OUT");
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Mark Out Error:", err);
      setError(err.response?.data?.message || "Failed to mark event");
    }
  };

  const handleMarkIn = async (gatepass_id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/security/mark-in", { gatepass_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Student marked IN");
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Mark In Error:", err);
      setError(err.response?.data?.message || "Failed to mark event");
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    if (timeStr.includes("T")) {
      return new Date(timeStr).toLocaleString();
    }
    const today = new Date().toLocaleDateString();
    return `${today} ${timeStr}`;
  };

  // Filter Logic
  const filteredPasses = activePasses.filter(pass => {
    const student = pass.Student || {};
    const deptName = student.Department?.department_name || "";
    const year = student.year ? student.year.toString() : "";
    const name = student.User?.name?.toLowerCase() || "";
    const passId = pass.gatepass_id?.toLowerCase() || "";

    const matchesDept = deptFilter === "all" || deptName === deptFilter;
    const matchesYear = yearFilter === "all" || year === yearFilter;
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || passId.includes(searchQuery.toLowerCase());

    return matchesDept && matchesYear && matchesSearch;
  });

  const uniqueDepartments = [...new Set(activePasses.map(p => p.Student?.Department?.department_name).filter(Boolean))];

  const tabs = [
    { id: "active", label: "🚪 Active Passes", icon: "🚪" },
    { id: "log", label: "📋 Activity Log", icon: "📋" },
    { id: "history", label: "📜 Pass History", icon: "📜" }
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        role="security"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>👮 Security Guard Dashboard</h1>
            <p>Monitor and log student movements with approved gate passes</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {activeTab === "active" && (
            <div className="security-container">
              <h2>🚪 Active Gate Passes (HOD Approved)</h2>

              {/* Filters */}
              <div className="filters-bar" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Search Name or ID..."
                  className="filter-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                <select
                  className="filter-select"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {loading ? <div className="loading">Loading...</div> : (
                <div className="passes-grid">
                  {filteredPasses.length === 0 ? <p>No active passes match filters</p> : filteredPasses.map((pass) => (
                    <div key={pass.gatepass_id} className="pass-card large-view">
                      <div
                        className="pass-image-container"
                        onMouseEnter={() => setHoveredPass(pass)}
                        onMouseLeave={() => setHoveredPass(null)}
                      >
                        {pass.Student?.profile_pic ? (
                          <img
                            src={`http://localhost:5000/uploads/${pass.Student.profile_pic}`}
                            alt={pass.Student?.User?.name}
                            className="student-large-img"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.classList.add('no-image'); }}
                          />
                        ) : (
                          <div className="no-image-placeholder">👤</div>
                        )}
                        <div className="pass-overlay-info">
                          <h3>{pass.Student?.User?.name}</h3>
                          <span className="pass-id-badge">{pass.gatepass_id}</span>
                        </div>
                      </div>

                      <div className="pass-actions-compact">
                        <button className="btn btn-mark-out" onClick={() => handleMarkOut(pass.gatepass_id)}>🚪 OUT</button>
                        <button className="btn btn-mark-in" onClick={() => handleMarkIn(pass.gatepass_id)}>✅ IN</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "log" && (
            <div className="security-container">
              <h2>📋 Activity & Movement Log</h2>
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Gate Pass ID</th>
                    <th>Student Name</th>
                    <th>Dept</th>
                    <th>Action</th>
                    <th>Time</th>
                    <th>Security Officer</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.map((log) => (
                    <tr key={log.id}>
                      <td><code>{log.GatePassGatepassId || log.GatePass?.gatepass_id}</code></td>
                      <td>{log.GatePass?.Student?.User?.name || "N/A"}</td>
                      <td>{log.GatePass?.Student?.Department?.department_name || "N/A"}</td>
                      <td>
                        {log.actual_in ?
                          <span className="action-badge in">🚶 IN</span> :
                          <span className="action-badge out">🚪 OUT</span>}
                      </td>
                      <td>
                        {log.actual_in ? formatTime(log.actual_in) : formatTime(log.actual_out)}
                      </td>
                      <td>{log.actual_in ? log.CheckedInBy?.name : log.CheckedOutBy?.name || "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="security-container">
              <h2>📜 Completed Gate Pass History</h2>
              <div className="table-responsive">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Pass ID</th>
                      <th>Student Details</th>
                      <th>Checked OUT</th>
                      <th>Checked IN</th>
                      <th>Total Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPasses.map((pass) => (
                      <tr key={pass.gatepass_id}>
                        <td>
                          <strong>{pass.gatepass_id}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#718096' }}>{pass.reason}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{pass.Student?.User?.name}</div>
                          <div style={{ fontSize: '0.85rem' }}>
                            {pass.Student?.Department?.department_name} • {pass.Student?.year} Yr
                          </div>
                        </td>
                        <td>
                          <div>🕒 {formatTime(pass.SecurityLog?.actual_out)}</div>
                          <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                            👮‍♂️ {pass.SecurityLog?.CheckedOutBy?.name || "Unknown"}
                          </div>
                        </td>
                        <td>
                          <div>🕒 {formatTime(pass.SecurityLog?.actual_in)}</div>
                          <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                            👮‍♂️ {pass.SecurityLog?.CheckedInBy?.name || "Unknown"}
                          </div>
                        </td>
                        <td>
                          {pass.SecurityLog?.actual_in && pass.SecurityLog?.actual_out ?
                            Math.round((new Date(pass.SecurityLog.actual_in) - new Date(pass.SecurityLog.actual_out)) / 60000) + " mins"
                            : "N/A"
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <StudentHoverPopup
        student={hoveredPass?.Student}
        extraInfo={hoveredPass ? [
          { label: "Reason", value: hoveredPass.reason },
          { label: "Return By", value: formatTime(hoveredPass.expected_return), highlight: true },
          { label: "Tutor", value: hoveredPass.Student?.AssignedStaff?.User?.name || "N/A" }
        ] : []}
      />
    </div>
  );
};

export default Dashboard;



