import { useState, useEffect } from "react";
import "../styles/gatepass-form.css";
import { applyGatePass, getProfile } from "../../services/studentService";

const ApplyGatePass = () => {
  const [form, setForm] = useState({
    reason: "",
    out_time: "",
    expected_return: "",
    category: "day-scholar"
  });

  const [submitted, setSubmitted] = useState(false);
  const [passId, setPassId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCategory, setUserCategory] = useState(null);

  const reasons = [
    "Medical",
    "Family Emergency",
    "Official Work",
    "Recreation",
    "Shopping",
    "Other"
  ];

  // Fetch user's student category on mount
  useEffect(() => {
    const fetchUserCategory = async () => {
      try {
        const response = await getProfile();
        // Get student category from profile
        if (response.data && response.data.student) {
          const category = response.data.student.category || "Day Scholar"; // Default to Day Scholar if missing
          setUserCategory(category);
          setForm(prev => ({ ...prev, category: category }));
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
    fetchUserCategory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.reason || !form.out_time || !form.expected_return) {
      setError("Please fill all fields");
      return;
    }

    // Validate times
    if (form.out_time >= form.expected_return) {
      setError("Expected return time must be after out time");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await applyGatePass({
        reason: form.reason,
        out_time: form.out_time,
        expected_return: form.expected_return
      });

      setPassId(response.data.gatepass_id);
      setSubmitted(true);

      // Reset form after 4 seconds
      setTimeout(() => {
        setForm({
          reason: "",
          out_time: "",
          expected_return: "",
          category: userCategory || "day-scholar"
        });
        setSubmitted(false);
        setPassId(null);
      }, 4000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to submit gate pass request";
      setError(errorMessage);
      console.error("Error submitting gate pass:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Check if it's before 9:15 AM (for hostellers)
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours * 60 + minutes;
  };

  const isBeforeWardenTime = getCurrentTime() < 9 * 60 + 15;
  const isAfterSecurityTime = getCurrentTime() >= 17 * 60 + 15;

  const canApply = !(form.category === "hosteller" && isAfterSecurityTime);

  return (
    <div className="gatepass-form-container">
      {submitted ? (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h3>Gate Pass Request Submitted Successfully!</h3>
          <p>Your Gate Pass ID: <strong>{passId}</strong></p>
          <p>Your request is now under review. You'll receive notifications on status updates.</p>
        </div>
      ) : (
        <>
          <div className="form-card">
            <h2>📝 Apply for Gate Pass</h2>

            {!canApply && (
              <div className="warning-box">
                ⚠️ Hostellers cannot apply for gate pass after 5:15 PM. Regular exit timings apply.
              </div>
            )}

            {error && (
              <div className="error-box">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">Student Category</label>
                  <input
                    id="category"
                    name="category"
                    value={form.category}
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason" className="form-label">Reason for Gate Pass</label>
                  <select
                    id="reason"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">-- Select a reason --</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="outTime" className="form-label">Out Time</label>
                  <input
                    id="outTime"
                    type="time"
                    name="out_time"
                    value={form.out_time}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expectedReturn" className="form-label">Expected Return Time</label>
                  <input
                    id="expectedReturn"
                    type="time"
                    name="expected_return"
                    value={form.expected_return}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-info">
                {form.category === "hosteller" && isBeforeWardenTime && (
                  <div className="info-box">
                    ℹ️ <strong>Hosteller Morning Rule:</strong> Your request will go to Warden first. If approved, Tutor approval will be skipped.
                  </div>
                )}

                {form.category === "day-scholar" && (
                  <div className="info-box">
                    ℹ️ <strong>Day Scholar:</strong> Your request will go to Tutor → HOD for approval.
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!canApply || loading}
              >
                {loading ? "⏳ Submitting..." : "🚪 Submit Gate Pass Request"}
              </button>
            </form>
          </div>

          <div className="workflow-info">
            <h3>📊 Approval Workflow</h3>
            <div className="workflow-steps">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Submit Request</h4>
                  <p>Fill and submit your gate pass details</p>
                </div>
              </div>

              <div className="workflow-arrow">→</div>

              <div className="workflow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Tutor Review</h4>
                  <p>Your Tutor reviews and approves</p>
                </div>
              </div>

              <div className="workflow-arrow">→</div>

              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>HOD Approval</h4>
                  <p>Final approval from HOD</p>
                </div>
              </div>

              <div className="workflow-arrow">→</div>

              <div className="workflow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Gate Pass Granted</h4>
                  <p>You're ready to exit campus</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ApplyGatePass;
