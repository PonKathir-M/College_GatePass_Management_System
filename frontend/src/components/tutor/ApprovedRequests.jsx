import { useState, useEffect } from "react";
import axios from "axios";

const ApprovedRequests = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/tutor/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch approval history:", err);
        setError("Failed to load approval history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (t) => {
    if (!t) return "N/A";
    return t.includes(":") ? t.slice(0, 5) : t;
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading history...</p></div>;
  if (error) return <div className="error-banner"><span>❌</span><p>{error}</p></div>;

  return (
    <div className="requests-container">
      <h2>📋 My Approval History</h2>
      {history.length === 0 ? (
        <div className="empty-state">
          <p>📭 No approvals yet</p>
          <span>Your decisions will appear here</span>
        </div>
      ) : (
        <div className="requests-table">
          <table>
            <thead>
              <tr>
                <th>Gate Pass ID</th>
                <th>Student</th>
                <th>Reason</th>
                <th>Out Time</th>
                <th>Return</th>
                <th>Decision</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const pass = entry.GatePass || entry;
                const approved = entry.approved;
                return (
                  <tr key={entry.id || pass.gatepass_id}>
                    <td><code>{pass.gatepass_id || "—"}</code></td>
                    <td>{pass.Student?.User?.name || "—"}</td>
                    <td>{pass.reason || "—"}</td>
                    <td>{formatTime(pass.out_time)}</td>
                    <td>{formatTime(pass.expected_return)}</td>
                    <td>
                      <span className={`badge ${approved ? "badge-success" : "badge-danger"}`}>
                        {approved ? "✅ Approved" : "❌ Rejected"}
                      </span>
                      {!approved && entry.reason && (
                        <div style={{ fontSize: "0.75rem", color: "#e53e3e", marginTop: "4px" }}>
                          {entry.reason}
                        </div>
                      )}
                    </td>
                    <td>{formatDate(entry.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApprovedRequests;
