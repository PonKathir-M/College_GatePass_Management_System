import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { changePassword } from "../services/authService";
import "../styles/force-password-change.css";

const ForcePasswordChange = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rules = [
    { label: "Minimum 6 characters", valid: newPassword.length >= 6 },
    { label: "Passwords match", valid: !!newPassword && newPassword === confirmPassword },
    { label: "Different from current password", valid: !!newPassword && newPassword !== currentPassword }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      setIsSubmitting(false);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      alert("Password changed successfully! Please login with your new password.");
      logout();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="password-reset-page">
      <div className="password-reset-background">
        <div className="password-orb password-orb-one"></div>
        <div className="password-orb password-orb-two"></div>
        <div className="password-grid"></div>
      </div>

      <div className="password-reset-shell">
        <section className="password-reset-aside">
          <div className="password-badge">Secure Account Recovery</div>
          <h1>Update Your Password</h1>
          <p>
            Your account needs a fresh password before you can continue to the
            dashboard. Choose a secure password that you can remember easily.
          </p>

          <div className="password-reset-cards">
            <div className="password-tip-card">
              <strong>Why this matters</strong>
              <span>We require a personal password so shared default credentials are removed.</span>
            </div>
            <div className="password-tip-card">
              <strong>Quick tip</strong>
              <span>Use a mix of letters, numbers, and something unique to you.</span>
            </div>
          </div>

          <div className="password-rules">
            {rules.map((rule) => (
              <div
                key={rule.label}
                className={`password-rule ${rule.valid ? "valid" : ""}`}
              >
                <span className="password-rule-indicator" aria-hidden="true"></span>
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="password-reset-card">
          <div className="password-reset-header">
            <div className="password-icon" aria-hidden="true">Lock</div>
            <div>
              <h2>Change Password</h2>
              <p>Enter your current password and set a new one to continue.</p>
            </div>
          </div>

          {error && (
            <div className="password-reset-error">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="password-reset-form">
            <div className="password-field">
              <label htmlFor="current-password">Current Password</label>
              <div className="password-input-wrap">
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  disabled={isSubmitting}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label htmlFor="new-password">New Password</label>
              <div className="password-input-wrap">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a new password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword((value) => !value)}
                  disabled={isSubmitting}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <div className="password-input-wrap">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="password-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating Password..." : "Save New Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
