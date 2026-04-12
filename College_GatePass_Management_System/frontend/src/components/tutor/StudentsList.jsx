import { useState, useEffect } from "react";
import api from "../../services/api";

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tutor/my-students");
      setStudents(response.data.students || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching assigned students:", err);
      setError(err.response?.data?.message || "Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3>My Students</h3>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3>My Students</h3>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>My Students ({students.length})</h3>
      {students.length === 0 ? (
        <p>No students assigned to you yet.</p>
      ) : (
        <ul>
          {students.map(s => (
            <li key={s.student_id}>
              <strong>{s.name}</strong> - Year {s.year} ({s.category})
              <br />
              <small>Email: {s.email}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentsList;
