import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import "../styles/staff-login.css";

const StaffLogin = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ email, password });
      const { token, user } = response.data;
      const role = String(user.role || "").toLowerCase();

      if (!["staff", "hod", "warden", "security", "admin"].includes(role)) {
        setError("This page is for staff roles only.");
        setLoading(false);
        return;
      }

      login({ token, user: { ...user, role } });

      if (role === "admin") navigate("/admin");
      else if (role === "hod") navigate("/hod");
      else if (role === "warden") navigate("/warden");
      else if (role === "security") navigate("/security");
      else navigate("/tutor");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-auth-page">
      <div className="role-auth-header">
        <h1>GATEPASS MANAGEMENT SYSTEM</h1>
        <div className="role-auth-logo">GPMS</div>
      </div>

      <div className="role-auth-body">
        <div className="role-auth-card">
          <h2>Staff Sign In</h2>

          {error && <div className="role-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <input
              className="role-input"
              type="email"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <input
              className="role-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <button className="role-submit" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="role-footer">
            <span>Thank you.</span>
            <a href="/">Back to website</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
