import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/management.css";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDepartments();
    const interval = setInterval(fetchDepartments, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Token:", token);

      const response = await axios.get("http://localhost:5000/api/admin/department", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Departments fetched:", response.data);
      setDepartments(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError(`Failed to load departments: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();

    if (!newDept.trim()) {
      setError("Please enter a department name");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (editingId) {
        // Update department
        await axios.put(
          `http://localhost:5000/api/admin/department/${editingId}`,
          { department_name: newDept },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMessage("Department updated successfully!");
      } else {
        // Create new department
        await axios.post(
          "http://localhost:5000/api/admin/department",
          { department_name: newDept },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMessage("Department added successfully!");
      }

      setNewDept("");
      setEditingId(null);
      setShowForm(false);
      setError("");

      // Refresh list
      fetchDepartments();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error saving department");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setNewDept(dept.department_name);
    setEditingId(dept.department_id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/admin/department/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage("Department deleted successfully!");
      fetchDepartments();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>🏢 Department Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setNewDept("");
            setEditingId(null);
          }}
        >
          + Add Department
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}

      {showForm && (
        <form className="management-form" onSubmit={handleAddDept}>
          <div className="form-group">
            <label htmlFor="dept-name" className="form-label">Department Name</label>
            <input
              id="dept-name"
              type="text"
              className="form-input"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g., Computer Science & Engineering"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowForm(false);
                setNewDept("");
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !showForm ? (
        <div className="loading">Loading departments...</div>
      ) : (
        <div className="table-responsive">
          <table className="management-table">
            <thead>
              <tr className="table-header">
                <th>Department Name</th>
                <th>Staff Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">No departments found</td>
                </tr>
              ) : (
                departments.map(dept => (
                  <tr key={dept.department_id}>
                    <td className="dept-name">🏢 {dept.department_name}</td>
                    <td>
                      <span className="badge badge-secondary">
                        {dept.Staffs?.length || 0} staff
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(dept)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(dept.department_id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
