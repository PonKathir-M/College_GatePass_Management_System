import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import "../../styles/student-profile.css";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalPasses: 0, pending: 0, rejected: 0, attendance: "95%" });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch History for Stats & Chart
      const historyRes = await axios.get("http://localhost:5000/api/student/gatepass", { headers });
      const passes = historyRes.data || [];

      // Calculate Stats
      const total = passes.length;
      const pending = passes.filter(p => p.status.includes("Pending")).length;
      const rejected = passes.filter(p => p.status === "Rejected").length;

      setStats({
        totalPasses: total,
        pending,
        rejected,
        attendance: "95%" // Placeholder
      });

      // Process Chart Data (Passes per Month)
      const monthlyData = {};
      passes.forEach(pass => {
        const date = new Date(pass.createdAt);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const chartArray = Object.keys(monthlyData).map(key => ({
        name: key,
        passes: monthlyData[key]
      }));
      setChartData(chartArray);

      // 2. Fetch Profile Details
      try {
        const profileRes = await axios.get("http://localhost:5000/api/student/profile", { headers });
        const sData = profileRes.data.student || {};
        const uData = profileRes.data.user || {};

        setProfile({
          name: uData.name || user.name,
          email: uData.email || user.email,
          role: uData.role || user.role,
          student_id: sData.student_id,
          department: sData.Department?.department_name || "Unknown",
          year: sData.year,
          category: sData.category || "Student",
          parent_phone: sData.parent_phone
        });
      } catch (e) {
        setProfile({
          name: user.name,
          email: user.email,
          role: user.role,
          department: "Loading...",
          year: "...",
          category: "..."
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Profile fetch error", err);
      setLoading(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading Profile...</div>;

  const displayUser = profile || user;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>🎓 My Student Portfolio</h1>
        <p>Manage your academic identity and gate pass records</p>
      </div>

      <div className="profile-content">
        {/* Left Col: Digital ID Card */}
        <div className="profile-left">
          <div className="digital-id-card">
            <div className="id-card-header">
              <div className="college-logo">🏛️</div>
              <div className="college-name">CAMPUS GATE</div>
            </div>
            <div className="id-card-body">
              <div className="profile-image-container">
                <div className="profile-avatar">
                  {displayUser.name ? displayUser.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              <div className="student-details">
                <h2>{displayUser.name}</h2>
                <div className="detail-row">
                  <span className="label">ID No:</span>
                  <span className="value">#{displayUser.student_id || displayUser.user_id || "STU-001"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Dept:</span>
                  <span className="value">{displayUser.department || "Unknown"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Year:</span>
                  <span className="value">{displayUser.year || "N/A"}</span>
                </div>
                <div className="detail-card-footer">
                  <span className="role-badge">{displayUser.category || "Student"}</span>
                  <div className="qr-code-placeholder">QR</div>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>📋 Personal Information</h3>
            <div className="info-row">
              <strong>📧 Email:</strong> <span>{displayUser.email}</span>
            </div>
            <div className="info-row">
              <strong>📞 Parent Contact:</strong> <span>{displayUser.parent_phone || "Not Updated"}</span>
            </div>
            <div className="info-row">
              <strong>📍 Address:</strong> <span>Campus Hostel</span>
            </div>
            <button className="btn-edit-profile">✏️ Edit Details</button>
          </div>
        </div>

        {/* Right Col: Stats & Chart */}
        <div className="profile-right">
          <div className="stats-grid">
            <div className="stat-card blue">
              <h3>{stats.totalPasses}</h3>
              <p>Total Passes</p>
            </div>
            <div className="stat-card orange">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
            <div className="stat-card red">
              <h3>{stats.rejected}</h3>
              <p>Rejected</p>
            </div>
            <div className="stat-card green">
              <h3>{stats.attendance}</h3>
              <p>Attendance</p>
            </div>
          </div>

          <div className="chart-section" style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '30px' }}>
            <h3>📊 Gate Pass Activity Trend</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(66, 153, 225, 0.1)' }}
                  />
                  <Bar dataKey="passes" fill="#667eea" radius={[5, 5, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartData.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', marginTop: '-150px' }}>No data available for chart</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
