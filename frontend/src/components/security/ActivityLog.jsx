import { useState, useEffect } from "react";
import axios from "axios";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/security/logs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch activity logs:", err);
        setError("Failed to load activity log");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatTime = (t) => {
    if (!t) return "—";
    try { return new Date(t).toLocaleString("en-IN"); } catch { return t; }
  };

  const filtered = logs.filter((log) => {
    const name = log.GatePass?.Student?.User?.name?.toLowerCase() || "";
    const passId = (log.GatePassGatepassId || log.GatePass?.gatepass_id || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || passId.includes(q);
  });

  if (loading) return <div className="loading-spinner">Loading logs...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="security-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2>📋 Activity Log</h2>
        <input
          type="text"
          placeholder="Search by name or pass ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "240px" }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>
          <p>No activity log entries found</p>
        </div>
      ) : (
        <table className="activity-table">
          <thead>
            <tr>
              <th>Pass ID</th>
              <th>Student Name</th>
              <th>Department</th>
              <th>Action</th>
              <th>Time</th>
              <th>Security Officer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <td><code>{log.GatePassGatepassId || log.GatePass?.gatepass_id || "—"}</code></td>
                <td>{log.GatePass?.Student?.User?.name || "—"}</td>
                <td>{log.GatePass?.Student?.Department?.department_name || "—"}</td>
                <td>
                  {log.actual_in ? (
                    <span className="action-badge in">✅ IN</span>
                  ) : (
                    <span className="action-badge out">🚪 OUT</span>
                  )}
                </td>
                <td style={{ fontSize: "0.85rem" }}>
                  {log.actual_in ? formatTime(log.actual_in) : formatTime(log.actual_out)}
                </td>
                <td>
                  {log.actual_in
                    ? (log.CheckedInBy?.name || "—")
                    : (log.CheckedOutBy?.name || "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ActivityLog;
