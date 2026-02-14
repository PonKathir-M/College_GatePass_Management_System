import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/management.css";

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
    category: "Day Scholar",
    parent_phone: "",
    department_id: "",
    profile_pic: null // File object
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [filterDept, setFilterDept] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchDepartments();
    fetchStudents();
  }, []);

  const filteredStudents = studentList.filter(student => {
    const studentDeptId = student.Student?.DepartmentDepartmentId;
    const matchesDept = filterDept === "all" || (studentDeptId && studentDeptId.toString() === filterDept);

    const matchesYear = filterYear === "all" || (student.Student?.year && student.Student.year.toString() === filterYear);
    const matchesCategory = filterCategory === "all" || (student.Student?.category && student.Student.category.toLowerCase() === filterCategory.toLowerCase());

    return matchesDept && matchesYear && matchesCategory;
  });

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://localhost:5000/api/admin/department", {
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
      const response = await axios.get("http://localhost:5000/api/admin/student", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setStudentList(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load student list");
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profile_pic: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.year || !formData.parent_phone || !formData.department_id) {
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

      // Use FormData for file upload
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      if (formData.password) data.append("password", formData.password);
      data.append("year", formData.year);
      data.append("category", formData.category);
      data.append("parent_phone", formData.parent_phone);
      data.append("department_id", formData.department_id);
      if (formData.profile_pic) {
        data.append("profile_pic", formData.profile_pic);
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      if (editingId) {
        // Update student
        await axios.put(
          `http://localhost:5000/api/admin/student/${editingId}`,
          data,
          { headers }
        );
        setSuccessMessage("Student updated successfully!");
      } else {
        // Create new student
        await axios.post(
          "http://localhost:5000/api/admin/student",
          data,
          { headers }
        );
        setSuccessMessage("Student added successfully!");
      }

      // Reset form
      setFormData({ name: "", email: "", password: "", year: "", category: "Day Scholar", parent_phone: "", department_id: "", profile_pic: null });
      setImagePreview(null);
      setEditingId(null);
      setShowForm(false);
      setError("");

      fetchStudents();
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
      category: student.Student?.category || "Day Scholar",
      parent_phone: student.Student?.parent_phone || "",
      department_id: student.Student?.DepartmentDepartmentId || "",
      profile_pic: null
    });

    if (student.Student?.profile_pic) {
      setImagePreview(`http://localhost:5000/uploads/${student.Student.profile_pic}`);
    } else {
      setImagePreview(null);
    }

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
        `http://localhost:5000/api/admin/student/${studentId}/deactivate`,
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

  const handleResetPasswordFlag = async (studentId) => {
    if (!window.confirm("Allow this student to change their password again (and reset to default)?")) return;

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/admin/student/${studentId}/reset-password-flag`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccessMessage("Student permitted to change password.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update student permission");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file");
      return;
    }

    try {
      setUploadLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post("http://localhost:5000/api/admin/student/upload", formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const { summary } = res.data;
      if (summary.failed > 0) {
        setError(`Upload partial success. Success: ${summary.success}, Failed: ${summary.failed}. Errors: ${summary.errors.join('; ')}`);
      } else {
        setSuccessMessage(`Successfully uploaded ${summary.success} students!`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }

      fetchStudents();
    } catch (err) {
      console.error("CSV Upload Error:", err);
      setError(err.response?.data?.message || "Error uploading CSV");
    } finally {
      setUploadLoading(false);
      // Reset input
      e.target.value = null;
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", password: "", year: "", category: "Day Scholar", parent_phone: "", department_id: "", profile_pic: null });
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>👨‍🎓 Student Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className={`btn ${uploadLoading ? 'btn-disabled' : 'btn-outline'}`} style={{ cursor: uploadLoading ? 'not-allowed' : 'pointer' }}>
            {uploadLoading ? "Uploading..." : "📂 Upload CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              disabled={uploadLoading}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Student"}
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
          ))}
        </select>
        <select className="filter-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
        <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="Day Scholar">Day Scholar</option>
          <option value="Hosteller">Hosteller</option>
        </select>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}
      {successMessage && <div className="alert alert-success">✅ {successMessage}</div>}

      {showForm && (
        <form className="management-form" onSubmit={handleAddStudent}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <label className="form-label" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Profile Photo</label>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', marginBottom: '1rem', border: '3px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#cbd5e1' }}>👤</div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginLeft: '40px' }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Student Name *</label>
              <input id="name" type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} placeholder="Enter name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email *</label>
              <input id="email" type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} placeholder="Enter email" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password {editingId ? "(Leave blank to keep)" : "*"}</label>
              <input id="password" type="password" name="password" className="form-input" value={formData.password} onChange={handleInputChange} placeholder={editingId ? "Leave blank to keep" : "Enter password"} required={!editingId} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department_id" className="form-label">Department *</label>
              <select id="department_id" name="department_id" className="form-input" value={formData.department_id} onChange={handleInputChange} required>
                <option value="">-- Select Department --</option>
                {departments.map(dept => (
                  <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="year" className="form-label">Year *</label>
              <select id="year" name="year" className="form-input" value={formData.year} onChange={handleInputChange} required>
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
              <select id="category" name="category" className="form-input" value={formData.category} onChange={handleInputChange} required>
                <option value="Day Scholar">Day Scholar</option>
                <option value="Hosteller">Hosteller</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="parent_phone" className="form-label">Parent Phone *</label>
              <input id="parent_phone" type="tel" name="parent_phone" className="form-input" value={formData.parent_phone} onChange={handleInputChange} placeholder="Enter phone" required />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading}>{loading ? "Saving..." : editingId ? "Update Student" : "Add Student"}</button>
            <button type="button" className="btn btn-outline" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )
      }

      {
        loading && !showForm ? <div className="loading">Loading students...</div> : (
          <div className="table-responsive">
            <table className="management-table">
              <thead>
                <tr className="table-header">
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Year</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="9" className="text-center">No students found</td></tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.user_id}>
                      <td>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', border: '1px solid #cbd5e1' }}>
                          {student.Student?.profile_pic ? (
                            <img
                              src={`http://localhost:5000/uploads/${student.Student.profile_pic}`}
                              alt={student.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.textContent = '👤'; }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                          )}
                        </div>
                      </td>
                      <td className="student-name">{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.Student?.year}</td>
                      <td><span className={`badge badge-${student.Student?.category === "Hosteller" ? "warning" : "info"}`}>{student.Student?.category === "Hosteller" ? "🏠 Hosteller" : "📍 Day Scholar"}</span></td>
                      <td>{student.Student?.Department?.department_name}</td>
                      <td>{student.Student?.parent_phone}</td>
                      <td><span className={`status-badge ${student.active ? "active" : "inactive"}`}>{student.active ? "🟢 Active" : "🔴 Inactive"}</span></td>
                      <td className="action-buttons">
                        <button className="btn btn-sm btn-primary" onClick={() => handleEditStudent(student)}>✏️</button>
                        <button className="btn btn-sm btn-outline" onClick={() => handleResetPasswordFlag(student.user_id)} title="Allow Pwd Change">🔐</button>
                        {student.active && <button className="btn btn-sm btn-danger" onClick={() => handleDeactivateStudent(student.user_id)}>⛔</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      }
    </div >
  );
};

export default StudentManagement;
