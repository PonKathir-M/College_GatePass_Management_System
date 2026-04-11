import { useState, useEffect } from "react";
import axios from "axios";

const GrantedPasses = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5001/api/security/approved-passes${search ? `?search=${search}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch granted passes:", err);
      setError("Failed to load approved passes");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOut = async (gatepass_id) => {
    if (!window.confirm("Mark this student as OUT from campus?")) return;
    setActionLoading(gatepass_id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/security/mark-out",
        { gatepass_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Student marked OUT ✅");
      setTimeout(() => setSuccess(null), 3000);
      fetchPasses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark OUT");
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkIn = async (gatepass_id) => {
    if (!window.confirm("Mark this student as returned IN to campus?")) return;
    setActionLoading(gatepass_id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/security/mark-in",
        { gatepass_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Student marked IN ✅");
      setTimeout(() => setSuccess(null), 3000);
      fetchPasses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark IN");
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (t) => {
    if (!t) return "N/A";
    if (t.includes("T")) return new Date(t).toLocaleString("en-IN");
    return t.slice(0, 5);
  };

  if (loading) return <div className="loading">Loading approved passes...</div>;

  return (
    <div className="security-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2>🎫 Granted Passes</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPasses()}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "240px" }}
          />
          <button
            onClick={fetchPasses}
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#3182ce", color: "#fff", border: "none", cursor: "pointer" }}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "12px" }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: "12px" }}>{success}</div>}

      {passes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>
          <p style={{ fontSize: "1.1rem" }}>✅ No approved passes waiting</p>
          <span style={{ fontSize: "0.9rem" }}>All students are on campus or no approved passes yet</span>
        </div>
      ) : (
        <div className="passes-grid">
          {passes.map((pass) => {
            const isOut = !!pass.SecurityLog?.actual_out;
            const isDayScholar = pass.Student?.category !== "hosteller";
            return (
              <div key={pass.gatepass_id} className="pass-card">
                <div className="pass-header">
                  <h3>{pass.Student?.User?.name || "Unknown"}</h3>
                  <span className="pass-id">{pass.gatepass_id}</span>
                </div>
                <div className="pass-details">
                  <p><strong>{pass.Student?.Department?.department_name}</strong> — Year {pass.Student?.year}</p>
                  {pass.Student?.roll_no && <p>Roll No: <strong>{pass.Student.roll_no}</strong></p>}
                  <p>
                    Category: <span className={`badge ${isDayScholar ? "badge-info" : "badge-warning"}`}>
                      {pass.Student?.category}
                    </span>
                  </p>
                  <p>Reason: <strong>{pass.reason}</strong></p>
                  <p>Out: <strong>{formatTime(pass.out_time)}</strong> | Return: <strong>{formatTime(pass.expected_return)}</strong></p>
                  <p>Status: <strong>{pass.status}</strong></p>
                  {isOut && <p style={{ color: "#e53e3e", fontWeight: "600" }}>🚪 Checked Out at {formatTime(pass.SecurityLog?.actual_out)}</p>}
                </div>
                <div className="pass-actions">
                  {!isOut ? (
                    <button
                      className="btn btn-mark-out"
                      onClick={() => handleMarkOut(pass.gatepass_id)}
                      disabled={actionLoading === pass.gatepass_id}
                    >
                      {actionLoading === pass.gatepass_id ? "..." : "🚪 Mark OUT"}
                    </button>
                  ) : isDayScholar ? (
                    <button className="btn btn-mark-out" onClick={() => handleMarkIn(pass.gatepass_id)} disabled={actionLoading === pass.gatepass_id}>
                      {actionLoading === pass.gatepass_id ? "..." : "✅ Mark IN (Early Return)"}
                    </button>
                  ) : (
                    <button
                      className="btn btn-mark-in"
                      onClick={() => handleMarkIn(pass.gatepass_id)}
                      disabled={actionLoading === pass.gatepass_id}
                    >
                      {actionLoading === pass.gatepass_id ? "..." : "✅ Mark IN"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrantedPasses;
