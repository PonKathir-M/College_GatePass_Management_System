import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../styles/student-login.css";

const StudentLogin = () => {
	const { login } = useContext(AuthContext);
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		if (!email || !password) {
			setError("Please enter both email and password");
			setLoading(false);
			return;
		}

		try {
			const response = await axios.post("http://localhost:5001/api/auth/login", {
				email,
				password
			});

			const { token, user } = response.data;

			// Verify that the user is a student
			if (user.role !== "student") {
				setError("This login page is for students only. Please use the correct login page.");
				setLoading(false);
				return;
			}

			login({
				token,
				user: { ...user, role: "student" }
			});

			// Redirect to student dashboard
			navigate("/student");
		} catch (err) {
			console.error("Login error:", err);
			setError(err.response?.data?.message || "Invalid email or password. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="student-login">
			<div className="student-login-container">
				<div className="student-login-card">
					<div className="student-login-header">
						<h1>👨‍🎓 Student Portal</h1>
						<p>College Gate Pass System</p>
					</div>

					<form onSubmit={handleLogin} className="student-login-form">
						{error && (
							<div className="student-error-message">
								<span>❌</span>
								<p>{error}</p>
							</div>
						)}

						<div className="form-group">
							<label htmlFor="email">📧 Email Address</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your college email"
								disabled={loading}
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="password">🔐 Password</label>
							<div className="password-input-wrapper">
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									disabled={loading}
									required
								/>
								<button
									type="button"
									className="toggle-password"
									onClick={() => setShowPassword(!showPassword)}
									disabled={loading}
								>
									{showPassword ? "👁️" : "👁️‍🗨️"}
								</button>
							</div>
						</div>

						<button
							type="submit"
							className="student-login-btn"
							disabled={loading}
						>
							{loading ? (
								<>
									<span className="loader"></span>
									Logging in...
								</>
							) : (
								"🔓 Sign In"
							)}
						</button>
					</form>

					<div className="student-login-footer">
						<p>Don't have login credentials?</p>
						<p className="contact-info">Contact your college administration</p>
					</div>

					<div className="student-login-help">
						<p>
							<a href="/">← Back to Main Login</a>
						</p>
					</div>
				</div>

				<div className="student-login-sidebar">
					<div className="sidebar-content">
						<h2>Welcome to Student Portal</h2>
						<ul className="features-list">
							<li>📝 Apply for gate pass</li>
							<li>📊 Track your requests</li>
							<li>✅ View approvals</li>
							<li>📋 View gate pass history</li>
							<li>👤 Manage your profile</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudentLogin;

