import { useState, useEffect } from "react";
import axios from "axios";

const DepartmentStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    fetchStats();
  }, [range]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5001/api/hod/stats?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch department stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading statistics...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;

  const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="requests-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>📊 Department Statistics</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 3 Months</option>
          <option value="365d">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Requests", value: stats.total, color: "#4a5568", bg: "#edf2f7", icon: "📋" },
          { label: "Approved", value: stats.approved, color: "#276749", bg: "#f0fff4", icon: "✅" },
          { label: "Rejected", value: stats.rejected, color: "#9b2335", bg: "#fff5f5", icon: "❌" },
          { label: "Pending", value: stats.pending, color: "#744210", bg: "#fffff0", icon: "⏳" },
          { label: "Approval Rate", value: `${approvalRate}%`, color: "#2b6cb0", bg: "#ebf8ff", icon: "📈" },
        ].map((card) => (
          <div key={card.label} style={{
            background: card.bg, borderRadius: "12px", padding: "16px",
            textAlign: "center", border: `1px solid ${card.color}20`
          }}>
            <div style={{ fontSize: "1.8rem" }}>{card.icon}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "700", color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "4px" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Chart Data Table */}
      {stats.chartData && stats.chartData.length > 0 && (
        <div>
          <h3 style={{ marginBottom: "12px", color: "#2d3748" }}>📅 Daily Breakdown</h3>
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gate Pass Requests</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {stats.chartData.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.count}</td>
                    <td>
                      <div style={{
                        height: "10px", borderRadius: "5px", background: "#bee3f8",
                        width: `${Math.min((day.count / Math.max(...stats.chartData.map(d => d.count))) * 100, 100)}%`,
                        minWidth: day.count > 0 ? "10px" : "0"
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentStats;
