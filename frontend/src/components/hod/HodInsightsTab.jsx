import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/hod-insights.css";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "180d", label: "Last 180 Days" },
  { value: "365d", label: "Last 1 Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" }
];

const HodInsightsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    range: "30d",
    startDate: "",
    endDate: ""
  });

  const fetchInsights = async (overrideFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const params = { range: overrideFilters.range };
      if (overrideFilters.range === "custom") {
        if (overrideFilters.startDate) params.startDate = overrideFilters.startDate;
        if (overrideFilters.endDate) params.endDate = overrideFilters.endDate;
      }

      const response = await axios.get("http://localhost:5001/api/hod/insights", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setData(response.data);
    } catch (err) {
      console.error("Error fetching HOD insights:", err);
      setError("Unable to load department insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const applyFilters = () => {
    if (filters.range === "custom" && (!filters.startDate || !filters.endDate)) {
      setError("Please choose both start and end date for custom range.");
      return;
    }
    fetchInsights(filters);
  };

  const topYear = data?.totals?.top_year;
  const topYearTiedRaw = data?.totals?.top_year_tied || [];
  const topStudent = data?.totals?.top_student;
  const topStudentsTiedRaw = data?.totals?.top_students_tied || [];
  const longestPass = data?.totals?.longest_pass;
  const longestPassesTiedRaw = data?.totals?.longest_passes_tied || [];
  const topTutor = useMemo(() => data?.totals?.top_tutor || data?.tutor_breakdown?.[0] || null, [data]);
  const topTutorsTiedRaw = data?.totals?.top_tutors_tied || [];

  const topYearTied = topYearTiedRaw.length > 0
    ? topYearTiedRaw
    : (topYear ? [topYear] : []);
  const topStudentsTied = topStudentsTiedRaw.length > 0
    ? topStudentsTiedRaw
    : (topStudent ? [topStudent] : []);
  const longestPassesTied = longestPassesTiedRaw.length > 0
    ? longestPassesTiedRaw
    : (longestPass ? [longestPass] : []);
  const topTutorsTied = topTutorsTiedRaw.length > 0
    ? topTutorsTiedRaw
    : (topTutor ? [topTutor] : []);

  const compactNames = (items, key, max = 2) => {
    if (!items || items.length === 0) return "-";
    const names = [...new Set(items.map((item) => item?.[key]).filter(Boolean))];
    if (names.length === 0) return "-";
    const shown = names.slice(0, max).join(", ");
    const remaining = names.length - max;
    return remaining > 0 ? `${shown} +${remaining}` : shown;
  };

  const compactYears = (items, max = 2) => {
    if (!items || items.length === 0) return "-";
    const labels = items.map((item) => item?.year).filter((y) => y !== undefined && y !== null).map((y) => `Year ${y}`);
    if (labels.length === 0) return "-";
    const shown = labels.slice(0, max).join(", ");
    const remaining = labels.length - max;
    return remaining > 0 ? `${shown} +${remaining}` : shown;
  };

  return (
    <div className="hod-insights-wrap">
      <div className="insights-header-card">
        <div>
          <h2 className="insights-title">Department Insights</h2>
          <p className="insights-subtitle">Top year, top student, tutor-wise performance and longest pass patterns.</p>
        </div>
        <button type="button" className="insights-btn" onClick={() => fetchInsights(filters)} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="insights-filter-row">
        <div className="insights-filter-item">
          <label>Time Range</label>
          <select
            value={filters.range}
            onChange={(e) => setFilters((prev) => ({ ...prev, range: e.target.value }))}
          >
            {RANGE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        {filters.range === "custom" && (
          <>
            <div className="insights-filter-item">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="insights-filter-item">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </>
        )}

        <div className="insights-filter-item insights-filter-action">
          <label>&nbsp;</label>
          <button type="button" className="insights-btn" onClick={applyFilters}>Apply Filters</button>
        </div>
      </div>

      {error && <div className="insights-error">{error}</div>}

      <div className="insights-kpi-grid">
        <div className="insight-kpi-card">
          <span>Top Year</span>
          <strong>{topYear ? compactYears(topYearTied) : "-"}</strong>
          <small>
            {topYear
              ? `${topYear.total} requests${topYearTied.length > 1 ? ` (${topYearTied.length} years tied)` : ""}`
              : "No data"}
          </small>
        </div>
        <div className="insight-kpi-card">
          <span>Top Student</span>
          <strong>{topStudent ? compactNames(topStudentsTied, "name") : "-"}</strong>
          <small>
            {topStudent
              ? `${topStudent.total} requests${topStudentsTied.length > 1 ? ` (${topStudentsTied.length} students tied)` : ""}`
              : "No data"}
          </small>
        </div>
        <div className="insight-kpi-card">
          <span>Longest Pass</span>
          <strong>{longestPass ? `${longestPass.duration_hours} h` : "-"}</strong>
          <small>
            {longestPass
              ? `${compactNames(longestPassesTied, "student_name")}${longestPassesTied.length > 1 ? ` (${longestPassesTied.length} tied)` : ""}`
              : "No data"}
          </small>
        </div>
        <div className="insight-kpi-card">
          <span>Top Tutor</span>
          <strong>{topTutor ? compactNames(topTutorsTied, "tutor_name") : "-"}</strong>
          <small>
            {topTutor
              ? `${topTutor.total} requests${topTutorsTied.length > 1 ? ` (${topTutorsTied.length} tutors tied)` : ""}`
              : "No data"}
          </small>
        </div>
      </div>

      <div className="insights-grid-2">
        <div className="insights-table-card">
          <h3>Year-wise Request Progress</h3>
          <div className="insights-table-wrap">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {!loading && (data?.year_stats || []).length > 0 ? (
                  data.year_stats.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{row.total}</td>
                      <td>{row.approved}</td>
                      <td>{row.rejected}</td>
                      <td>{row.pending}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="insights-empty">{loading ? "Loading..." : "No data available"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="insights-table-card">
          <h3>Tutor-wise Breakdown</h3>
          <div className="insights-table-wrap">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {!loading && (data?.tutor_breakdown || []).length > 0 ? (
                  data.tutor_breakdown.map((row) => (
                    <tr key={row.tutor_name}>
                      <td>{row.tutor_name}</td>
                      <td>{row.total}</td>
                      <td>{row.approved}</td>
                      <td>{row.rejected}</td>
                      <td>{row.pending}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="insights-empty">{loading ? "Loading..." : "No data available"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="insights-table-card">
        <h3>Top Students by Gate Pass Count</h3>
        <div className="insights-table-wrap">
          <table className="insights-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Year</th>
                <th>Tutor</th>
                <th>Total</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {!loading && (data?.top_students || []).length > 0 ? (
                data.top_students.map((row) => (
                  <tr key={row.student_id}>
                    <td>{row.name}</td>
                    <td>{row.year || "-"}</td>
                    <td>{row.tutor_name}</td>
                    <td>{row.total}</td>
                    <td>{row.approved}</td>
                    <td>{row.rejected}</td>
                    <td>{row.pending}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="insights-empty">{loading ? "Loading..." : "No data available"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HodInsightsTab;
