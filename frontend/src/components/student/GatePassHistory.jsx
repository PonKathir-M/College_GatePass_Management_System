import { useState, useEffect } from "react";
import "../styles/history.css";
import { getMyPasses } from "../../services/studentService";

const GatePassHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getMyPasses();
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load gate pass history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  const getStatusColor = (status) => {
    if (status === "Approved" || status === "HOD Approved") return "approved";
    if (status === "Rejected") return "rejected";
    return "pending";
  };

  if (loading) return <div className="loading-spinner">Loading history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const totalRequests = history.length;
  const approved = history.filter(p => p.status === "Approved" || p.status === "HOD Approved").length;
  const rejected = history.filter(p => p.status === "Rejected").length;

  return (
    <div className="history-container">
      <h2>📋 Gate Pass History</h2>

      {history.length === 0 ? (
        <div className="no-history">
          <p>No gate pass requests found.</p>
        </div>
      ) : (
        <div className="history-timeline">
          {history.map((pass) => (
            <div key={pass.gatepass_id} className={`history-item status-${getStatusColor(pass.status)}`}>
              <div className="timeline-marker"></div>

              <div className="history-content">
                <div className="history-header">
                  <div>
                    <h4>{pass.gatepass_id}</h4>
                    <p className="history-date">{formatDate(pass.createdAt)}</p>
                  </div>
                  <span className={`status-badge ${getStatusColor(pass.status)}`}>
                    {(pass.status === "Approved" || pass.status === "HOD Approved") && "✅"}
                    {pass.status === "Rejected" && "❌"}
                    {!["Approved", "HOD Approved", "Rejected"].includes(pass.status) && "⏳"}
                    {pass.status}
                  </span>
                </div>

                <div className="history-details">
                  <p><strong>Reason:</strong> {pass.reason}</p>
                  {pass.out_time && <p><strong>Time:</strong> {formatTime(pass.out_time)} - {formatTime(pass.expected_return)}</p>}
                  {pass.rejection_reason && <p><strong>Reason:</strong> {pass.rejection_reason}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="history-stats">
        <div className="stat">
          <span className="stat-icon">📄</span>
          <p>Total Requests: <strong>{totalRequests}</strong></p>
        </div>
        <div className="stat">
          <span className="stat-icon">✅</span>
          <p>Approved: <strong>{approved}</strong></p>
        </div>
        <div className="stat">
          <span className="stat-icon">❌</span>
          <p>Rejected: <strong>{rejected}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default GatePassHistory;

