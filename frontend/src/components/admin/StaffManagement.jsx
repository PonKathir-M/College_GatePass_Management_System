import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/management.css";

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [totalDeptStudentsMap, setTotalDeptStudentsMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    department_id: ""
  });

  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");

  const filteredStaff = staffList.filter(staff => {
    const matchesRole = filterRole === "all" || staff.role === filterRole;

    // Safety check for staff.Staff and department
    const staffDeptId = staff.Staff?.DepartmentDepartmentId;
    const matchesDept = filterDept === "all" || (staffDeptId && staffDeptId.toString() === filterDept);

    return matchesRole && matchesDept;
  });

  // Fetch departments and staff on mount
  useEffect(() => {
    fetchDepartments();
    fetchStaff();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found in localStorage");
        return;
      }

      const response = await axios.get("http://localhost:5001/api/admin/department", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err) {
      console.error("Error fetching departments:", err.message);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch staff and students simultaneously
      const [staffRes, studentRes] = await Promise.all([
        axios.get("http://localhost:5001/api/admin/staff", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("http://localhost:5001/api/admin/student", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStaffList(staffRes.data);
      
      // Calculate total students per department
      const allStudents = studentRes.data;
      const deptCounts = {};
      allStudents.forEach(stu => {
        const dId = stu.Student?.DepartmentDepartmentId;
        if(dId) {
          deptCounts[dId] = (deptCounts[dId] || 0) + 1;
        }
      });
      setTotalDeptStudentsMap(deptCounts);
      
      setError("");
    } catch (err) {
      setError("Failed to load staff or student lists");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5001/api/admin/staff/upload", uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccessMessage(`Upload successful! Added ${res.data.summary.success} users. Failed: ${res.data.summary.failed}.`);
      if (res.data.summary.errors && res.data.summary.errors.length > 0) {
        console.warn("Upload errors:", res.data.summary.errors);
        setError(`Completed with ${res.data.summary.failed} errors. Check console for details.`);
      }
      fetchStaff();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Error uploading file");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();

    const isDeptRequired = ["staff", "hod"].includes(formData.role);
    if (!formData.name || !formData.email || (isDeptRequired && !formData.department_id)) {
      setError("Please fill all required fields");
      return;
    }

    if (!editingId && !formData.password) {
      setError("Password is required for new staff");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (editingId) {
        // Update staff
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role
        };
        await axios.put(
          `http://localhost:5001/api/admin/staff/${editingId}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMessage("Staff updated successfully!");
      } else {
        // Create new staff
        await axios.post(
          "http://localhost:5001/api/admin/staff",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMessage("Staff added successfully!");
      }

      // Reset form
      setFormData({ name: "", email: "", password: "", role: "staff", department_id: "" });
      setEditingId(null);
      setShowForm(false);
      setError("");

      // Refresh list
      fetchStaff();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error saving staff");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = (staff) => {
    setFormData({
      name: staff.name,
      email: staff.email,
      password: "",
      role: staff.role,
      department_id: staff.Staff?.DepartmentDepartmentId || ""
    });
    setEditingId(staff.user_id);
    setShowForm(true);
  };

  const handleDeactivateStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to deactivate this staff member?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5001/api/admin/staff/${staffId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccessMessage("Staff deactivated successfully!");
      fetchStaff();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Error deactivating staff");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", password: "", role: "staff", department_id: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>👨‍🏫 Staff Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="file" 
            id="staff-upload" 
            style={{ display: 'none' }} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileUpload} 
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => document.getElementById('staff-upload').click()}
            style={{ backgroundColor: '#10B981', color: 'white' }}
          >
            📤 Upload Excel/CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="staff">Staff</option>
          <option value="hod">HOD</option>
          <option value="warden">Warden</option>
          <option value="security">Security</option>
        </select>

        <select
          className="filter-select"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.department_name}
            </option>
          ))}
        </select>
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
        <form className="management-form" onSubmit={handleAddStaff}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Staff Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter staff name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password {editingId ? "(Leave blank to keep current)" : "*"}
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={editingId ? "Leave blank to keep current password" : "Enter password"}
                required={!editingId}
              />
            </div>
            <div className="form-group">
              <label htmlFor="role" className="form-label">Role *</label>
              <select
                id="role"
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="staff">Staff</option>
                <option value="hod">HOD</option>
                <option value="warden">Warden</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            {["staff", "hod"].includes(formData.role) && (
              <div className="form-group">
                <label htmlFor="department_id" className="form-label">Department *</label>
                <select
                  id="department_id"
                  name="department_id"
                  className="form-input"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Staff" : "Add Staff"}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !showForm ? (
        <div className="loading">Loading staff...</div>
      ) : (
        <div className="table-responsive">
          <table className="management-table">
            <thead>
              <tr className="table-header">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Dept Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No staff members found matching filters</td>
                </tr>
              ) : (
                filteredStaff.map(staff => (
                  <tr key={staff.user_id}>
                    <td className="staff-name">👤 {staff.name}</td>
                    <td>{staff.email}</td>
                    <td>
                      <span className={`badge badge-${staff.role === "hod" ? "primary" : "secondary"}`}>
                        {staff.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{staff.Staff?.Department?.department_name || "N/A"}</td>
                    <td>
                      <span className="badge badge-info">
                        {totalDeptStudentsMap[staff.Staff?.DepartmentDepartmentId] || 0} students
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${staff.active ? "active" : "inactive"}`}>
                        {staff.active ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEditStaff(staff)}
                      >
                        ✏️ Edit
                      </button>
                      {staff.active && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivateStaff(staff.user_id)}
                        >
                          ⛔ Deactivate
                        </button>
                      )}
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

export default StaffManagement;

