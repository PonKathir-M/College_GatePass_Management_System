import { useState } from "react";
import axios from "axios";
import "../styles/student-assignment-card.css";

const StudentAssignmentCard = ({ student, isAssignedToMe, onAssignmentChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5001/api/tutor/student-history/${student.student_id}`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data);
    } catch (err) {
      alert("Failed to load history: " + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAssign = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/tutor/assign/${student.student_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssignmentChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign student");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm("Are you sure you want to unassign this student?")) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/tutor/unassign/${student.student_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssignmentChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unassign student");
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = student.AssignedStaffStaffId !== null && student.AssignedStaffStaffId !== undefined;
  const assignedBy = student.AssignedStaff?.User?.name;

  return (
    <div className="student-assignment-card" style={showHistory ? { transform: 'none', position: 'static' } : {}}>
      <div className="card-header">
        <div className="student-avatar">👤</div>
        <div className="student-info">
          <h3 className="student-name">{student.User.name}</h3>
          <p className="student-id">ID: {student.student_id}</p>
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">📚 Year:</span>
          <span className="value">{student.year}nd Year</span>
        </div>
        <div className="info-row">
          <span className="label">📧 Email:</span>
          <span className="value">{student.User.email}</span>
        </div>
        <div className="info-row">
          <span className="label">📞 Parent Phone:</span>
          <span className="value">{student.parent_phone || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="label">Student Mobile:</span>
          <span className="value">{student.student_mobile_number || "N/A"}</span>
        </div>
      </div>

      <div className="card-status">
        {isAssigned ? (
          <div className="assigned-status">
            {isAssignedToMe ? (
              <>
                <span className="status-badge assigned">✅ Assigned to You</span>
                <div style={{ display: "flex", gap: "5px", width: "100%" }}>
                  <button
                    className="btn btn-unassign"
                    onClick={handleUnassign}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? "Processing..." : "🗑️ Unassign"}
                  </button>
                  <button
                    className="btn btn-history"
                    onClick={fetchHistory}
                    style={{ flex: 1, backgroundColor: "#0284c7", color: "white", padding: "8px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                  >
                    🕒 History
                  </button>
                </div>
              </>
            ) : (
              <div className="assigned-to-other">
                <span className="status-badge other">🔒 Assigned to {assignedBy}</span>
                <p className="hint">This student is already assigned to another staff member</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="status-badge unassigned">⭕ Not Assigned</span>
            <button
              className="btn btn-assign"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? "Processing..." : "✋ Assign to Me"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="card-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "10px", width: "80%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #334155", paddingBottom: "10px" }}>
              <h2>{student.User.name}'s Leave History</h2>
              <button 
                onClick={() => setShowHistory(false)} 
                style={{ background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            {historyLoading ? (
              <p>Loading history...</p>
            ) : history.length === 0 ? (
              <p>No past requests found.</p>
            ) : (
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    <th style={{ padding: "8px" }}>Reason</th>
                    <th style={{ padding: "8px" }}>Out Time</th>
                    <th style={{ padding: "8px" }}>Return Time</th>
                    <th style={{ padding: "8px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(pass => (
                    <tr key={pass.gatepass_id} style={{ borderBottom: "1px solid #334155", backgroundColor: "transparent", color: "white" }}>
                      <td style={{ padding: "8px", backgroundColor: "transparent" }}>{pass.reason}</td>
                      <td style={{ padding: "8px", backgroundColor: "transparent" }}>{pass.out_time ? pass.out_time.slice(0,5) : "N/A"}</td>
                      <td style={{ padding: "8px", backgroundColor: "transparent" }}>{pass.expected_return ? pass.expected_return.slice(0,5) : "N/A"}</td>
                      <td style={{ padding: "8px", backgroundColor: "transparent" }}>
                        <span style={{ 
                          padding: "3px 8px", borderRadius: "12px", fontSize: "0.8rem", 
                          backgroundColor: pass.status.includes('Approved') ? '#22c55e' : pass.status === 'Rejected' ? '#ef4444' : '#f59e0b',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}>
                          {pass.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentCard;

