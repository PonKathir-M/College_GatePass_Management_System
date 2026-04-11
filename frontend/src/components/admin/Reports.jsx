import { useState, useEffect } from "react";
import axios from "axios";

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("all");
  const [category, setCategory] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchReport();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/admin/department", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (department !== "all") params.append("departmentId", department);
      if (category !== "all") params.append("category", category);

      const res = await axios.get(`http://localhost:5001/api/admin/advanced-stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!stats) return;
    setExporting(true);

    const rows = [
      ["Report: Campus Gate Pass System"],
      ["Generated At", new Date().toLocaleString("en-IN")],
      ["Period", startDate && endDate ? `${startDate} to ${endDate}` : "All Time"],
      [],
      ["SUMMARY"],
      ["Total Requests", stats.summary.total],
      ["Approved", stats.summary.approved],
      ["Rejected", stats.summary.rejected],
      ["Pending", stats.summary.pending],
      [],
      ["DAILY TREND"],
      ["Date", "Count"],
      ...(stats.trends || []).map((t) => [t.date, t.count]),
      [],
      ["DEPARTMENT BREAKDOWN"],
      ["Department", "Requests"],
      ...(stats.department_breakdown || []).map((d) => [d.name, d.value]),
      [],
      ["STATUS DISTRIBUTION"],
      ["Status", "Count"],
      ...(stats.distribution || []).map((d) => [d.name, d.value]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gatepass-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const inputStyle = {
    padding: "9px 12px", borderRadius: "8px",
    border: "1px solid #e2e8f0", fontSize: "0.9rem"
  };

  const cardStyle = (color, bg) => ({
    background: bg, borderRadius: "12px", padding: "20px",
    textAlign: "center", border: `1px solid ${color}30`, flex: 1
  });

  return (
    <div style={{ padding: "0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0 }}>📄 Reports & Export</h2>
          <p style={{ color: "#718096", margin: "4px 0 0" }}>Filter gate pass data and export as CSV</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={exporting || !stats}
          style={{
            padding: "10px 20px", borderRadius: "10px", border: "none",
            background: stats ? "#3182ce" : "#a0aec0", color: "#fff",
            fontWeight: "600", cursor: stats ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          ⬇️ {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff", borderRadius: "12px", padding: "20px",
        border: "1px solid #e2e8f0", marginBottom: "24px",
        display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end"
      }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#4a5568" }}>From Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#4a5568" }}>To Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#4a5568" }}>Department</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle}>
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#4a5568" }}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            <option value="all">All</option>
            <option value="day-scholar">Day Scholar</option>
            <option value="hosteller">Hosteller</option>
          </select>
        </div>
        <button
          onClick={fetchReport}
          style={{
            padding: "10px 20px", borderRadius: "8px", border: "none",
            background: "#553c9a", color: "#fff", fontWeight: "600", cursor: "pointer"
          }}
        >
          🔍 Apply Filters
        </button>
      </div>

      {loading && <div className="loading-spinner">Generating report...</div>}
      {error && <div className="error-message">{error}</div>}

      {stats && !loading && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={cardStyle("#3182ce", "#ebf8ff")}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#2b6cb0" }}>{stats.summary.total}</div>
              <div style={{ color: "#718096", fontSize: "0.85rem" }}>Total Requests</div>
            </div>
            <div style={cardStyle("#38a169", "#f0fff4")}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#276749" }}>{stats.summary.approved}</div>
              <div style={{ color: "#718096", fontSize: "0.85rem" }}>Approved</div>
            </div>
            <div style={cardStyle("#e53e3e", "#fff5f5")}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#9b2335" }}>{stats.summary.rejected}</div>
              <div style={{ color: "#718096", fontSize: "0.85rem" }}>Rejected</div>
            </div>
            <div style={cardStyle("#d69e2e", "#fffff0")}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#744210" }}>{stats.summary.pending}</div>
              <div style={{ color: "#718096", fontSize: "0.85rem" }}>Pending</div>
            </div>
          </div>

          {/* Department Breakdown */}
          {stats.department_breakdown?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "16px" }}>🏢 Department Breakdown</h3>
              {stats.department_breakdown.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <span style={{ width: "160px", fontSize: "0.9rem", color: "#4a5568" }}>{d.name}</span>
                  <div style={{ flex: 1, background: "#edf2f7", borderRadius: "6px", height: "20px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "6px", background: "#3182ce",
                      width: `${(d.value / stats.summary.total) * 100}%`,
                      transition: "width 0.5s"
                    }} />
                  </div>
                  <span style={{ width: "40px", textAlign: "right", fontWeight: "600", color: "#2d3748" }}>{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily Trend Table */}
          {stats.trends?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ marginBottom: "16px" }}>📅 Daily Trend</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#718096" }}>Date</th>
                    <th style={{ padding: "10px", textAlign: "left", color: "#718096" }}>Requests</th>
                    <th style={{ padding: "10px", textAlign: "left", color: "#718096" }}>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.trends.map((t) => (
                    <tr key={t.date} style={{ borderBottom: "1px solid #f7fafc" }}>
                      <td style={{ padding: "9px 10px", color: "#4a5568" }}>{t.date}</td>
                      <td style={{ padding: "9px 10px", fontWeight: "600" }}>{t.count}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{
                          height: "10px", borderRadius: "5px", background: "#bee3f8",
                          width: `${(t.count / Math.max(...stats.trends.map((x) => x.count))) * 100}%`,
                          minWidth: t.count > 0 ? "8px" : "0"
                        }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
