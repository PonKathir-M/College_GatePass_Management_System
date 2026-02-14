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
    { icon: "👨‍💼", label: "Admin", value: "admin", title: "Administrator" },
    { icon: "👨‍🏫", label: "Tutor", value: "staff", title: "Staff/Tutor" },
    { icon: "👔", label: "HOD", value: "hod", title: "Head of Department" },
    { icon: "👨‍🎓", label: "Student", value: "student", title: "Student" },
    { icon: "🚨", label: "Warden", value: "warden", title: "Warden" },
    { icon: "👮", label: "Security", value: "security", title: "Security Guard" }
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
      const response = await axios.post("http://localhost:5000/api/auth/login", {
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
        <div className="login-background">
          <div className="bg-shape bg-shape-1"></div>
          <div className="bg-shape bg-shape-2"></div>
          <div className="bg-shape bg-shape-3"></div>
        </div>

        <div className="login-content">
          <div className="login-header">
            <h1>👨‍💼 Admin Login</h1>
            <p>Enter your credentials to access the dashboard</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(254, 226, 226, 0.9)',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              backdropFilter: 'blur(4px)',
              border: '1px solid #fecaca'
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="admin@college.edu"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                required
                style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                required
                style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? "Authenticating..." : "Login to Dashboard"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminLogin(false);
                setAdminForm({ email: "", password: "" });
                setError("");
              }}
              style={{
                width: '100%',
                marginTop: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              ← Back to Role Selection
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login-background">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>

      <div className="login-content">
        <div className="login-header">
          <h1>College Gate Pass</h1>
          <p>Secure Campus Access Management System</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(254, 226, 226, 0.9)',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            backdropFilter: 'blur(4px)'
          }}>
            ❌ {error}
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
              <span>{role.icon}</span>
              <span className="btn-text">{role.label}</span>
              {loading && <div className="btn-loader"></div>}
            </button>
          ))}
        </div>

        <div className="login-footer">
          <p>Select your role to continue</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            <p>Staff/Tutor? <a href="/staff">Login here</a></p>
            <p>Student? <a href="/student-login">Login here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
