import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import "../styles/analytics.css";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    departmentId: "all",
    category: "all"
  });
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    summary: { total: 0, approved: 0, rejected: 0, pending: 0 },
    trends: [],
    departmentBreakdown: [],
    distribution: []
  });

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1"];

  useEffect(() => {
    fetchDepartments();
    fetchAdvancedStats();
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/department", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments");
    }
  };

  const fetchAdvancedStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams(filters);
      const res = await axios.get(`http://localhost:5000/api/admin/advanced-stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        summary: res.data.summary,
        trends: res.data.trends,
        departmentBreakdown: res.data.department_breakdown,
        distribution: res.data.distribution
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const downloadReport = () => {
    // Simple JSON download for now
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "analytics_report.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading && !stats.summary.total) {
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

  return (
    <div className="analytics-container">
      {/* Stats Grid - Moved to top as per request */}
      <div className="analytics-stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon-circle blue">📊</div>
          <div className="stat-content">
            <p className="stat-label">Total Passes</p>
            <h3 className="stat-value">{stats.summary.total}</h3>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon-circle green">✅</div>
          <div className="stat-content">
            <p className="stat-label">Approved</p>
            <h3 className="stat-value">{stats.summary.approved}</h3>
          </div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-icon-circle yellow">⏳</div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <h3 className="stat-value">{stats.summary.pending}</h3>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon-circle red">❌</div>
          <div className="stat-content">
            <p className="stat-label">Rejected</p>
            <h3 className="stat-value">{stats.summary.rejected}</h3>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-header">
          <h3>📊 Analytics Controls</h3>
          <button onClick={downloadReport} className="download-btn">
            <span className="icon">⬇</span> Export Data
          </button>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="filter-input" />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="filter-input" />
          </div>
          <div className="filter-group">
            <label>Department</label>
            <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange} className="filter-select">
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="filter-select">
              <option value="all">All Categories</option>
              <option value="Day Scholar">Day Scholar</option>
              <option value="Hosteller">Hosteller</option>
            </select>
          </div>
        </div>
      </div>

      <div className="charts-layout">
        {/* Trend Line Chart */}
        <div className="chart-card large">
          <div className="card-header">
            <h3>📈 Gate Pass Trends</h3>
            <select className="chart-range-select">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="chart-card">
          <div className="card-header"><h3>🍰 Status Distribution</h3></div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="chart-card full-width">
          <div className="card-header"><h3>🏢 Department Breakdown</h3></div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40}>
                  {stats.departmentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#a78bfa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
