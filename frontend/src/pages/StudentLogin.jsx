import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css"; // Using the central login styles

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
			const response = await axios.post("http://localhost:5000/api/auth/login", {
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
		<div className="login">
			<div className="login-background">
				<div className="bg-shape bg-shape-1"></div>
				<div className="bg-shape bg-shape-2"></div>
				<div className="bg-shape bg-shape-3"></div>
			</div>

			<div className="login-content">
				<div className="login-header">
					<h1>👨‍🎓 Student Portal</h1>
					<p>College Gate Pass System</p>
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

				<form onSubmit={handleLogin}>
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
							📧 Email Address
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your college email"
							disabled={loading}
							required
							style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
						/>
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
							🔐 Password
						</label>
						<div style={{ position: 'relative' }}>
							<input
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								disabled={loading}
								required
								style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								style={{
									position: 'absolute',
									right: '1rem',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									fontSize: '1.2rem',
									padding: 0
								}}
							>
								{showPassword ? "👁️" : "👁️‍🗨️"}
							</button>
						</div>
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
						{loading ? "Logging in..." : "🔓 Sign In"}
					</button>

					<div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
						<a
							href="/"
							style={{
								color: 'rgba(255,255,255,0.7)',
								textDecoration: 'none',
								fontSize: '0.9rem',
								transition: 'color 0.2s'
							}}
							onMouseOver={(e) => e.target.style.color = 'white'}
							onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
						>
							← Back to Main Login
						</a>
					</div>
				</form>
			</div>
		</div>
	);
};

export default StudentLogin;
