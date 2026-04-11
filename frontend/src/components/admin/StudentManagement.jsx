import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/management.css";

const StudentManagement = () => {
  const [studentList, setStudentList] = useState([]);
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
    year: "",
    category: "day-scholar",
    parent_phone: "",
    student_mobile_number: "",
    department_id: ""
  });

  const [filterDept, setFilterDept] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchDepartments();
    fetchStudents();
  }, []);

  // ... (keeping fetch methods same)

  const filteredStudents = studentList.filter(student => {
    const studentDeptId = student.Student?.DepartmentDepartmentId;
    const matchesDept = filterDept === "all" || (studentDeptId && studentDeptId.toString() === filterDept);

    // Year matches
    // student.Student.year depends on data type, safe to stringify comparison
    const matchesYear = filterYear === "all" || (student.Student?.year && student.Student.year.toString() === filterYear);

    // Category matches
    const matchesCategory = filterCategory === "all" || (student.Student?.category && student.Student.category.toLowerCase() === filterCategory.toLowerCase());

    return matchesDept && matchesYear && matchesCategory;
  });

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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5001/api/admin/student", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setStudentList(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load student list");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ... (keeping handlers same)

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
      const res = await axios.post("http://localhost:5001/api/admin/student/upload", uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccessMessage(`Upload successful! Added ${res.data.summary.success} students. Failed: ${res.data.summary.failed}.`);
      if (res.data.summary.errors && res.data.summary.errors.length > 0) {
        console.warn("Upload errors:", res.data.summary.errors);
        setError(`Completed with ${res.data.summary.failed} errors. Check console for details.`);
      }
      fetchStudents();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Error uploading file");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.year || !formData.parent_phone || !formData.student_mobile_number || !formData.department_id) {
      setError("Please fill all required fields");
      return;
    }

    if (!editingId && !formData.password) {
      setError("Password is required for new student");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (editingId) {
        // Update student
        const updateData = {
          name: formData.name,
          email: formData.email,
          year: formData.year,
          category: formData.category,
          parent_phone: formData.parent_phone,
          student_mobile_number: formData.student_mobile_number
        };
        await axios.put(
          `http://localhost:5001/api/admin/student/${editingId}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMessage("Student updated successfully!");
      } else {
        // Create new student
        await axios.post(
          "http://localhost:5001/api/admin/student",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMessage("Student added successfully!");
      }

      // Reset form
      setFormData({ name: "", email: "", password: "", year: "", category: "day-scholar", parent_phone: "", student_mobile_number: "", department_id: "" });
      setEditingId(null);
      setShowForm(false);
      setError("");

      // Refresh list
      fetchStudents();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error saving student");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setFormData({
      name: student.name,
      email: student.email,
      password: "",
      year: student.Student?.year || "",
      category: student.Student?.category || "day-scholar",
      parent_phone: student.Student?.parent_phone || "",
      student_mobile_number: student.Student?.student_mobile_number || "",
      department_id: student.Student?.DepartmentDepartmentId || ""
    });
    setEditingId(student.user_id);
    setShowForm(true);
  };

  const handleDeactivateStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to deactivate this student?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5001/api/admin/student/${studentId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccessMessage("Student deactivated successfully!");
      fetchStudents();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Error deactivating student");
    } finally {
      setLoading(false);
    }
  };

  const handleResetStudentPassword = async (student) => {
    if (!window.confirm(`Reset password for ${student.name}? They will be forced to change it on next login.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:5001/api/admin/student/${student.user_id}/reset-password-flag`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccessMessage(
        `Password reset for ${student.name}. Temporary password: ${response.data.temporaryPassword}`
      );
      fetchStudents();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", password: "", year: "", category: "day-scholar", parent_phone: "", student_mobile_number: "", department_id: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>👨‍🎓 Student Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="file" 
            id="student-upload" 
            style={{ display: 'none' }} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileUpload} 
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => document.getElementById('student-upload').click()}
            style={{ backgroundColor: '#10B981', color: 'white' }}
          >
            📤 Upload Excel/CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Student"}
          </button>
        </div>
      </div>

      <div className="filters-bar">
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

        <select
          className="filter-select"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>

        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="day-scholar">Day Scholar</option>
          <option value="hosteller">Hosteller</option>
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
        <form className="management-form" onSubmit={handleAddStudent}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Student Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter student name"
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
              <label htmlFor="year" className="form-label">Year *</label>
              <select
                id="year"
                name="year"
                className="form-input"
                value={formData.year}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Year --</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category" className="form-label">Category *</label>
              <select
                id="category"
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="day-scholar">Day Scholar</option>
                <option value="hosteller">Hosteller</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="parent_phone" className="form-label">Parent Phone *</label>
              <input
                id="parent_phone"
                type="tel"
                name="parent_phone"
                className="form-input"
                value={formData.parent_phone}
                onChange={handleInputChange}
                placeholder="Enter parent phone number"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student_mobile_number" className="form-label">Student Mobile Number *</label>
              <input
                id="student_mobile_number"
                type="tel"
                name="student_mobile_number"
                className="form-input"
                value={formData.student_mobile_number}
                onChange={handleInputChange}
                placeholder="Enter student mobile number"
                required
              />
            </div>
          </div>

          <div className="form-row">
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
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Student" : "Add Student"}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !showForm ? (
        <div className="loading">Loading students...</div>
      ) : (
        <div className="table-responsive">
          <table className="management-table">
            <thead>
              <tr className="table-header">
                <th>Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Category</th>
                <th>Department</th>
                <th>Parent Phone</th>
                <th>Student Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">No students found matching filters</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.user_id}>
                    <td className="student-name">👤 {student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.Student?.year || "N/A"}</td>
                    <td>
                      <span className={`badge badge-${student.Student?.category === "hosteller" ? "warning" : "info"}`}>
                        {student.Student?.category === "hosteller" ? "🏠 Hosteller" : "📍 Day Scholar"}
                      </span>
                    </td>
                    <td>{student.Student?.Department?.department_name || "N/A"}</td>
                    <td>{student.Student?.parent_phone || "N/A"}</td>
                    <td>{student.Student?.student_mobile_number || "N/A"}</td>
                    <td>
                      <span className={`status-badge ${student.active ? "active" : "inactive"}`}>
                        {student.active ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEditStudent(student)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-secondary-action"
                        onClick={() => handleResetStudentPassword(student)}
                      >
                        Reset Password
                      </button>
                      {student.active && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivateStudent(student.user_id)}
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

export default StudentManagement;

