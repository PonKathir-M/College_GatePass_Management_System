import { useState, useEffect } from "react";
import axios from "axios";

const PendingApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // gatepass_id being rejected
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/hod/pending", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch pending approvals:", err);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Grant final approval for this gate pass?")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5001/api/hod/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests((prev) => prev.filter((r) => r.gatepass_id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectModal(id);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }
    setActionLoading(rejectModal);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5001/api/hod/reject/${rejectModal}`, { reason: rejectReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests((prev) => prev.filter((r) => r.gatepass_id !== rejectModal));
      setRejectModal(null);
      setRejectReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (t) => t ? t.slice(0, 5) : "N/A";

  if (loading) return <div className="loading-spinner">Loading pending approvals...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="requests-container">
      <h2>⏳ Pending Approvals</h2>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>✅ No pending approvals</p>
          <span>All requests have been reviewed</span>
        </div>
      ) : (
        <div className="approval-card-list">
          {requests.map((req) => (
            <div key={req.gatepass_id} className="approval-card">
              <div className="card-content">
                <div className="student-identity-row">
                  <span className="student-avatar-fallback" style={{ display: "flex" }}>S</span>
                  <div>
                    <h3>{req.Student?.User?.name || "Unknown"}</h3>
                    <small className="student-subtext">
                      {req.Student?.Department?.department_name} · Year {req.Student?.year}
                    </small>
                  </div>
                </div>
                <div className="details">
                  <span>Pass ID: <code>{req.gatepass_id}</code></span>
                  <span>Reason: {req.reason}</span>
                  <span>{formatTime(req.out_time)} → {formatTime(req.expected_return)}</span>
                  <span className="badge status-approved">{req.status}</span>
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
                  onClick={() => openRejectModal(req.gatepass_id)}
                  disabled={actionLoading === req.gatepass_id}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", padding: "28px",
            width: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ marginBottom: "12px", color: "#e53e3e" }}>❌ Reject Gate Pass</h3>
            <p style={{ color: "#718096", marginBottom: "16px" }}>
              Pass ID: <code>{rejectModal}</code>
            </p>
            <textarea
              placeholder="Enter rejection reason (required)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px", borderRadius: "8px",
                border: "1px solid #e2e8f0", fontSize: "0.9rem",
                resize: "vertical", boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  background: "#e53e3e", color: "#fff", border: "none",
                  cursor: "pointer", fontWeight: "600"
                }}
              >
                {actionLoading === rejectModal ? "Rejecting..." : "Confirm Reject"}
              </button>
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  background: "#edf2f7", color: "#4a5568", border: "none",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
