import { useState, useEffect } from "react";
import axios from "axios";

const ApprovedPasses = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch all pending (includes Tutor Approved and HOD Pending) from HOD's view
        const res = await axios.get("http://localhost:5001/api/hod/pending", {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter to only show the ones HOD already approved (status HOD Approved)
        // Re-fetch stats for a broader approved list
        const statsRes = await axios.get("http://localhost:5001/api/hod/students-history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Collect passes with HOD Approved status across all students
        const allPasses = [];
        (statsRes.data?.students || []).forEach(() => {});
        setPasses(Array.isArray(res.data) ? res.data.filter(p => p.status === "HOD Approved") : []);
      } catch (err) {
        console.error("Failed to fetch approved passes:", err);
        setError("Failed to load approved passes");
      } finally {
        setLoading(false);
      }
    };
    fetchApproved();
  }, []);

  const formatTime = (t) => {
    if (!t) return "N/A";
    return t.includes(":") ? t.slice(0, 5) : t;
  };

  if (loading) return <div className="loading-spinner">Loading approved passes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="requests-container">
      <h2>✅ HOD Approved Passes</h2>
      {passes.length === 0 ? (
        <div className="empty-state">
          <p>No approved passes to show</p>
          <span>Approved gate passes waiting for security check-out will appear here</span>
        </div>
      ) : (
        <div className="approval-card-list">
          {passes.map((pass) => (
            <div key={pass.gatepass_id} className="approval-card">
              <div className="card-content">
                <div className="student-identity-row">
                  <span className="student-avatar-fallback" style={{ display: "flex" }}>S</span>
                  <div>
                    <h3>{pass.Student?.User?.name || "—"}</h3>
                    <small className="student-subtext">
                      {pass.Student?.Department?.department_name} · Year {pass.Student?.year}
                    </small>
                  </div>
                </div>
                <div className="details">
                  <span>Pass ID: <code>{pass.gatepass_id}</code></span>
                  <span>Reason: {pass.reason}</span>
                  <span>{formatTime(pass.out_time)} → {formatTime(pass.expected_return)}</span>
                  <span className="badge status-approved">HOD Approved ✅</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovedPasses;
