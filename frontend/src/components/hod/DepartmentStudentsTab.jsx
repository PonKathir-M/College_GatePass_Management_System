import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentHistoryModal from "./StudentHistoryModal";
import "../styles/hod-insights.css";

const DepartmentStudentsTab = () => {
  const [rows, setRows] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [filters, setFilters] = useState({
    year: "all",
    search: ""
  });

  const fetchStudents = async (overrideFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/hod/students-history", {
        headers: { Authorization: `Bearer ${token}` },
        params: overrideFilters
      });
      setRows(response.data.students || []);
      setYears(response.data.years || []);
    } catch (err) {
      console.error("Error fetching department students:", err);
      setError("Unable to load department student history list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const applyFilters = () => {
    fetchStudents(filters);
  };

  const getImageSrc = (profilePic) => {
    if (!profilePic) return null;
    if (String(profilePic).startsWith("http://") || String(profilePic).startsWith("https://")) {
      return profilePic;
    }
    return `http://localhost:5001/uploads/${profilePic}`;
  };

  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc.total += row.pass_stats?.total || 0;
      acc.approved += row.pass_stats?.approved || 0;
      acc.rejected += row.pass_stats?.rejected || 0;
      acc.pending += row.pass_stats?.pending || 0;
      return acc;
    }, { total: 0, approved: 0, rejected: 0, pending: 0 });
  }, [rows]);

  return (
    <div className="hod-insights-wrap">
      <div className="insights-header-card">
        <div>
          <h2 className="insights-title">Department Students</h2>
          <p className="insights-subtitle">Filter by year and inspect each student gate pass history.</p>
        </div>
        <button type="button" className="insights-btn" onClick={() => fetchStudents(filters)} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="insights-filter-row">
        <div className="insights-filter-item">
          <label>Year</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
          >
            <option value="all">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{`Year ${year}`}</option>
            ))}
          </select>
        </div>

        <div className="insights-filter-item">
          <label>Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Name / email / tutor / student ID"
          />
        </div>

        <div className="insights-filter-item insights-filter-action">
          <label>&nbsp;</label>
          <button type="button" className="insights-btn" onClick={applyFilters}>Apply Filters</button>
        </div>
      </div>

      <div className="insights-kpi-grid">
        <div className="insight-kpi-card">
          <span>Total Requests</span>
          <strong>{totals.total}</strong>
        </div>
        <div className="insight-kpi-card">
          <span>Approved</span>
          <strong>{totals.approved}</strong>
        </div>
        <div className="insight-kpi-card">
          <span>Rejected</span>
          <strong>{totals.rejected}</strong>
        </div>
        <div className="insight-kpi-card">
          <span>Pending</span>
          <strong>{totals.pending}</strong>
        </div>
      </div>

      {error && <div className="insights-error">{error}</div>}

      <div className="insights-table-card">
        <div className="insights-table-wrap">
          <table className="insights-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Year</th>
                <th>Tutor</th>
                <th>Mobile</th>
                <th>Total</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Pending</th>
                <th>Longest Pass</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="insights-empty">Loading students...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="10" className="insights-empty">No students found for this filter.</td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.student_id}>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar-mini">
                        {row.profile_pic ? (
                          <img src={getImageSrc(row.profile_pic)} alt={row.name} />
                        ) : (
                          <span>{(row.name || "S").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <strong>{row.name}</strong>
                        <small>{row.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{row.year || "-"}</td>
                  <td>{row.tutor_name}</td>
                  <td>{row.student_mobile_number || "-"}</td>
                  <td>{row.pass_stats?.total || 0}</td>
                  <td>{row.pass_stats?.approved || 0}</td>
                  <td>{row.pass_stats?.rejected || 0}</td>
                  <td>{row.pass_stats?.pending || 0}</td>
                  <td>{row.pass_stats?.longestHours || 0} h</td>
                  <td>
                    <button type="button" className="insights-btn small" onClick={() => setSelectedStudentId(row.student_id)}>
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudentId && (
        <StudentHistoryModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
};

export default DepartmentStudentsTab;
