import { useState } from "react";
import axios from "axios";

const CheckInOut = () => {
  const [passId, setPassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const clearMessages = () => {
    setTimeout(() => { setResult(null); setError(null); }, 5000);
  };

  const handleMarkOut = async () => {
    if (!passId.trim()) { setError("Please enter a Gate Pass ID"); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5001/api/security/mark-out",
        { gatepass_id: passId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ type: "out", message: res.data.message, time: new Date().toLocaleTimeString("en-IN") });
      setPassId("");
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark OUT");
      clearMessages();
    } finally { setLoading(false); }
  };

  const handleMarkIn = async () => {
    if (!passId.trim()) { setError("Please enter a Gate Pass ID"); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5001/api/security/mark-in",
        { gatepass_id: passId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ type: "in", message: res.data.message, status: res.data.status, time: new Date().toLocaleTimeString("en-IN") });
      setPassId("");
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark IN");
      clearMessages();
    } finally { setLoading(false); }
  };

  return (
    <div className="security-container">
      <h2>🔐 Manual Check-In / Check-Out</h2>
      <p style={{ color: "#718096", marginBottom: "24px" }}>
        Enter the Gate Pass ID to manually mark a student's entry or exit from campus.
      </p>

      <div style={{
        maxWidth: "480px", margin: "0 auto",
        background: "#fff", borderRadius: "16px",
        padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2d3748" }}>
            Gate Pass ID
          </label>
          <input
            type="text"
            placeholder="e.g. GP-2024-001"
            value={passId}
            onChange={(e) => setPassId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleMarkOut()}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: "10px",
              border: "2px solid #e2e8f0", fontSize: "1rem", boxSizing: "border-box",
              letterSpacing: "0.05em", fontFamily: "monospace",
              outline: "none", transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#3182ce"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            disabled={loading}
            autoFocus
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button
            onClick={handleMarkOut}
            disabled={loading}
            style={{
              padding: "14px", borderRadius: "10px", border: "none",
              background: loading ? "#a0aec0" : "#e53e3e",
              color: "#fff", fontSize: "1rem", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s", display: "flex",
              alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            🚪 {loading ? "Processing..." : "Mark OUT"}
          </button>
          <button
            onClick={handleMarkIn}
            disabled={loading}
            style={{
              padding: "14px", borderRadius: "10px", border: "none",
              background: loading ? "#a0aec0" : "#38a169",
              color: "#fff", fontSize: "1rem", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s", display: "flex",
              alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            ✅ {loading ? "Processing..." : "Mark IN"}
          </button>
        </div>

        {/* Result messages */}
        {result && (
          <div style={{
            marginTop: "20px", padding: "16px", borderRadius: "10px",
            background: result.type === "in" ? "#f0fff4" : "#fff5f5",
            border: `1px solid ${result.type === "in" ? "#9ae6b4" : "#fed7d7"}`,
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "4px" }}>
              {result.type === "in" ? "✅" : "🚪"}
            </div>
            <div style={{ fontWeight: "700", color: result.type === "in" ? "#276749" : "#9b2335" }}>
              {result.message}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "4px" }}>
              Time: {result.time}
              {result.status && <span> · Status: <strong>{result.status}</strong></span>}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: "20px", padding: "16px", borderRadius: "10px",
            background: "#fff5f5", border: "1px solid #fed7d7", textAlign: "center"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>⚠️</div>
            <div style={{ fontWeight: "600", color: "#9b2335" }}>{error}</div>
          </div>
        )}

        <p style={{
          marginTop: "20px", fontSize: "0.8rem", color: "#a0aec0",
          textAlign: "center", lineHeight: "1.5"
        }}>
          💡 Day scholars: Mark OUT when leaving. Mark IN only if returning before 5:30 PM.<br />
          Hosteliers: Always mark both OUT and IN.
        </p>
      </div>
    </div>
  );
};

export default CheckInOut;
