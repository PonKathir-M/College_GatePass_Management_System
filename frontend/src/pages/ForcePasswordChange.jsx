import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // Reusing login styles

const ForcePasswordChange = () => {
    const { user, logout } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/auth/change-password",
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update user in local storage to remove flag (hacky but works until refresh)
            const updatedUser = { ...user, needs_password_change: false };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Ideally force a logout or update context, but let's try pushing to dashboard
            // Better: Logout and ask to login again
            alert("Password changed successfully! Please login with your new password.");
            logout();
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to change password");
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
                    <h1>🔐 Change Password</h1>
                    <p>You must change your password to continue.</p>
                </div>

                {error && <div className="alert alert-error" style={{ maxWidth: '450px', margin: '0 auto 1rem', padding: '1rem', background: '#ef444420', border: '1px solid #ef444450', borderRadius: '12px', color: '#fca5a5' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0' }}>Current Password</label>
                        <input
                            type="password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0' }}>New Password</label>
                        <input
                            type="password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0' }}>Confirm New Password</label>
                        <input
                            type="password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForcePasswordChange;
