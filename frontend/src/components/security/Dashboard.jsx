import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import CheckInOut from "./CheckInOut";
import "../styles/security-dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("active");
  const [dashboardPasses, setDashboardPasses] = useState({ active: [], expired: [], late: [] });
  const [activityLog, setActivityLog] = useState([]);
  const [historyPasses, setHistoryPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardRes, logsRes, historyRes] = await Promise.all([
        axios.get("http://localhost:5001/api/security/dashboard-passes", { headers }),
        axios.get("http://localhost:5001/api/security/logs", { headers }),
        axios.get("http://localhost:5001/api/security/history", { headers })
      ]);

      setDashboardPasses(dashboardRes.data);
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
      await axios.post(
        "http://localhost:5001/api/security/mark-out",
        { gatepass_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Student marked OUT");
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Mark Out Error:", err);
      setError(err.response?.data?.message || "Failed to mark OUT");
    }
  };

  const handleMarkIn = async (gatepass_id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/security/mark-in",
        { gatepass_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Student marked IN");
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Mark In Error:", err);
      setError(err.response?.data?.message || "Failed to mark IN");
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    if (timeStr.includes("T")) return new Date(timeStr).toLocaleString();
    const today = new Date().toLocaleDateString();
    return `${today} ${timeStr}`;
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const diffMs = new Date(endTime) - new Date(startTime);
    if (!Number.isFinite(diffMs) || diffMs < 0) return "N/A";
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const applyFilters = (passes) =>
    passes.filter((pass) => {
      const student = pass.Student || {};
      const deptName = student.Department?.department_name || "";
      const year = student.year ? student.year.toString() : "";
      const name = student.User?.name?.toLowerCase() || "";
      const passId = pass.gatepass_id?.toLowerCase() || "";

      const matchesDept = deptFilter === "all" || deptName === deptFilter;
      const matchesYear = yearFilter === "all" || year === yearFilter;
      const matchesSearch =
        name.includes(searchQuery.toLowerCase()) || passId.includes(searchQuery.toLowerCase());

      return matchesDept && matchesYear && matchesSearch;
    });

  const filteredActivePasses = applyFilters(dashboardPasses.active || []);
  const uniqueDepartments = [
    ...new Set((dashboardPasses.active || []).map((p) => p.Student?.Department?.department_name).filter(Boolean))
  ];

  const tabs = [
    { id: "active", label: "Active Passes", icon: "OUT" },
    { id: "checkinout", label: "Check In/Out", icon: "🔐" },
    { id: "expired", label: "Expired Passes", icon: "EXP" },
    { id: "late", label: "Hosteller Late", icon: "LATE" },
    { id: "log", label: "Activity Log", icon: "LOG" },
    { id: "history", label: "Pass History", icon: "HIS" }
  ];

  const renderPassCards = (passes, options = {}) => {
    const { showActions = false } = options;

    if (passes.length === 0) {
      return <p>No records found</p>;
    }

    return (
      <div className="passes-grid">
        {passes.map((pass) => (
          <div key={pass.gatepass_id} className="pass-card">
            <div className="pass-header">
              <h3>{pass.Student?.User?.name}</h3>
              <span className="pass-id">{pass.gatepass_id}</span>
            </div>
            <div className="pass-details">
              <p>
                <strong>{pass.Student?.Department?.department_name}</strong> - {pass.Student?.year} Yr
              </p>
              <p>
                Tutor: <strong>{pass.Student?.AssignedStaff?.User?.name || "N/A"}</strong>
              </p>
              <p>
                Category:{" "}
                <span className={`badge ${pass.Student?.category === "hosteller" ? "badge-warning" : "badge-info"}`}>
                  {pass.Student?.category}
                </span>
              </p>
              <p>
                Return By: <strong>{formatTime(pass.expected_return)}</strong>
              </p>
              <p>
                Reason: <strong>{pass.reason}</strong>
              </p>
              <p>
                Status: <strong>{pass.status}</strong>
              </p>
            </div>
            {showActions && (
              <div className="pass-actions">
                {pass.SecurityLog?.actual_out ? (
                  pass.Student?.category === "hosteller" ? (
                    <button className="btn btn-mark-in" onClick={() => handleMarkIn(pass.gatepass_id)}>
                      Mark IN
                    </button>
                  ) : (
                    <button className="btn btn-mark-out" disabled>
                      Auto expires at 5:30 PM
                    </button>
                  )
                ) : (
                  <button className="btn btn-mark-out" onClick={() => handleMarkOut(pass.gatepass_id)}>
                    Mark OUT
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar role="security" tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />

      <div className="dashboard-main">
        <Navbar user={user} onLogout={logout} />

        <div className="dashboard-content">
          <div className="content-header">
            <h1>Security Guard Dashboard</h1>
            <p>Active, expired, and late pass monitoring</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {activeTab === "active" && (
            <div className="security-container">
              <h2>Active Passes</h2>
              <div className="filters-bar" style={{ marginBottom: "20px", display: "flex", gap: "15px" }}>
                <input
                  type="text"
                  placeholder="Search Name or ID..."
                  className="filter-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
                />
                <select
                  className="filter-select"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              {loading ? <div className="loading">Loading...</div> : renderPassCards(filteredActivePasses, { showActions: true })}
            </div>
          )}

          {activeTab === "checkinout" && <CheckInOut />}

          {activeTab === "expired" && (
            <div className="security-container">
              <h2>Expired Passes (Day Scholar)</h2>
              {loading ? <div className="loading">Loading...</div> : renderPassCards(dashboardPasses.expired || [])}
            </div>
          )}

          {activeTab === "late" && (
            <div className="security-container">
              <h2>Hosteller Late Returns</h2>
              {loading ? <div className="loading">Loading...</div> : renderPassCards(dashboardPasses.late || [])}
            </div>
          )}

          {activeTab === "log" && (
            <div className="security-container">
              <h2>Activity and Movement Log</h2>
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
                    <tr key={log.log_id || log.id}>
                      <td>
                        <code>{log.GatePassGatepassId || log.GatePass?.gatepass_id}</code>
                      </td>
                      <td>{log.GatePass?.Student?.User?.name || "N/A"}</td>
                      <td>{log.GatePass?.Student?.Department?.department_name || "N/A"}</td>
                      <td>
                        {log.actual_in ? (
                          <span className="action-badge in">IN</span>
                        ) : (
                          <span className="action-badge out">OUT</span>
                        )}
                      </td>
                      <td>{log.actual_in ? formatTime(log.actual_in) : formatTime(log.actual_out)}</td>
                      <td>{log.actual_in ? log.CheckedInBy?.name : log.CheckedOutBy?.name || "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="security-container">
              <h2>Completed and Returned History</h2>
              <div className="table-responsive">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Pass ID</th>
                      <th>Student Details</th>
                      <th>Status</th>
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
                          <div style={{ fontSize: "0.8rem", color: "#718096" }}>{pass.reason}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "bold" }}>{pass.Student?.User?.name}</div>
                          <div style={{ fontSize: "0.85rem" }}>
                            {pass.Student?.Department?.department_name} - {pass.Student?.year} Yr
                          </div>
                        </td>
                        <td>{pass.status}</td>
                        <td>
                          <div>{formatTime(pass.SecurityLog?.actual_out)}</div>
                          <div style={{ fontSize: "0.8rem", color: "#4a5568" }}>
                            {pass.SecurityLog?.CheckedOutBy?.name || "Unknown"}
                          </div>
                        </td>
                        <td>
                          <div>{formatTime(pass.SecurityLog?.actual_in)}</div>
                          <div style={{ fontSize: "0.8rem", color: "#4a5568" }}>
                            {pass.SecurityLog?.CheckedInBy?.name || "Unknown"}
                          </div>
                        </td>
                        <td>
                          {pass.SecurityLog?.actual_in && pass.SecurityLog?.actual_out
                            ? formatDuration(pass.SecurityLog.actual_out, pass.SecurityLog.actual_in)
                            : "N/A"}
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
    </div>
  );
};

export default Dashboard;
