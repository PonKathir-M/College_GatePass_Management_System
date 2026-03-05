import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import axios from "axios";
import "../styles/analytics.css";

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "180d", label: "Last 180 Days" },
  { value: "365d", label: "Last 1 Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" }
];

const AnalyticsTab = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    range: "30d",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (overrideFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const params = {
        range: overrideFilters.range
      };

      if (overrideFilters.range === "custom") {
        if (overrideFilters.startDate) params.startDate = overrideFilters.startDate;
        if (overrideFilters.endDate) params.endDate = overrideFilters.endDate;
      }

      const response = await axios.get("http://localhost:5001/api/hod/stats", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching HOD analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    if (filters.range === "custom" && (!filters.startDate || !filters.endDate)) {
      setError("Please select both start date and end date for custom range");
      return;
    }
    fetchStats(filters);
  };

  const activeRangeLabel = useMemo(() => {
    if (filters.range === "custom" && filters.startDate && filters.endDate) {
      return `${filters.startDate} to ${filters.endDate}`;
    }
    return RANGE_OPTIONS.find((r) => r.value === filters.range)?.label || "Selected Range";
  }, [filters]);

  if (loading && !stats) {
    return (
      <div className="analytics-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-grid">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="error-message">No analytics data available</div>;
  }

  const pieData = [
    { name: "Approved", value: stats.approved || 0 },
    { name: "Rejected", value: stats.rejected || 0 },
    { name: "Pending", value: stats.pending || 0 }
  ];

  return (
    <div className="analytics-container">
      {error && (
        <div style={{ padding: "15px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "15px", outline: "1px solid #f87171" }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <div className="analytics-stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon-circle blue">{"\uD83D\uDCCA"}</div>
          <div className="stat-content">
            <p className="stat-label">Total Requests</p>
            <h3 className="stat-value">{stats.total || 0}</h3>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon-circle green">{"\u2705"}</div>
          <div className="stat-content">
            <p className="stat-label">Approved</p>
            <h3 className="stat-value">{stats.approved || 0}</h3>
          </div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-icon-circle yellow">{"\u23F3"}</div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <h3 className="stat-value">{stats.pending || 0}</h3>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon-circle red">{"\u274C"}</div>
          <div className="stat-content">
            <p className="stat-label">Rejected</p>
            <h3 className="stat-value">{stats.rejected || 0}</h3>
          </div>
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-header">
          <h3>{"\uD83D\uDCCA"} HOD Department Analytics</h3>
          <button onClick={() => fetchStats(filters)} className="download-btn" type="button" disabled={loading}>
            <span className="icon">{"\uD83D\uDD04"}</span> {loading ? "Loading..." : "Refresh Data"}
          </button>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Time Range</label>
            <select name="range" value={filters.range} onChange={handleFilterChange} className="filter-select">
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {filters.range === "custom" && (
            <>
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
              </div>
            </>
          )}

          <div className="filter-group">
            <label>&nbsp;</label>
            <button type="button" onClick={applyFilters} className="download-btn" style={{ width: "100%" }}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="charts-layout">
        <div className="chart-card large">
          <div className="card-header">
            <h3>{"\uD83D\uDCC8"} Request Trends ({activeRangeLabel})</h3>
          </div>
          <div className="card-body chart-body">
            {stats.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    itemStyle={{ color: "#1f2937", fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: "#3b82f6" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No data available for this period</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>{"\uD83C\uDF70"} Approval Distribution</h3>
          </div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
