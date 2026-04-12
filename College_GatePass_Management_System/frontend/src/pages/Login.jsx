import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });

  const roles = [
    { icon: "", label: "", value: "admin", title: "Administrator" },
    { icon: "", label: "", value: "staff", title: "Staff/Tutor" },
    { icon: "", label: "", value: "hod", title: "Head of Department" },
    { icon: "", label: "", value: "student", title: "Student" },
    { icon: "", label: "", value: "warden", title: "Warden" },
    { icon: "", label: "", value: "security", title: "Security Guard" }
  ];

  const handleLogin = async (role) => {
    if (role.value === "admin") {
      setShowAdminLogin(true);
      return;
    }

    if (["staff", "hod", "warden", "security"].includes(role.value)) {
      navigate("/staff");
      return;
    }

    if (role.value === "student") {
      navigate("/student-login");
      return;
    }

    setError("This role requires dynamic user creation through the admin panel");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5001/api/auth/login", {
        email: adminForm.email,
        password: adminForm.password
      });

      const { token, user } = response.data;

      if (user.role !== "admin") {
        setError("Invalid admin credentials");
        return;
      }

      login({ token, user });
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (showAdminLogin) {
    return (
      <div className="login">
        <div className="login-content">
          <div className="login-header">
            <h1>👨‍💼 Admin Login</h1>
            <p>College Gate Pass System</p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem"
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ maxWidth: "400px", margin: "0 auto" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "white", fontWeight: "600" }}>
                📧 Email
              </label>
              <input
                type="email"
                placeholder="Enter admin email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid white",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "white", fontWeight: "600" }}>
                🔐 Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid white",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Logging in..." : "🔑 Login"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminLogin(false);
                setAdminForm({ email: "", password: "" });
                setError("");
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "transparent",
                border: "2px solid white",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                color: "white",
                cursor: "pointer",
                marginTop: "1rem"
              }}
            >
              ← Back to Login
            </button>
          </form>
        </div>

        <div className="login-background">
          <div className="bg-shape bg-shape-1"></div>
          <div className="bg-shape bg-shape-2"></div>
          <div className="bg-shape bg-shape-3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login-content">
        <div className="login-header">
          <h1>🎓 College Gate Pass System</h1>
          <p>Secure & Centralized Campus Access Management</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}
          >
            {error}
          </div>
        )}

        <div className="login-container">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => handleLogin(role)}
              disabled={loading}
              className="login-btn"
              title={role.title}
            >
              <span className="btn-emoji" aria-hidden="true">{role.icon}</span>
              <span className="btn-label">{role.label}</span>
              {loading && <div className="btn-loader"></div>}
            </button>
          ))}
        </div>

      </div>

      <div className="login-background">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>
    </div>
  );
};

export default Login;
